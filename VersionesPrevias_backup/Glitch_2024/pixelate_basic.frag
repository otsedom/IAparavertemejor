precision mediump float;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

float ncells = 25.;

//Based on https://www.shadertoy.com/view/7tVyDc
//Minecraft para los más jóvenes :)
void main() {
  vec2 uv = vTexCoord;
  // flip the y uvs
  uv.y = 1.0 - uv.y;
  
  //Downscale to sample
  float factor = 1./ncells;
  uv /= factor; 
  uv = floor(uv);
  uv *= factor;
  
  // get the webcam color as a vec4 using texture2D
  vec4 tex = texture2D(tex0, uv);

  // output the grayscale value in all three rgb color channels
  gl_FragColor = tex;
}


