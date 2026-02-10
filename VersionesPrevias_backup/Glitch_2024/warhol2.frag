precision mediump float;

//fuente chatgpt

uniform sampler2D u_texture; // La textura que queremos modificar
uniform vec2 u_resolution;   // Resolución de la pantalla para dividir en rejilla

// Función para aplicar efectos de color estilo Warhol
vec3 aplicarEfectoWarhol(vec3 color, int index) {
    if (index == 0) return vec3(color.r, 0.5 * color.g, color.b);            // Azul verdoso
    else if (index == 1) return vec3(0.5 * color.r, color.g, 0.7 * color.b); // Rosa
    else if (index == 2) return vec3(0.8 * color.r, color.g, 0.3 * color.b); // Amarillo
    else if (index == 3) return vec3(0.2 * color.r, 0.7 * color.g, color.b); // Azul
    else if (index == 4) return vec3(1.0 - color.r, color.g, color.b);       // Invertido en rojo
    else if (index == 5) return vec3(color.r, 1.0 - color.g, color.b);       // Invertido en verde
    else if (index == 6) return vec3(color.r, color.g, 1.0 - color.b);       // Invertido en azul
    else if (index == 7) return vec3(0.5 + 0.5 * color.r, color.g, color.b); // Desaturado en rojo
    else return vec3(color.r, color.g, 0.5 + 0.5 * color.b);                 // Desaturado en azul
}

void main() {
    // Coordenadas de textura normalizadas (0 a 1)
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    // Tamaño de cada celda en la rejilla 3x3
    vec2 celdaSize = 1.0 / vec2(3.0, 3.0);
    
    // Encontrar en qué celda estamos
    vec2 cellIndex = floor(uv / celdaSize);
    
    // Obtener el índice único de la celda (0 a 8)
    int cellId = int(cellIndex.x + cellIndex.y * 3.0);
    
    // Coordenadas de textura locales dentro de la celda
    vec2 localUV = fract(uv / celdaSize);
    
    // Obtener el color de la textura usando las coordenadas locales
    vec3 color = texture2D(u_texture, localUV).rgb;
    
    // Aplicar el efecto Warhol basado en la celda actual
    color = aplicarEfectoWarhol(color, cellId);
    
    // Asignar el color resultante al fragmento
    gl_FragColor = vec4(color, 1.0);
}