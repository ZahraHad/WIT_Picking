import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Raycaster,
  Vector2,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IFCLoader } from "web-ifc-three";

import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 2);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

//IFC loading
const loadingScreen = document.getElementById("loader-container");

const progressText = document.getElementById("progress-text");

const Loader = new IFCLoader();

const input = document.getElementById("file-input");

Loader.ifcManager.setupThreeMeshBVH(
  computeBoundsTree,
  acceleratedRaycast,
  disposeBoundsTree
);

const ifcModels = [];

input.addEventListener(
  "change",
  async (event) => {
    // la première fois ça n'a pas marché car les fichiers wasm étaient dans nodes
    // modules, il fallait les mettre dans le repertoire racine du projet
    // une autre option c'est de rajouter le path comme suit :
    // await Loader.ifcManager.setWasmPath('/nodes_modules/....')
    
    eventList = event.target.files
    console.log("eventList : " + eventList)
    console.log("eventList[0] : " + eventList[0])
    console.log("eventList[1] : " + eventList[1])
    console.log("eventList[0][0] : " + eventList[0][0])
    console.log("eventList[0][1] : " + eventList[0][1])
    const ifcURL = URL.createObjectURL(event.target.files[0]);
    console.log("URL : " + ifcURL)
    const model = await Loader.loadAsync(ifcURL);
    console.log("model : " + model); 
    console.log("model[0]: " + model[0]); 
    console.log("model[1]: " + model[1]); 
    scene.add(model);
    ifcModels.push(model);
    console.log("ifcModels : " + ifcModels)
  }
);

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

// we create a function that cast a ray from mouse
function cast(event) {
  //bounds: get the size of the canvas element in order to compute the position of the mouse in the screen
  //because the canvas element may not occupy all the screen
  const bounds = threeCanvas.getBoundingClientRect();

  const x1 = event.clientX - bounds.left;
  const x2 = bounds.right - bounds.left;
  mouse.x = (x1 / x2) * 2 - 1;

  const y1 = event.clientY - bounds.top;
  const y2 = bounds.bottom - bounds.top;
  mouse.y = -(y1 / y2) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const listOut = raycaster.intersectObjects(ifcModels);
  console.log("IfcModels : " + ifcModels)
  console.log("listOut : " + listOut)
  return listOut[0];
}

// we create another function that picks the raycasted object
function pick(event) {
  //create an object 'found' with the raycasting function above 
  const found = cast(event);
  console.log("found : " + found)
  // if there is no object found return
  if (!found) return;
  // otherwise we instanciate the index (the index of the face the raycaster collided with),
  // a geometry (retrieve the geometry of the object), id (which is the id of the object that collided with the raycaster
  // and that has geometry and index as arguments )
  const index = found.faceIndex;
  const geometry = found.object.geometry;
  const ifc = Loader.ifcManager
  const id = ifc.getExpressId(geometry,index)
  console.log(id)
}

threeCanvas.ondblclick = (event) => pick(event)