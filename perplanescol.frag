precision mediump float;

// grab texcoords from the vertex shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;


void main() {
  
  vec2 uvorig = vTexCoord;
  // flip the y uvs
  uvorig.y = 1.0 - uvorig.y;
  
  // get the webcam as a vec4 using texture2D
  vec4 tex = texture2D(tex0, uvorig);

  // output columns, rgb and each one a plane
  vec3 color = vec3(0.);
  if (uvorig.x < 0.25){
      color = tex.rgb;
    }
    else{
      if (uvorig.x < 0.5){
        color = vec3(tex.r,0.,0.);
      }
      else{
        if (uvorig.x < 0.75){
          color = vec3(0.,tex.g,0.);
        }
        else
          color = vec3(0.,0.,tex.b);
        }        
    }
  
  gl_FragColor = vec4(color, 1.0);
}

