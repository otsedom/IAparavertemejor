import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { shaders } from "./shaders_code.js";

let renderer, camera, scene, video;
let uniforms = [];
let camcontrols;
let plane, info; // Referencia al plano para redimensionarlo

//Gestión temporal shaders
const clock = new THREE.Clock();
let lastChange;
const tsalto = 2.0; //tiempo entre shaders
let currentshader = 0;

init();
requestAnimationFrame(render);

function vertexShader() {
  return `
        varying vec2 vUv; 
        
        void main() {
            vUv = uv; 

            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
    `;
}

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.left = "50%";
  info.style.transform = "translateX(-50%)";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "#111827";
  info.style.padding = "10px 20px";
  info.style.borderRadius = "8px";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.style.display = "inline-block";
  info.innerHTML = shaders[currentshader].name;
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  video = document.getElementById("video");

  const tx = new THREE.VideoTexture(video);
  tx.colorSpace = THREE.SRGBColorSpace;

  lastChange = 0;

  uniforms = {
    texture1: { value: tx },
    u_time: {
      type: "f",
      value: 0.0,
    },
    u_scale: {
      type: "f",
      value: 1.0,
    },
    u_resolution: {
      type: "v2",
      value: new THREE.Vector2(),
    },
    u_mouse: {
      type: "v2",
      value: new THREE.Vector2(),
    },
    color: {
      value: new THREE.Color(),
    },
  };

  plane = PlanoShader(0, 0, 0);

  camcontrols = new OrbitControls(camera, renderer.domElement);

  //Dimensiones iniciales
  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const constraints = {
      video: { width: 1280, height: 720, facingMode: "user" },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        // apply the stream to the video element used in the texture
        video.srcObject = stream;
        video.play();

        // Redimensionar el plano cuando el video esté listo
        video.addEventListener("loadedmetadata", updatePlaneSize);
      })
      .catch(function (error) {
        console.error("Unable to access the camera/webcam.", error);
      });
  } else {
    console.error("Interfaz MediaDevices no disponible.");
  }
}

function updatePlaneSize() {
  if (!video.videoWidth || !video.videoHeight) return;

  const videoAspect = video.videoWidth / video.videoHeight;
  const windowAspect = window.innerWidth / window.innerHeight;

  // Calcula el tamaño visible de la escena en la posición del plano (z=0)
  const distance = camera.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
  const visibleWidth = visibleHeight * windowAspect;

  let planeWidth, planeHeight;

  // Ajusta el plano para que ocupe el máximo espacio manteniendo el aspect ratio
  if (videoAspect > windowAspect) {
    // Video más ancho que la ventana
    planeWidth = visibleWidth * 0.95; // 95% del ancho visible
    planeHeight = planeWidth / videoAspect;
  } else {
    // Video más alto que la ventana
    planeHeight = visibleHeight * 0.95; // 95% del alto visible
    planeWidth = planeHeight * videoAspect;
  }

  plane.geometry.dispose();
  plane.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
}

//Redimensionado de la ventana
function onWindowResize(e) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;

  updatePlaneSize();
}

//Movimiento del ratón
window.addEventListener("mousemove", (event) => {
  // Calcula la posición del ratón normalizada
  const mouseX = event.clientX / window.innerWidth;
  const mouseY = 1.0 - event.clientY / window.innerHeight; // Invertimos Y para que 0,0 esté en la esquina inferior izquierda

  // Actualiza el uniforme u_mouse
  uniforms.u_mouse.value.set(mouseX, mouseY);
});

function PlanoShader(px, py, pz) {
  let geometry = new THREE.PlaneGeometry(1, 1); // Tamaño inicial temporal

  //Color aleatorio
  uniforms.color.value.set(Math.random() * 0xffffff);

  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: shaders[currentshader].fragment,
  });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);

  scene.add(mesh);

  return mesh; // Devolver el mesh para poder redimensionarlo
}

function render() {
  //Incrementa tiempo
  uniforms.u_time.value += 0.05;

  const elapsed = clock.getElapsedTime(); // tiempo total desde el inicio (en segundos)

  // Si han pasado más de 10 segundos desde el último cambio…
  if (elapsed - lastChange >= tsalto) {
    // Hacer algo aquí
    console.log("Cambio de shader");

    // Actualizar el marcador de tiempo
    lastChange = elapsed;

    //Siguiente shader
    currentshader += 1;
    if (currentshader > shaders.length - 1) currentshader = 0;
    //console.log("Cambia shader", currentshader);
    //Actualiza shader del material
    plane.material.fragmentShader = shaders[currentshader].fragment;
    info.innerHTML = shaders[currentshader].name;
    plane.material.needsUpdate = true;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
