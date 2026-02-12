import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { shaders } from "./shaders_code.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { TRIANGULATION } from "./face_triangulation";
import { load, YOLO_V5_N_COCO_MODEL_CONFIG } from "yolov5js";

let renderer, camera, scene, video;
let uniforms = [];
let camcontrols;
let plane, info, sphere, bengala; // Referencia al plano para redimensionarlo
let tx, txPrev;

//MediaPipe
let facedetector = null;
let handdetector = null;
let canvas, ctx;
let canvasPrev, ctxPrev; // Canvas para el fotograma anterior
let isDetecting = false;
let lastFacePredictions = null;
let lastHandPredictions = null;
let lastYOLOPredictions = null;

//YOLO
let yolomodel = null;

const CLASS_TRANSLATIONS = {
  person: "persona",
  bicycle: "bicicleta",
  car: "coche",
  motorcycle: "motocicleta",
  airplane: "avión",
  bus: "autobús",
  train: "tren",
  truck: "camión",
  boat: "barco",
  traffic_light: "semáforo",
  fire_hydrant: "hidrante",
  stop_sign: "señal de alto",
  parking_meter: "parquímetro",
  bench: "banco",
  bird: "pájaro",
  cat: "gato",
  dog: "perro",
  horse: "caballo",
  sheep: "oveja",
  cow: "vaca",
  elephant: "elefante",
  bear: "oso",
  zebra: "cebra",
  giraffe: "jirafa",
  backpack: "mochila",
  umbrella: "paraguas",
  handbag: "bolso",
  tie: "corbata",
  suitcase: "maleta",
  bottle: "botella",
  cup: "taza",
  fork: "tenedor",
  knife: "cuchillo",
  spoon: "cuchara",
  bowl: "cuenco",
  banana: "plátano",
  apple: "manzana",
  sandwich: "sándwich",
  orange: "naranja",
  broccoli: "brócoli",
  carrot: "zanahoria",
  hot_dog: "perrito caliente",
  pizza: "pizza",
  donut: "dona",
  cake: "pastel",
  chair: "silla",
  couch: "sofá",
  potted_plant: "planta",
  bed: "cama",
  dining_table: "mesa",
  toilet: "inodoro",
  tv: "televisión",
  laptop: "portátil",
  mouse: "ratón",
  remote: "control remoto",
  keyboard: "teclado",
  cell_phone: "teléfono",
  microwave: "microondas",
  oven: "horno",
  toaster: "tostadora",
  sink: "fregadero",
  refrigerator: "refrigerador",
  book: "libro",
  clock: "reloj",
  vase: "jarrón",
  scissors: "tijeras",
  teddy_bear: "oso de peluche",
  hair_dryer: "secador",
  toothbrush: "cepillo de dientes",
};

const BOX_COLORS = [
  "#FF3838",
  "#FF9D97",
  "#FF701F",
  "#FFB21D",
  "#CFD231",
  "#48F90A",
  "#92CC17",
  "#3DDB86",
  "#1A9334",
  "#00D4BB",
  "#2C99A8",
  "#00C2FF",
  "#344593",
  "#6473FF",
  "#0018EC",
  "#8438FF",
  "#520085",
  "#CB38FF",
  "#FF95C8",
  "" + "#FF37C7",
];
const BOX_LINE_WIDTH = 2;
const FONT_COLOR = "#FFFFFF";
const FONT_SIZE = 24;
const FONT = FONT_SIZE + "px sans-serif";

//Partículñas
const PARTICLE_COUNT = 150;

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // pulgar
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // índice
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // medio
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // anular
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // meñique
  [0, 17], // base palma
];

const FINGERS = {
  thumb: [0, 1, 2, 3, 4],
  index: [0, 5, 6, 7, 8],
  middle: [0, 9, 10, 11, 12],
  ring: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

//Gestión temporal shaders
const clock = new THREE.Clock();
let lastChange;
const tsalto = 60.0; //tiempo en segundos entre shaders
let currentshader = 16;

//Shaders activos
// 0 RGB
// 1 Planos I
// 2 Planos II
// 3 Grises
// 4 Inversión
// 5 Warhol
// 6 Bordes BN
// 7 Bordes
// 8 Umbralizado
// 9 Diferencias
// 10 Movimiento
// 11 Flujo I
// 12 Flujo II
// 13 Pixelado
// 14 Pixelado tablero
// 15 Lentejuelas I
// 16 Lentejuelas II
// 17 Alma Haser
// 18 Cara
// 19 Payaso
// 20 Manos
//21 YOLO
//const shaderhub = Array.from({ length: shaders.length }, (_, i) => i); // Por defecto, todos los del repo
const shaderhub = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21,
];

// Variables para gestión de logos
let logoInicial;
let logoInferior;
let mostrandoLogoInicial = true;
const tiempoLogoInicial = 5.0; // segundos

// Detectar si es dispositivo móvil
const esDispositivoMovil = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

////////////////////////////////////////////////////////////////////
init();

async function updateYOLO() {
  if (isDetecting || !yolomodel) return;

  isDetecting = true;
  try {
    //const predictions;
    const predictions = await yolomodel.detect(canvas);

    // Convierte al formato esperado
    lastYOLOPredictions = predictions;

    console.log("Objetos YOLO detectados: " + predictions.length);
  } catch (error) {
    console.error("Error en detección YOLO:", error);
    lastHandPredictions = null;
  } finally {
    isDetecting = false;
  }
}

// En updateHands():
async function updateHands() {
  if (isDetecting || !handdetector) return;

  isDetecting = true;
  try {
    const predictions = await handdetector.estimateHands(canvas);

    // Convierte al formato esperado
    lastHandPredictions = predictions;

    console.log("Manos detectadas: " + predictions.length);
  } catch (error) {
    console.error("Error en detección de manos:", error);
    lastHandPredictions = null;
  } finally {
    isDetecting = false;
  }
}

async function updateFaces() {
  if (isDetecting || !facedetector) return;

  isDetecting = true;
  try {
    const predictions = await facedetector.estimateFaces(canvas, {
      flipHorizontal: false,
    });

    lastFacePredictions = predictions;
    //console.log("Caras detectadas: " + predictions.length);
  } catch (error) {
    //console.error("Error en detección:", error);
    lastFacePredictions = null;
  } finally {
    isDetecting = false;
  }
}

// Dibuja manos simple con todos los elementos
function drawYOLOv0(predictions) {
  if (!predictions || !predictions.length) return;

  predictions.forEach((prediction) => {
    const label = prediction.class + ": " + prediction.score.toFixed(1);
    const boxColor = BOX_COLORS[prediction.classId % 20];
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = BOX_LINE_WIDTH;
    ctx.strokeRect(
      prediction.x,
      prediction.y,
      prediction.width,
      prediction.height
    );
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = boxColor;
    ctx.fillRect(prediction.x, prediction.y, labelWidth + 4, FONT_SIZE + 4);
    ctx.fillStyle = FONT_COLOR;
    ctx.fillText(label, prediction.x, prediction.y);
  });
}

function drawYOLO(predictions) {
  if (!predictions || !predictions.length) return;

  predictions.forEach((prediction) => {
    const className = CLASS_TRANSLATIONS[prediction.class] || prediction.class;

    const label = className + ": " + prediction.score.toFixed(1);

    const boxColor = BOX_COLORS[prediction.classId % 20];

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = BOX_LINE_WIDTH;

    ctx.strokeRect(
      prediction.x,
      prediction.y,
      prediction.width,
      prediction.height
    );

    // 👇 AUMENTAR TAMAÑO DE TEXTO
    //const fontSize = 22;  // prueba 18, 20, 24, 28…
    ctx.font = `${FONT_SIZE}px Arial`;
    ctx.textBaseline = "top";

    const labelWidth = ctx.measureText(label).width;

    ctx.fillStyle = boxColor;
    ctx.fillRect(prediction.x, prediction.y, labelWidth + 6, FONT_SIZE + 6);

    ctx.fillStyle = FONT_COLOR;
    ctx.fillText(label, prediction.x + 3, prediction.y + 3);
  });
}

function drawFaceMesh(predictions, style = "Cara") {
  if (!predictions || !predictions.length) return;

  predictions.forEach((face) => {
    const keypoints = face.keypoints;

    // Calcula el tamaño de la cara para escalar el círculo de la nariz
    // Usando la distancia entre los ojos como referencia
    const leftEye = keypoints[33]; // Ojo izquierdo (exterior)
    const rightEye = keypoints[263]; // Ojo derecho (exterior)

    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );

    // El radio de la nariz será proporcional a la distancia entre ojos
    // Ajusta el factor (0.15) para hacer la nariz más grande o más pequeña
    const noseRadius = eyeDistance * 0.15;

    if (style === "Payaso") {
      // Estilo payaso: malla gris con nariz roja

      // Dibuja los puntos clave en gris
      ctx.fillStyle = "#808080";

      keypoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Dibuja la triangulación en gris
      ctx.strokeStyle = "#80808066";
      ctx.lineWidth = 1;

      for (let i = 0; i < TRIANGULATION.length; i += 3) {
        const points = [
          TRIANGULATION[i],
          TRIANGULATION[i + 1],
          TRIANGULATION[i + 2],
        ].map((index) => keypoints[index]);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();
        ctx.stroke();
      }

      // Dibuja círculo rojo en la punta de la nariz
      const noseTip = keypoints[4];

      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(noseTip.x, noseTip.y, noseRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#8B0000";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (style === "Cara") {
      // Estilo normal: malla verde original

      ctx.fillStyle = "#00FF00";

      keypoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.strokeStyle = "#00FF0088";
      ctx.lineWidth = 1;

      for (let i = 0; i < TRIANGULATION.length; i += 3) {
        const points = [
          TRIANGULATION[i],
          TRIANGULATION[i + 1],
          TRIANGULATION[i + 2],
        ].map((index) => keypoints[index]);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (style === "minimal") {
      // Estilo minimal: solo puntos clave sin triangulación

      ctx.fillStyle = "#FFFFFF";

      keypoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (style === "none") {
      // No dibuja nada (útil para desactivar temporalmente)
      return;
    }
  });
}

// Dibuja manos simple con todos los elementos
function drawHandv0(predictions) {
  if (!predictions || !predictions.length) return;

  predictions.forEach((hand) => {
    const keypoints = hand.keypoints;

    // 🔵 Dibujar puntos
    ctx.fillStyle = "#00FF00";

    keypoints.forEach((point) => {
      console.log("point  " + point);
      console.log("pointx  " + point.x);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Conexiones
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    HAND_CONNECTIONS.forEach(([start, end]) => {
      const p1 = keypoints[start];
      const p2 = keypoints[end];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  });
}

//Dibuja manos con elementos por color
function drawHands(predictions) {
  if (!predictions || !predictions.length) {
    sphere.visible = false;
    return;
  }

  predictions.forEach((hand) => {
    const keypoints = hand.keypoints;

    const baseColor =
      hand.handedness === "Left" ? "rgba(0,200,255," : "rgba(255,80,200,";

    // -------- DIBUJAR DEDOS --------
    Object.values(FINGERS).forEach((finger, fingerIndex) => {
      const hue = fingerIndex * 60;
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      for (let i = 0; i < finger.length - 1; i++) {
        const p1 = keypoints[finger[i]];
        const p2 = keypoints[finger[i + 1]];

        if (!p1 || !p2) continue;
        if (isNaN(p1.x) || isNaN(p1.y)) continue;
        if (isNaN(p2.x) || isNaN(p2.y)) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // -------- DIBUJAR PUNTOS --------
    keypoints.forEach((point, i) => {
      if (!point || isNaN(point.x) || isNaN(point.y)) return;

      ctx.beginPath();
      ctx.fillStyle = baseColor + "0.9)";
      ctx.arc(point.x, point.y, i === 0 ? 10 : 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // ======================================
    // 🔥 DETECCIÓN PINCH + ESFERA 3D
    // ======================================

    const thumb = keypoints[4];
    const index = keypoints[8];

    if (!thumb || !index) {
      sphere.visible = false;
      return;
    }

    const dx = thumb.x - index.x;
    const dy = thumb.y - index.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const pinchThreshold = 40;

    //Versión partículas
    if (distance < pinchThreshold) {
      const midX = (thumb.x + index.x) / 2;
      const midY = (thumb.y + index.y) / 2;

      const localPos = videoToPlanePosition(midX, midY);
      const worldPos = plane.localToWorld(localPos.clone());

      worldPos.z += 0.3; // sobresale del plano

      bengala.visible = true;

      // Emitimos varias partículas por frame
      for (let i = 0; i < 6; i++) {
        emitParticles(worldPos);
      }
    } else {
      bengala.visible = false;
    }

    //Versión esfera
    if (distance < pinchThreshold && false) {
      //Esfera
      const midX = (thumb.x + index.x) / 2;
      const midY = (thumb.y + index.y) / 2;

      // Convertir a coordenada del plano
      const localPos = videoToPlanePosition(midX, midY);

      // Convertir a mundo
      const worldPos = plane.localToWorld(localPos.clone());

      sphere.position.copy(worldPos);

      // ✨ Sacarla hacia delante (sobresalir)
      const depthBoost = THREE.MathUtils.mapLinear(
        distance,
        pinchThreshold,
        5,
        0.2,
        1.2
      );

      sphere.position.z += depthBoost;

      // Escala dinámica
      const scale = THREE.MathUtils.mapLinear(
        distance,
        pinchThreshold,
        5,
        0.4,
        1.4
      );

      sphere.scale.set(scale, scale, scale);

      sphere.visible = true;
    } else {
      sphere.visible = false;
    }
  });
}

/////////////////////////////////////MÁSCARAS
// Dibuja máscara sobre los ojos en el canvas
function DrawMaskonEyes(keypoints, img, scl) {
  var le = keypoints[33]; // Ojo izquierdo exterior
  var re = keypoints[263]; // Ojo derecho exterior
  var ie = keypoints[168]; // Punto entre los ojos

  var esx = Math.sqrt(Math.pow(re[0] - le[0], 2) + Math.pow(re[1] - le[1], 2));
  var factor = esx / (img.width * scl);

  ctx.save();
  let a = Math.atan2(re[1] - le[1], re[0] - le[0]);
  ctx.translate(ie[0], ie[1]);
  ctx.rotate(a);

  var ofx = (img.width / 2) * factor;
  var ofy = (img.height / 2) * factor;
  ctx.drawImage(img, -ofx, -ofy, img.width * factor, img.height * factor);
  ctx.restore();
}

// Dibuja máscara sobre las cejas en el canvas
function DrawMaskonEyeBrows(keypoints, img, scl) {
  var leb = keypoints[70]; // Ceja izquierda
  var reb = keypoints[300]; // Ceja derecha
  var le = keypoints[33]; // Ojo izquierdo (para escala)
  var re = keypoints[263]; // Ojo derecho (para escala)

  var esx = Math.sqrt(Math.pow(re[0] - le[0], 2) + Math.pow(re[1] - le[1], 2));
  var factor = esx / (img.width * scl);

  ctx.save();
  let a = Math.atan2(re[1] - le[1], re[0] - le[0]);
  ctx.translate((leb[0] + reb[0]) / 2, (leb[1] + reb[1]) / 2);
  ctx.rotate(a);

  var ofx = (img.width / 2) * factor;
  var ofy = (img.height / 2) * factor;
  ctx.drawImage(img, -ofx, -ofy, img.width * factor, img.height * factor);
  ctx.restore();
}

// Dibuja máscara sobre la boca en el canvas
function DrawMaskonMouth(keypoints, img) {
  var lm = keypoints[61]; // Esquina izquierda boca
  var rm = keypoints[291]; // Esquina derecha boca
  var im = keypoints[13]; // Centro boca

  var esx = Math.sqrt(Math.pow(rm[0] - lm[0], 2) + Math.pow(rm[1] - lm[1], 2));
  var factor = esx / (img.width * 0.8);

  ctx.save();
  let a = Math.atan2(rm[1] - lm[1], rm[0] - lm[0]);
  ctx.translate(im[0], im[1]);
  ctx.rotate(a);

  var ofx = (img.width / 2) * factor;
  var ofy = (img.height / 2) * factor;
  ctx.drawImage(img, -ofx, -ofy, img.width * factor, img.height * factor);
  ctx.restore();
}

// Dibuja máscara sobre la nariz en el canvas
function DrawMaskonNose(keypoints, img, scl) {
  var noseTip = keypoints[4]; // Punta de la nariz
  var le = keypoints[33]; // Ojo izquierdo (para escala)
  var re = keypoints[263]; // Ojo derecho (para escala)

  var esx = Math.sqrt(Math.pow(re[0] - le[0], 2) + Math.pow(re[1] - le[1], 2));
  var factor = esx / (img.width * scl);

  ctx.save();
  let a = Math.atan2(re[1] - le[1], re[0] - le[0]);
  ctx.translate(noseTip[0], noseTip[1]);
  ctx.rotate(a);

  var ofx = (img.width / 2) * factor;
  var ofy = (img.height / 2) * factor;
  ctx.drawImage(img, -ofx, -ofy, img.width * factor, img.height * factor);
  ctx.restore();
}

/*function drawHands(predictions) {
  if (!predictions || !predictions.length) return;

  predictions.forEach((hand) => {
    const keypoints = hand.keypoints;

    // 🎨 Color distinto por mano
    const baseColor =
      hand.handedness === "Left" ? "rgba(0,200,255," : "rgba(255,80,200,";

    // Dedos
    Object.values(FINGERS).forEach((finger, fingerIndex) => {
      const hue = fingerIndex * 60; // arcoiris
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      for (let i = 0; i < finger.length - 1; i++) {
        const p1 = keypoints[finger[i]];
        const p2 = keypoints[finger[i + 1]];

        if (!p1 || !p2) continue;
        if (isNaN(p1.x) || isNaN(p1.y)) continue;
        if (isNaN(p2.x) || isNaN(p2.y)) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // Palma
    ctx.strokeStyle = baseColor + "0.8)";
    ctx.lineWidth = 5;

    const palmConnections = [
      [0, 5],
      [5, 9],
      [9, 13],
      [13, 17],
      [17, 0],
    ];

    palmConnections.forEach(([a, b]) => {
      const p1 = keypoints[a];
      const p2 = keypoints[b];

      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Puntos
    keypoints.forEach((point, i) => {
      if (!point || isNaN(point.x) || isNaN(point.y)) return;

      const radius = i === 0 ? 10 : 6;

      ctx.beginPath();
      ctx.fillStyle = baseColor + "0.9)";
      ctx.shadowColor = baseColor + "1)";
      ctx.shadowBlur = 15;
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  });
}*/

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

async function init() {
  console.log("Inicializando");

  //Etiqueta parte superior
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
  info.innerHTML = shaders[shaderhub[currentshader]].name;
  info.style.visibility = "hidden";
  document.body.appendChild(info);

  // Logo inicial
  logoInicial = document.createElement("div");
  logoInicial.style.position = "absolute";
  logoInicial.style.top = "50%";
  logoInicial.style.left = "50%";
  logoInicial.style.transform = "translate(-50%, -50%)";
  logoInicial.style.zIndex = "2";
  logoInicial.style.textAlign = "center";

  // Logo inicial como imagen
  const logoSize = esDispositivoMovil()
    ? "max-width: 300px; max-height: 200px;"
    : "max-width: 500px; max-height: 500px;";
  logoInicial.innerHTML = `<img src="./src/eii_hmr_acron.png" style="${logoSize}" alt="Logo">`;
  //Tamaño diverso si es móvil o PC
  if (!esDispositivoMovil()) document.body.appendChild(logoInicial);

  // Logo inferior (inicialmente oculto) solo si NO es dispositivo móvil
  if (!esDispositivoMovil()) {
    logoInferior = document.createElement("div");
    logoInferior.style.position = "absolute";
    logoInferior.style.bottom = "10px";
    logoInferior.style.left = "50%";
    logoInferior.style.transform = "translateX(-50%)";
    logoInferior.style.zIndex = "1";
    logoInferior.style.textAlign = "center";
    logoInferior.style.visibility = "hidden";

    logoInferior.innerHTML =
      '<img src="./src/eii_hmr_acron.jpg" style="max-width: 200px; max-height: 100px;" alt="Logo">';

    document.body.appendChild(logoInferior);
  }

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
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.display = "none";
  document.body.appendChild(video);

  // Canvas actual
  canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  ctx = canvas.getContext("2d");

  // Canvas para fotograma anterior
  canvasPrev = document.createElement("canvas");
  canvasPrev.width = 1280;
  canvasPrev.height = 720;
  ctxPrev = canvasPrev.getContext("2d");

  // Texturas
  tx = new THREE.CanvasTexture(canvas);
  tx.colorSpace = THREE.SRGBColorSpace;

  txPrev = new THREE.CanvasTexture(canvasPrev);
  txPrev.colorSpace = THREE.SRGBColorSpace;

  console.log("Cargando modelos detección");
  // Mediapipe face detector
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

  facedetector = await faceLandmarksDetection.createDetector(model, {
    runtime: "tfjs",
    maxFaces: 2,
  });

  // Detector de manos
  const hands = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: "tfjs",
    modelType: "full",
    maxHands: 2,
  };
  handdetector = await handPoseDetection.createDetector(hands, detectorConfig);

  //YOLO
  try {
    yolomodel = await load(YOLO_V5_N_COCO_MODEL_CONFIG);
  } catch (error) {
    console.log("YOLO Model failed to load :(", error);
  }

  console.log("Tras carga detectores");

  lastChange = 0;

  uniforms = {
    texture1: { value: tx }, // Fotograma actual
    texture0: { value: txPrev }, // Fotograma anterior
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

  //Plano para el shader
  plane = PlanoShader(0, 0, 0);
  //plane.visible = false;

  //simple para pinch
  sphere = SphereShader();
  sphere.visible = false;

  bengala = Particles();
  bengala.visible = false;

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

  //Manejadores
  //Movimiento del ratón
  window.addEventListener("mousemove", (event) => {
    // Calcula la posición del ratón normalizada
    const mouseX = event.clientX / window.innerWidth;
    const mouseY = 1.0 - event.clientY / window.innerHeight; // Invertimos Y para que 0,0 esté en la esquina inferior izquierda

    // Actualiza el uniforme u_mouse
    uniforms.u_mouse.value.set(mouseX, mouseY);
  });

  //Evento clic
  window.addEventListener("click", (event) => {
    // Cambia al siguiente shader
    currentshader += 1;
    if (currentshader > shaderhub.length - 1) currentshader = 0;

    // Actualiza el shader del material
    plane.material.fragmentShader = shaders[shaderhub[currentshader]].fragment;
    info.innerHTML = shaders[shaderhub[currentshader]].name;
    plane.material.needsUpdate = true;

    // Resetea el temporizador para que no cambie inmediatamente después
    lastChange = clock.getElapsedTime();

    // Limpia las predicciones cuando cambias de shader
    lastFacePredictions = null;

    console.log(
      "Shader cambiado por clic: " + shaders[shaderhub[currentshader]].name
    );
  });

  // Evento teclado (flechas)
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      // Siguiente shader
      currentshader += 1;
      if (currentshader > shaderhub.length - 1) currentshader = 0;
    }

    if (event.key === "ArrowLeft") {
      // Shader anterior
      currentshader -= 1;
      if (currentshader < 0) currentshader = shaderhub.length - 1;
    }

    // Actualiza solo si se pulsó una tecla válida
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      console.log(shaders.length, currentshader, shaderhub[currentshader]);
      plane.material.fragmentShader =
        shaders[shaderhub[currentshader]].fragment;
      plane.material.needsUpdate = true;

      info.innerHTML = shaders[shaderhub[currentshader]].name;

      lastChange = clock.getElapsedTime();
      lastFacePredictions = null;

      console.log(
        "Shader cambiado con teclado: " + shaders[shaderhub[currentshader]].name
      );
    }
  });

  requestAnimationFrame(render);
}

function updatePlaneSize() {
  if (!video.videoWidth || !video.videoHeight || mostrandoLogoInicial) return;

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

function PlanoShader(px, py, pz, texture = undefined) {
  let geometry = new THREE.PlaneGeometry(30, 30); // Tamaño inicial temporal

  //Color aleatorio
  //uniforms.color.value.set(0x000000);

  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: shaders[shaderhub[currentshader]].fragment,
  });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);

  scene.add(mesh);

  return mesh; // Devolver el mesh para poder redimensionarlo
}

function SphereShader() {
  const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);

  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2,
    roughness: 0.15,
    metalness: 0.9,
    clearcoat: 1,
  });

  const pinchSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  pinchSphere.visible = false;

  scene.add(pinchSphere);

  return pinchSphere;
}

function videoToPlanePosition(x, y) {
  const videoW = canvas.width;
  const videoH = canvas.height;

  const planeW = plane.geometry.parameters.width;
  const planeH = plane.geometry.parameters.height;

  // Normalizar 0..1
  const nx = x / videoW;
  const ny = y / videoH;

  // Convertir a coordenadas del plane
  const planeX = (nx - 0.5) * planeW;
  const planeY = -(ny - 0.5) * planeH;

  return new THREE.Vector3(planeX, planeY, 0);
}

function Particles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffaa00,
    size: 0.1,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particleSystem = new THREE.Points(geometry, material);
  particleSystem.visible = false;

  // 🔥 Guardamos datos internos aquí
  particleSystem.userData.velocities = [];
  particleSystem.userData.lifetimes = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particleSystem.userData.velocities.push(new THREE.Vector3());
    particleSystem.userData.lifetimes.push(0);
  }

  scene.add(particleSystem);

  return particleSystem;
}

function emitParticles(origin) {
  const positions = bengala.geometry.attributes.position.array;
  const velocities = bengala.userData.velocities;
  const lifetimes = bengala.userData.lifetimes;

  for (let i = 0; i < lifetimes.length; i++) {
    if (lifetimes[i] <= 0) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      velocities[i].set(
        (Math.random() - 0.5) * 2,
        Math.random() * 4,
        (Math.random() - 0.5) * 2
      );

      lifetimes[i] = 1.2;

      break;
    }
  }
}

function clearParticles() {
  if (!bengala) return;

  const positions = bengala.geometry.attributes.position.array;
  const lifetimes = bengala.userData.lifetimes;

  for (let i = 0; i < lifetimes.length; i++) {
    lifetimes[i] = 0;

    positions[i * 3] = 9999; // fuera de cámara
    positions[i * 3 + 1] = 9999;
    positions[i * 3 + 2] = 9999;
  }

  bengala.geometry.attributes.position.needsUpdate = true;
}

function updateParticles(delta) {
  if (!bengala) return;

  const positions = bengala.geometry.attributes.position.array;
  const velocities = bengala.userData.velocities;
  const lifetimes = bengala.userData.lifetimes;

  for (let i = 0; i < lifetimes.length; i++) {
    if (lifetimes[i] > 0) {
      positions[i * 3] += velocities[i].x * delta;
      positions[i * 3 + 1] += velocities[i].y * delta;
      positions[i * 3 + 2] += velocities[i].z * delta;

      velocities[i].y -= 6 * delta; // gravedad visible

      lifetimes[i] -= delta;

      if (lifetimes[i] <= 0) {
        positions[i * 3] = 9999; // esconder
      }
    }
  }

  bengala.geometry.attributes.position.needsUpdate = true;
}

function render() {
  const elapsed = clock.getElapsedTime(); // tiempo total desde el inicio (en segundos)

  // Controlar la transición del logo inicial a los shaders
  if (mostrandoLogoInicial && elapsed >= tiempoLogoInicial) {
    // Ocultar logo inicial
    logoInicial.style.visibility = "hidden";

    // Mostrar canvas de shaders
    renderer.domElement.style.visibility = "visible";

    // Mostrar info de autor
    info.style.visibility = "visible";

    /*if (info.style.visibility === "visible")
      logoInicial.style.visibility = "hidden";*/

    // Reiniciar el reloj para el conteo de cambio de shaders
    lastChange = elapsed;

    mostrandoLogoInicial = false;

    console.log("FIN LOGO INICIAL");
  }

  if (!mostrandoLogoInicial) {
    //Activa vista del plano con el shader
    plane.visible = true;
    //Incrementa tiempo
    uniforms.u_time.value += 0.05;

    // Dibuja el video en el canvas
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      info.style.visibility = "visible";

      // PRIMERO: Copia el fotograma actual al canvas anterior
      ctxPrev.drawImage(canvas, 0, 0, canvasPrev.width, canvasPrev.height);
      txPrev.needsUpdate = true;

      // SEGUNDO: Dibuja fotograma actual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      //lastimage = video; //Pruebo parta detectar a partir del vídeo, no del canvas ¿requiere escalado?

      // Modelos relacionados con detectores
      if (
        (shaders[shaderhub[currentshader]].name === "Cara" ||
          shaders[shaderhub[currentshader]].name === "Payaso") &&
        facedetector
      ) {
        updateFaces(); // Llamada sin await para no bloquear

        // Dibuja las últimas detecciones de caras disponibles
        if (lastFacePredictions) {
          // Cambia estilo según name
          drawFaceMesh(
            lastFacePredictions,
            shaders[shaderhub[currentshader]].name
          );
        }
      } else if (
        shaders[shaderhub[currentshader]].name === "Manos" &&
        handdetector
      ) {
        updateHands();
        if (lastHandPredictions) {
          drawHands(lastHandPredictions);
        }
      } else if (
        shaders[shaderhub[currentshader]].name === "Detector" &&
        yolomodel
      ) {
        updateYOLO();
        if (lastYOLOPredictions) {
          drawYOLO(lastYOLOPredictions);
        }
      }

      // Marca la textura como actualizada
      tx.needsUpdate = true;

      const delta = clock.getDelta();
      updateParticles(delta * 10);
    }

    // Si han pasado más de 10 segundos desde el último cambio…
    if (elapsed - lastChange >= tsalto) {
      // Hacer algo aquí
      console.log("Shader " + shaders[shaderhub[currentshader]].name);

      // Actualizar el marcador de tiempo
      lastChange = elapsed;

      //Siguiente shader
      currentshader += 1;
      if (currentshader > shaderhub.length - 1) currentshader = 0;
      //console.log("Cambia shader", currentshader);
      //Actualiza shader del material
      plane.material.fragmentShader =
        shaders[shaderhub[currentshader]].fragment;
      info.innerHTML = shaders[shaderhub[currentshader]].name;
      plane.material.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
