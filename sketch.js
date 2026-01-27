let cam;
let shaderGraphics;
let pastFrame;
let startTime;

function setup() {
  createCanvas(640, 480);

  startTime = millis();

  // Webcam
  cam = createCapture(VIDEO);
  cam.size(640, 480);
  cam.hide();

  // Capa WEBGL para shaders
  shaderGraphics = createGraphics(640, 480, WEBGL);
  shaderGraphics.noStroke();

  // Frame anterior (por si quieres diferencia luego)
  pastFrame = createGraphics(640, 480);
}

function draw() {
  background(0);

  // Esperar a que la cámara esté lista
  if (cam.loadedmetadata) {
    image(cam, 0, 0, width, height);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Inicializando cámara...", width / 2, height / 2);
  }
}
