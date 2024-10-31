precision mediump float;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;
uniform vec2 u_resolution;

float rad = 0.5;
float ncells = 25.0;
float split = 1.0; //rejilla en el pixelón

//EFecto de pixelado con forma circular/elíptica
void main() {
  vec2 uv = vTexCoord;
  // flip the y uvs
  uv.y = 1.0 - uv.y;
  //Origen en el centro
  vec2 st = uv;// - 0.5;
  
  //Escala en función de la escala adoptada
  st = fract(st*ncells);
  
  //downscale to sample rhe image color
  float factor = 1./(ncells*split);
  vec2 uvd = uv/factor;
  uvd = floor(uvd);
  uvd *= factor;
  
  // Distancia del píxel al centro
  float pct = distance(st,vec2(0.5));
  
  
  // get the webcam as a vec4 using texture2D
  vec4 tex = texture2D(tex0, uvd);//Usando uv usaría la imegan original, no la variante de pixelado
  
  //forma circular para mostrar
  float circ = 1.0 - step(rad,pct);
  
  // Combina textura un máscara circular
  gl_FragColor = tex*circ;

 
}
