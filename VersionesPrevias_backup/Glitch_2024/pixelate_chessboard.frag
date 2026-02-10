precision mediump float;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

float ncells = 25.;

//Based on https://www.shadertoy.com/view/7tVyDc
//Minecraft para los más jóvenes :)
void main() {
  vec2 uvorig = vTexCoord;
  // flip the y uvs
  uvorig.y = 1.0 - uvorig.y;
  
  vec2 uv = uvorig;
  
  //Downscale to sample
  float factor = 1./ncells;
  uv /= factor;
  uv = floor(uv);
  uv *= factor;
  
  float col = uv.x*ncells;
  float fil = uv.y*ncells;
  
  vec4 tex;
  //Alterna comportamiento para cada celda de la rejilla
  if ( floor(mod(fil+col,2.0)) == 1.)
  {
    tex = texture2D(tex0, uv);
  }
  else
  {
    tex = texture2D(tex0, uvorig);
  }
  
 
  // output the grayscale value in all three rgb color channels
  gl_FragColor = tex;
}


