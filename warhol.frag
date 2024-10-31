precision mediump float;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

float scale = 3.;

void main() {
  vec2 uv = vTexCoord;
  // flip the y uvs
  uv.y = 1.0 - uv.y;
  
  uv = uv*scale;
  float fil = floor( mod(uv.y,scale) ) ;
  float col = floor( mod(uv.x,scale) );
  uv = fract(uv);

  // get the webcam as a vec4 using texture2D
  vec4 tex = texture2D(tex0, uv);
  
  // lets invert the colors just for fun, differently in each cell
  if (fil == 0.){//Primera fila
    if (col == 0.)
      tex.rgb = 1.0 - tex.rgb;
    else{
      if (col == 1.)
        tex.rgb = 1.0 - vec3(0., tex.g,tex.b);
     else
       tex.rgb = 1.0 - vec3(0., 0.,tex.b);      
    }
  }  
  else{ //segunda fila
    if (fil == 1.){
      if (col == 0.)
        tex.rgb = 1.0 - vec3(0., 1. - tex.g,tex.r);
      else{
        if (col == 1.)
          tex.rgb = 1.0 - vec3(tex.b, tex.g,tex.r);          
        else
          tex.rgb = 1.0 - vec3(0., tex.r, 0.);      
      }
    }  
    else{
      if (col == 0.)
        tex.rgb = vec3(tex.g, 1. - tex.r,tex.b);
      else{
        if (col == 1.)
          tex.rgb = 1.0 - vec3(1., tex.r,tex.b);
        else
          tex.rgb = 1.0 - vec3(0.5+ 0.5*tex.r, tex.b,tex.g);
      }
    } 
  }
  

  // output the grayscale value in all three rgb color channels
  gl_FragColor = tex;
}

