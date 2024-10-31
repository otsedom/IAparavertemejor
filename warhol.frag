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
  
  // lets invert the colors just for fun
  //tex.rgb = 1.0 - tex.rgb;
  
  
  if (fil == 0){
    tex.rgb = 1.0 - tex.rgb;
  
    /*if (col == 0)
      tex.rgb = 1.0 - tex.rgb;
    else{
      if (col == 1)
        tex.rgb = 1.0 - vec3(0., tex.g,tex.b);
     else
       tex.rgb = 1.0 - vec3(0., 0.,tex.b);      
    }*/
  }  
  /*else{
    if (fil == 1){
      if (col == 0)
        tex.rgb = 1.0 - vec3(text.b, text.g,text.r);;
      else{
        if (col == 1)
          tex.rgb = 1.0 - vec3(0., text.g,text.r);
       else
         tex.rgb = 1.0 - vec3(0., 0.,text.r);      
      }
    }  
    else{
      if (col == 0)
        tex.rgb = 1.0 - vec3(text.g, text.r,text.b);;
      else{
        if (col == 1)
          tex.rgb = 1.0 - vec3(1., text.r,text.b);
       else
         tex.rgb = 1.0 - vec3(1., 1.,text.b);      
      }
    }
    
  }*/
  

  // output the grayscale value in all three rgb color channels
  gl_FragColor = tex;
}

