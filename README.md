# Shader Demo con Face Mesh

Demostrador interactivo de shaders aplicados a video webcam en tiempo real, con detección facial mediante MediaPipe cuando se activa un shader específico.

## 🎨 Características

- **Rotación automática de shaders** cada 2 segundos
- **Visualización en tiempo real** de la webcam con efectos
- **Detección facial integrada** (shader #8) usando TensorFlow.js Face Mesh
- **Renderizado 3D** con Three.js
- **Controles de cámara** interactivos con OrbitControls

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador y acepta los permisos de la cámara.

## 📦 Dependencias principales

- **Three.js** - Renderizado 3D y manejo de texturas
- **TensorFlow.js** - Detección facial con Face Mesh
- **@tensorflow-models/facemesh** - Modelo pre-entrenado de malla facial

## 🎮 Funcionamiento

### Ciclo de shaders
Los shaders rotan automáticamente cada **2 segundos** (configurable en `tsalto`). El shader activo se muestra en el indicador superior.

### Detección facial
Cuando el **shader #8** está activo:
- ✅ Se activa la detección de rostros
- ✅ Se dibuja la malla facial (468 puntos clave)
- ✅ Se visualiza la triangulación en color verde

Cuando **no es el shader #8**:
- ⏸️ La detección está pausada (optimización de rendimiento)
- 📹 Solo se muestra el video con el shader activo

### Interacción
- **Ratón**: La posición del cursor afecta los efectos de algunos shaders
- **Click + Arrastre**: Rotar la vista (OrbitControls)

## 📁 Estructura del código

```
main.js              # Archivo principal
├── init()           # Inicialización de escena, cámara y webcam
├── updateMesh()     # Loop de detección facial (condicional)
├── drawMesh()       # Renderizado de la malla facial
├── render()         # Loop principal de renderizado
└── PlanoShader()    # Creación del plano con shader material

shaders_code.js      # Colección de shaders GLSL
triangulation.js     # Índices de triangulación de Face Mesh
```

## ⚙️ Configuración

### Cambiar tiempo entre shaders
```javascript
const tsalto = 2.0; // segundos
```

### Cambiar shader de detección facial
```javascript
if (currentshader === 8) { // Cambiar el número aquí
    // Detección activa
}
```

### Ajustar resolución de video
```javascript
const constraints = {
    video: { 
        width: 1280,  // Modificar aquí
        height: 720,  // Modificar aquí
        facingMode: "user" 
    },
};
```

## 🎯 Shaders incluidos

El array `shaders[]` contiene múltiples efectos GLSL. Cada shader tiene:
- `fragment`: Código GLSL del fragment shader
- `author`: Nombre del creador/efecto

El shader #8 incluye la visualización de la malla facial sobre el efecto.

## 🔧 Optimizaciones

- **Carga única del modelo**: Face Mesh se carga solo una vez al inicio
- **Detección condicional**: Solo procesa cuando es necesario (shader #8)
- **Canvas texture**: Combina video + mesh en una sola textura
- **RequestAnimationFrame**: Loops separados para renderizado y detección

## 📝 Uniforms disponibles

Los shaders pueden acceder a:

```glsl
uniform sampler2D texture1;   // Textura de video/canvas
uniform float u_time;          // Tiempo transcurrido
uniform vec2 u_resolution;     // Resolución de la ventana
uniform vec2 u_mouse;          // Posición del ratón (0-1)
uniform vec3 color;            // Color aleatorio por shader
```

## 🐛 Troubleshooting

### El video no se ve
- Verifica que hayas aceptado los permisos de cámara
- Comprueba la consola para errores de getUserMedia

### Error de TensorFlow
- Asegúrate de que los archivos WASM se descarguen correctamente
- Verifica que el backend WASM esté configurado

### La malla no aparece
- Confirma que estés en el shader #8
- Mira la consola: debe aparecer "Shader 8 activo - Detección de rostro habilitada"
- Verifica que tu cara esté visible en el encuadre

## 📄 Licencia

Revisa las licencias individuales de:
- Los shaders (autores en `shaders_code.js`)
- TensorFlow.js (Apache 2.0)
- Three.js (MIT)
