// Variables globales
let capture;
let currentShader;
let layer;
let currentShaderIndex = 0;
let infoDiv;
let shaderNameSpan;
let cameraReady = false;

// Definición de shaders inline (vertex shader común)
const vertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Array de shaders disponibles
const shaders = [
  {
    name: "Webcam Original",
    author: "Vista normal de la cámara",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        vec4 color = texture2D(tex0, uv);
        gl_FragColor = color;
      }
    `
  },
  {
    name: "Escala de Grises",
    author: "Conversión a blanco y negro",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        vec4 color = texture2D(tex0, uv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(vec3(gray), 1.0);
      }
    `
  },
  {
    name: "Inversión de Colores",
    author: "Negativo fotográfico",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        vec4 color = texture2D(tex0, uv);
        gl_FragColor = vec4(1.0 - color.rgb, 1.0);
      }
    `
  },
  {
    name: "Detección de Bordes",
    author: "Filtro Sobel para detectar contornos",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        vec2 texel = 1.0 / resolution;
        
        // Kernel Sobel horizontal
        float gx = 0.0;
        gx += -1.0 * texture2D(tex0, uv + vec2(-texel.x, -texel.y)).r;
        gx += -2.0 * texture2D(tex0, uv + vec2(-texel.x, 0.0)).r;
        gx += -1.0 * texture2D(tex0, uv + vec2(-texel.x, texel.y)).r;
        gx += 1.0 * texture2D(tex0, uv + vec2(texel.x, -texel.y)).r;
        gx += 2.0 * texture2D(tex0, uv + vec2(texel.x, 0.0)).r;
        gx += 1.0 * texture2D(tex0, uv + vec2(texel.x, texel.y)).r;
        
        // Kernel Sobel vertical
        float gy = 0.0;
        gy += -1.0 * texture2D(tex0, uv + vec2(-texel.x, -texel.y)).r;
        gy += -2.0 * texture2D(tex0, uv + vec2(0.0, -texel.y)).r;
        gy += -1.0 * texture2D(tex0, uv + vec2(texel.x, -texel.y)).r;
        gy += 1.0 * texture2D(tex0, uv + vec2(-texel.x, texel.y)).r;
        gy += 2.0 * texture2D(tex0, uv + vec2(0.0, texel.y)).r;
        gy += 1.0 * texture2D(tex0, uv + vec2(texel.x, texel.y)).r;
        
        float edge = sqrt(gx * gx + gy * gy);
        edge = 1.0 - edge;
        
        gl_FragColor = vec4(vec3(edge), 1.0);
      }
    `
  },
  {
    name: "Pixelado",
    author: "Efecto de mosaico pixelado",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        
        float pixelSize = 15.0;
        vec2 pixelated = floor(uv * resolution / pixelSize) * pixelSize / resolution;
        
        vec4 color = texture2D(tex0, pixelated);
        gl_FragColor = color;
      }
    `
  },
  {
    name: "Efecto Warhol",
    author: "Estilo pop art de Andy Warhol",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        
        vec4 color = texture2D(tex0, uv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // Cuadrantes de colores diferentes
        vec2 section = floor(uv * 2.0);
        float index = section.x + section.y * 2.0;
        
        vec3 palette;
        if (index < 1.0) {
          palette = vec3(1.0, 0.0, 0.5); // Rosa
        } else if (index < 2.0) {
          palette = vec3(0.0, 1.0, 1.0); // Cyan
        } else if (index < 3.0) {
          palette = vec3(1.0, 1.0, 0.0); // Amarillo
        } else {
          palette = vec3(0.0, 1.0, 0.0); // Verde
        }
        
        vec3 result = palette * gray * 1.5;
        gl_FragColor = vec4(result, 1.0);
      }
    `
  },
  {
    name: "Umbralización",
    author: "Conversión a blanco o negro puro",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        
        vec4 color = texture2D(tex0, uv);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float threshold = step(0.5, gray);
        
        gl_FragColor = vec4(vec3(threshold), 1.0);
      }
    `
  },
  {
    name: "Separación RGB",
    author: "Descompone en canales de color",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        
        vec2 section = floor(uv * vec2(3.0, 1.0));
        vec2 localUV = fract(uv * vec2(3.0, 1.0));
        
        vec4 color = texture2D(tex0, localUV);
        
        if (section.x < 1.0) {
          gl_FragColor = vec4(color.r, 0.0, 0.0, 1.0);
        } else if (section.x < 2.0) {
          gl_FragColor = vec4(0.0, color.g, 0.0, 1.0);
        } else {
          gl_FragColor = vec4(0.0, 0.0, color.b, 1.0);
        }
      }
    `
  },
  {
    name: "Blur Gaussiano",
    author: "Desenfoque suave",
    fragment: `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = vTexCoord;
        uv.y = 1.0 - uv.y;
        vec2 texel = 1.0 / resolution;
        
        vec4 color = vec4(0.0);
        float kernel[9];
        kernel[0] = 1.0; kernel[1] = 2.0; kernel[2] = 1.0;
        kernel[3] = 2.0; kernel[4] = 4.0; kernel[5] = 2.0;
        kernel[6] = 1.0; kernel[7] = 2.0; kernel[8] = 1.0;
        
        int index = 0;
        for(int y = -1; y <= 1; y++) {
          for(int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * texel * 2.0;
            color += texture2D(tex0, uv + offset) * kernel[index] / 16.0;
            index++;
          }
        }
        
        gl_FragColor = color;
      }
    `
  }
];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  
  // Elementos UI
  infoDiv = select('#info');
  shaderNameSpan = select('#shaderName');
  
  // Botones de control
  select('#prevBtn').mousePressed(previousShader);
  select('#nextBtn').mousePressed(nextShader);
  
  // Crear shader inicial
  updateShader();
  
  // Iniciar captura de video
  capture = createCapture(VIDEO, videoReady);
  capture.size(640, 480);
  capture.hide();
}

function videoReady() {
  console.log('Cámara lista');
  cameraReady = true;
  infoDiv.html(shaders[currentShaderIndex].author);
}

function draw() {
  background(0);
  
  if (cameraReady && capture.loadedmetadata) {
    // Configurar shader
    shader(currentShader);
    currentShader.setUniform('tex0', capture);
    currentShader.setUniform('resolution', [capture.width, capture.height]);
    
    // Dibujar rectángulo con shader
    noStroke();
    rect(-width/2, -height/2, width, height);
  } else {
    // Mostrar mensaje de espera
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('Esperando cámara...', 0, 0);
  }
}

function updateShader() {
  const shaderData = shaders[currentShaderIndex];
  currentShader = createShader(vertexShader, shaderData.fragment);
  
  if (infoDiv) {
    infoDiv.html(shaderData.author);
  }
  if (shaderNameSpan) {
    shaderNameSpan.html(shaderData.name);
  }
  
  console.log('Shader actualizado:', shaderData.name);
}

function nextShader() {
  currentShaderIndex = (currentShaderIndex + 1) % shaders.length;
  updateShader();
}

function previousShader() {
  currentShaderIndex = (currentShaderIndex - 1 + shaders.length) % shaders.length;
  updateShader();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Atajos de teclado
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    previousShader();
  } else if (keyCode === RIGHT_ARROW) {
    nextShader();
  }
}
