// Colección de shaders estudiantiles (estilo tinycode)
export const shaders = [
  //Imagen de entrada
  {
    name: "RGB",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            gl_FragColor = texture2D(texture1, uv);
        }
        `,
  },

  {
    name: "Planos de color I",
    fragment: `
    // grab texcoords from the vertex shader
    varying vec2 vUv;
    
    // our texture coming from p5
    uniform sampler2D texture1;
    
    
    void main() {      
      vec2 uvorig = vUv;
      
      // get the webcam as a vec4 using texture2D
      vec4 tex = texture2D(texture1, uvorig);
    
      // output columns, rgb and each one a plane
      vec3 color = vec3(1.);
      if (uvorig.x < 0.25){
          color = tex.rgb;
        }
        else{
          if (uvorig.x < 0.5){
            color = vec3(tex.r);
          }
          else{
            if (uvorig.x < 0.75){
              color = vec3(tex.g);
            }
            else
              color = vec3(tex.b);
            }        
        }
      
      gl_FragColor = vec4(color, 1.0);
    }
    `,
  },

  {
    name: "Planos de color II",
    fragment: `
    // grab texcoords from the vertex shader
    varying vec2 vUv;

    // our texture coming from p5
    uniform sampler2D texture1;


    void main() {
    
    vec2 uvorig = vUv;
    
    // get the webcam as a vec4 using texture2D
    vec4 tex = texture2D(texture1, uvorig);

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
          `,
  },

  //Grises
  {
    name: "Grises",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;

        // this is a common glsl function of unknown origin to convert rgb colors to luminance
        // it performs a dot product of the input color against some known values that account for our eyes perception of brighness
        // i pulled this one from here https://github.com/hughsk/glsl-luma/blob/master/index.glsl
        float luma(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }
        
        void main(){
            vec2 uv = vUv;

            // get the webcam as a vec4 using texture2D
            vec4 tex = texture2D(texture1, uv);

            // convert the texture to grayscale by using the luma function  
            float gray = luma(tex.rgb);

            // output the grayscale value in all three rgb color channels
            gl_FragColor = vec4(gray, gray, gray, 1.0);
        }
        `,
  },

  //Inversión
  {
    name: "Inversión",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            // get the webcam as a vec4 using texture2D
            vec4 tex = texture2D(texture1, uv);
            
            // lets invert the colors just for kicks
            tex.rgb = 1.0 - tex.rgb;

            // output the grayscale value in all three rgb color channels
            gl_FragColor = tex;
        }
        `,
  },

  //Warholiano
  {
    name: "Inspirado en Warhol",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;

        float scale = 3.;
        
        void main(){
            vec2 uv = vUv;

            uv = uv*scale;
            float fil = floor( mod(uv.y,scale) ) ;
            float col = floor( mod(uv.x,scale) );
            uv = fract(uv);

            // get the webcam as a vec4 using texture2D
            vec4 tex = texture2D(texture1, uv);
            
            // lets invert or alter colors just for fun, differently in each cell
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
        `,
  },

  //Prev threejs
  {
    name: "Bordes BN",
    fragment: `
    // coordenada de textura del shader de fragmentos
    varying vec2 vUv;

    // mapa de textura y resolución
    uniform sampler2D texture1;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;   

    void main(){
      vec2 uv = vUv;
      // saltos en el mapa de textura, relacionado con resolución
      vec2 stepSize = 1./u_resolution;

      // Máscara filtro
      float kernel[9];

      // Bordes
      kernel[0] = -1.0; kernel[1] = -1.0; kernel[2] = -1.0;
      kernel[3] = -1.0; kernel[4] = 8.0; kernel[5] = -1.0;
      kernel[6] = -1.0; kernel[7] = -1.0; kernel[8] = -1.0;

      //Desplazamientos de los píxeles en la ventana 3x3
      vec2 offset[9];
      offset[0] = vec2(-stepSize.x, -stepSize.y); // arriba izquierda
      offset[1] = vec2(0.0, -stepSize.y);         // arriba centro
      offset[2] = vec2(stepSize.x, -stepSize.y);  // arriba derecha
      offset[3] = vec2(-stepSize.x, 0.0);         // izquierda
      offset[4] = vec2(0.0, 0.0);                 // centro
      offset[5] = vec2(stepSize.x, 0.0);          // derecha right
      offset[6] = vec2(-stepSize.x, stepSize.y);  // abajo izquierda
      offset[7] = vec2(0.0, stepSize.y);          // abajo centro
      offset[8] = vec2(stepSize.x, stepSize.y);   // abajo derecha

      // Aplica la máscara a los vecinos en la rejilla 3x3
      float kernelWeight = 0.0;
      vec4 conv = vec4(0.0);
      for(int i = 0; i<9; i++){
        // color de textura por valor máscara
        conv += texture2D(texture1, uv + offset[i]) * kernel[i];
        // suma pesos de la máscara para normalizar
        kernelWeight += kernel[i];
      }

      //Black or white
      if (conv.r+conv.g+conv.b > 0.5){
          conv.rgb = abs(conv.rgb);		
          gl_FragColor = vec4(1.0,1.0,1.0, 1.0);
      }
      else{
          gl_FragColor = vec4(0.0,0.0,0.0, 1.0);
      }

      // normaliza el valor si necesario
     /* if (kernelWeight > 1.)
        gl_FragColor = vec4(abs(conv.rgb)/kernelWeight, 1.0);
      else
        gl_FragColor = vec4(abs(conv.rgb), 1.0);*/
    }
    `,
  },

  //Bordes
  {
    name: "Bordes",
    fragment: `
    // coordenada de textura del shader de fragmentos
    varying vec2 vUv;

    // mapa de textura y resolución
    uniform sampler2D texture1;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;   

    void main(){
      vec2 uv = vUv;
      // saltos en el mapa de textura, relacionado con resolución
      vec2 stepSize = 1./u_resolution;

      // Máscara filtro
      float kernel[9];

      // Bordes
      kernel[0] = -1.0; kernel[1] = -1.0; kernel[2] = -1.0;
      kernel[3] = -1.0; kernel[4] = 8.0; kernel[5] = -1.0;
      kernel[6] = -1.0; kernel[7] = -1.0; kernel[8] = -1.0;

      //Desplazamientos de los píxeles en la ventana 3x3
      vec2 offset[9];
      offset[0] = vec2(-stepSize.x, -stepSize.y); // arriba izquierda
      offset[1] = vec2(0.0, -stepSize.y);         // arriba centro
      offset[2] = vec2(stepSize.x, -stepSize.y);  // arriba derecha
      offset[3] = vec2(-stepSize.x, 0.0);         // izquierda
      offset[4] = vec2(0.0, 0.0);                 // centro
      offset[5] = vec2(stepSize.x, 0.0);          // derecha right
      offset[6] = vec2(-stepSize.x, stepSize.y);  // abajo izquierda
      offset[7] = vec2(0.0, stepSize.y);          // abajo centro
      offset[8] = vec2(stepSize.x, stepSize.y);   // abajo derecha

      // Aplica la máscara a los vecinos en la rejilla 3x3
      float kernelWeight = 0.0;
      vec4 conv = vec4(0.0);
      for(int i = 0; i<9; i++){
        // color de textura por valor máscara
        conv += texture2D(texture1, uv + offset[i]) * kernel[i];
        // suma pesos de la máscara para normalizar
        kernelWeight += kernel[i];
      }

      // normaliza el valor si necesario
     if (kernelWeight > 1.)
        gl_FragColor = vec4(abs(conv.rgb)/kernelWeight, 1.0);
      else
        gl_FragColor = vec4(abs(conv.rgb), 1.0);
    }
        `,
  },

  {
    name: "Umbralizado",
    fragment: `
        varying vec2 vUv;

        uniform sampler2D texture1;
        uniform vec2 u_mouse;

        // this is a common glsl function of unknown origin to convert rgb colors to luminance
        // it performs a dot product of the input color against some known values that account for our eyes perception of brighness
        // i pulled this one from here https://github.com/hughsk/glsl-luma/blob/master/index.glsl
        float luma(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }


        void main() {

          vec2 uv = vUv;
          
          // get the webcam as a vec4 using texture2D
          vec4 tex = texture2D(texture1, uv);

          // convert the texture to grayscale by using the luma function  
          float gray = luma(tex.rgb);

          // here we will use the step function to convert the image into black or white
          // any color less than mouseX will become black, any color greater than mouseX will become white
          float thresh = step(u_mouse.x, gray);

          // output the threshold value in all three rgb color channels
          gl_FragColor = vec4(thresh, thresh, thresh, 1.0);
        }
        `,
  },

  {
    name: "Diferencias",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform sampler2D texture0;

        void main() {

          vec2 uv = vUv;
          
          // get the webcam as a vec4 using texture2D
          vec4 tex = texture2D(texture1, uv);

          // get the past webcam frame as a texture
          vec4 past = texture2D(texture0, uv);

          // subtract past from tex
          tex.rgb = abs(tex.rgb - past.rgb);
          //tex.rgb -= past.rgb;

          // lets multiply it by 2 to boost the signal a little bit
          tex.rgb *= 2.0;

          gl_FragColor = tex;
        }
        `,
  },

  {
    name: "Movimiento",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform sampler2D texture0;

        void main() {

          vec2 uv = vUv;
          
          // get the webcam as a vec4 using texture2D
          vec4 tex = texture2D(texture1, uv);

          // get the past webcam frame as a texture
          vec4 past = texture2D(texture0, uv);

          float motion = length(abs(tex - past).rgb);
          gl_FragColor = vec4(vec3(motion * 5.0), 1.0);
        }
        `,
  },

  {
    name: "Flujo I",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform sampler2D texture0;

        void main() {

          vec2 uv = vUv;
          
          // get the webcam as a vec4 using texture2D
          vec4 tex = texture2D(texture1, uv);

          // get the past webcam frame as a texture
          vec4 past = texture2D(texture0, uv);

          vec3 diff = (tex - past).rgb;
          gl_FragColor = vec4(diff * 0.5 + 0.5, 1.0);
        }
        `,
  },

  {
    name: "Flujo II",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform sampler2D texture0;
        uniform vec2 u_resolution;

        void main() {

          vec2 uv = vUv;
          vec2 texelSize = 1.0 / u_resolution;
          
          // Calcula gradientes espaciales (derivadas en X e Y) del frame actual
          float Ix = 0.0;
          float Iy = 0.0;
          
          // Gradiente en X (diferencia horizontal)
          vec3 right = texture2D(texture1, uv + vec2(texelSize.x, 0.0)).rgb;
          vec3 left = texture2D(texture1, uv - vec2(texelSize.x, 0.0)).rgb;
          Ix = length(right - left);
          
          // Gradiente en Y (diferencia vertical)
          vec3 up = texture2D(texture1, uv + vec2(0.0, texelSize.y)).rgb;
          vec3 down = texture2D(texture1, uv - vec2(0.0, texelSize.y)).rgb;
          Iy = length(up - down);
          
          // Gradiente temporal (diferencia entre frames)
          vec3 current = texture2D(texture1, uv).rgb;
          vec3 prev = texture2D(texture0, uv).rgb;
          float It = length(current - prev);
          
          // Estimación simple de flujo óptico (Lucas-Kanade simplificado)
          // Asumiendo que el movimiento es pequeño entre frames
          float denominator = Ix * Ix + Iy * Iy + 0.001; // Evita división por cero
          
          float vx = -(Ix * It) / denominator;
          float vy = -(Iy * It) / denominator;
          
          // Calcula el ángulo de movimiento (0 a 2π)
          float angle = atan(vy, vx);
          
          // Convierte ángulo a color HSV -> RGB
          // Rueda de color: 
          // Rojo = derecha (0°)
          // Amarillo = arriba-derecha (45°)
          // Verde = arriba (90°)
          // Cyan = arriba-izquierda (135°)
          // Azul = izquierda (180°)
          // Magenta = abajo-izquierda (225°)
          // Rojo = abajo (270°)
          
          float hue = (angle + 3.14159265) / (2.0 * 3.14159265); // Normaliza 0-1
          
          // Magnitud del movimiento
          float magnitude = sqrt(vx * vx + vy * vy);
          float saturation = min(magnitude * 50.0, 1.0); // Escala la magnitud
          
          // Convierte HSV a RGB
          vec3 color;
          float h = hue * 6.0;
          float c = saturation;
          float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
          
          if (h < 1.0) {
            color = vec3(c, x, 0.0);
          } else if (h < 2.0) {
            color = vec3(x, c, 0.0);
          } else if (h < 3.0) {
            color = vec3(0.0, c, x);
          } else if (h < 4.0) {
            color = vec3(0.0, x, c);
          } else if (h < 5.0) {
            color = vec3(x, 0.0, c);
          } else {
            color = vec3(c, 0.0, x);
          }
          
          // Si no hay movimiento significativo, muestra el frame original
          if (magnitude < 0.1) {
            gl_FragColor = vec4(current, 1.0);
          } else {
            // Mezcla el color de flujo con el frame original
            gl_FragColor = vec4(mix(current, color, saturation * 0.8), 1.0);
          }
        }
        `,
  },

  {
    name: "Pixelado",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        float ncells = 25.;

        //Based on https://www.shadertoy.com/view/7tVyDc
        //Minecraft para los más jóvenes :)
        void main() {
          vec2 uv = vUv;
          
          //Downscale to sample
          float factor = 1./ncells;
          uv /= factor; 
          uv = floor(uv);
          uv *= factor;
          
          // get the webcam color as a vec4 using texture2D
          vec4 tex = texture2D(texture1, uv);

          // output the grayscale value in all three rgb color channels
          gl_FragColor = tex;
        }
        `,
  },

  {
    name: "Pixelado tablero",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        float ncells = 25.;

        void main() {
          vec2 uvorig = vUv;
         
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
            tex = texture2D(texture1, uv);
          }
          else
          {
            tex = texture2D(texture1, uvorig);
          }
          
         
          // output the grayscale value in all three rgb color channels
          gl_FragColor = tex;
        }
        `,
  },

  {
    //Basado en pop art de Alejandro y Nauzet 2324 https://github.com/xskere/practicasVC/tree/master/P1
    name: "Lentejuelas I",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform vec2 u_resolution;

        float rad = 0.5;
        float ncells = 25.0;
        float split = 1.0; //rejilla en el pixelón

        //EFecto de pixelado con forma circular/elíptica
        void main() {
          vec2 uv = vUv;
          
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
          vec4 tex = texture2D(texture1, uvd);//Usando uv usaría la imegan original, no la variante de pixelado
          
          //forma circular para mostrar
          float circ = 1.0 - step(rad,pct);
          
          // Combina textura un máscara circular
          gl_FragColor = tex*circ; 
        }
        `,
  },

  {
    //Basado en pop art de Alejandro y Nauzet 2324 https://github.com/xskere/practicasVC/tree/master/P1
    name: "Lentejuelas II",
    fragment: `
        varying vec2 vUv;

        // fotogramas
        uniform sampler2D texture1;
        uniform vec2 u_resolution;

        float rad = 0.5;
        float ncells = 25.0;
        float split = 1.0; //rejilla en el pixelón

        //EFecto de pixelado con forma circular/elíptica
        void main() {
          vec2 uv = vUv;
          
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
          vec4 tex = texture2D(texture1, uvd);//Usando uv usaría la imegan original, no la variante de pixelado
          
          //forma circular para mostrar, radio dependiente de la componente roja
          float circ = 1.0 - step(rad*tex.r,pct);
          
          // Combina textura un máscara circular
          gl_FragColor = tex*circ; 
        }
        `,
  },

  {
    name: "Inspirado Alma Haser",
    fragment: `
      varying vec2 vUv;

      // fotogramas
      uniform sampler2D texture1;
      uniform sampler2D texture0;
      uniform vec2 u_resolution;
      
      //const vec2 texOffset = vec2(1.0, 1.0); // From https://www.nuomiphp.com/eplan/en/167810.html
      
      float ncells = 25.0;
      float scale = 1.0;
      float cellstep;
      
      int flip = 1; // 1 refleja la imagen previa, 0 no      
      
      void main(void) {  
        vec2 uv = vUv;

        vec2 stc = gl_FragCoord.xy/u_resolution;
        stc.y = 1.0 - stc.y;
        
        // flip x
        vec2 uv2 = uv;
        uv2.x = 1.0 - uv2.x;

        cellstep = 1./ncells;        
        
        // get the webcam as a vec4 using texture2D
        vec4 tex = texture2D(texture1, uv);
        
          // Alternating rows
          if ( mod(stc.y*scale,2.0*cellstep) <= cellstep){
            //Columns
            // Positive displacement using step
            if ( mod(stc.x*scale,2.0*cellstep) <= cellstep)
              tex = texture2D(texture1, uv);
            else // Negative displacement
              if (flip == 0)
                tex = texture2D(texture0, uv);
              else
                tex = texture2D(texture0, uv2);
          }
          else
          {
            //Columns
            if ( mod(stc.x*scale,2.0*cellstep) <= cellstep)
              if (flip == 0)
                tex = texture2D(texture0, uv);
              else
                tex = texture2D(texture0, uv2);
            else // Negative displacement
              tex = texture2D(texture1, uv);      
          }
          
        // output the grayscale value in all three rgb color channels
        gl_FragColor = tex;        
      }
        `,
  },

  {
    name: "Cara",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            gl_FragColor = texture2D(texture1, uv);
        }
        `,
  },

  {
    name: "Payaso",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            gl_FragColor = texture2D(texture1, uv);
        }
        `,
  },

  {
    name: "Manos",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            gl_FragColor = texture2D(texture1, uv);
        }
        `,
  },

  {
    name: "Detector",
    fragment: `
        varying vec2 vUv;

        // mapa de textura y resolución
        uniform sampler2D texture1;
        
        void main(){
            vec2 uv = vUv;

            gl_FragColor = texture2D(texture1, uv);
        }
        `,
  },
];
