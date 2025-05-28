import { 
  Scene, 
  Color4, 
  ShaderMaterial, 
  PlaneBuilder, 
  Mesh, 
  Effect, 
  Vector3,
  Texture,
  RenderTargetTexture,
  Color3
} from '@babylonjs/core';

export function createPaintBackdrop(scene: Scene): void {
  // Set the background color to a neutral tone
  scene.clearColor = new Color4(0.95, 0.95, 0.95, 1);

  // Define paint shader vertex source
  const paintVertexShader = `
    precision highp float;
    
    attribute vec3 position;
    attribute vec2 uv;
    
    uniform mat4 worldViewProjection;
    uniform float time;
    
    varying vec2 vUV;
    varying vec3 vPosition;
    
    void main(void) {
      vUV = uv;
      vPosition = position;
      
      // Add subtle vertex movement for organic feel
      vec3 newPosition = position;
      newPosition.x += sin(time * 0.5 + position.y * 3.0) * 0.02;
      newPosition.y += cos(time * 0.3 + position.x * 2.0) * 0.02;
      
      gl_Position = worldViewProjection * vec4(newPosition, 1.0);
    }
  `;

  // Define paint shader fragment source
  const paintFragmentShader = `
    precision highp float;
    
    varying vec2 vUV;
    varying vec3 vPosition;
    
    uniform float time;
    uniform vec3 paintColor1;
    uniform vec3 paintColor2;
    uniform vec3 paintColor3;
    uniform float brushStrength;
    uniform float splatterDensity;
    
    // Simple noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Smooth noise
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Fractal Brownian Motion for organic textures
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Create brush stroke pattern
    float brushStroke(vec2 uv, float angle, float width) {
      vec2 center = vec2(0.5);
      vec2 dir = vec2(cos(angle), sin(angle));
      vec2 perpDir = vec2(-dir.y, dir.x);
      
      vec2 offset = uv - center;
      float projLength = dot(offset, dir);
      float perpDist = abs(dot(offset, perpDir));
      
      float stroke = smoothstep(width, width * 0.5, perpDist);
      stroke *= smoothstep(1.0, 0.8, abs(projLength));
      
      return stroke;
    }
    
    void main(void) {
      vec2 uv = vUV;
      
      // Create base paint texture using noise
      float baseNoise = fbm(uv * 8.0 + time * 0.1);
      float detailNoise = fbm(uv * 24.0 + time * 0.05);
      
      // Create brush strokes at different angles
      float stroke1 = brushStroke(uv + vec2(sin(time * 0.3) * 0.1, 0.0), time * 0.5, 0.15 * brushStrength);
      float stroke2 = brushStroke(uv + vec2(0.0, cos(time * 0.2) * 0.1), time * 0.3 + 1.57, 0.12 * brushStrength);
      float stroke3 = brushStroke(uv + vec2(sin(time * 0.4) * 0.05, cos(time * 0.6) * 0.05), time * 0.7 + 3.14, 0.08 * brushStrength);
      
      // Combine strokes
      float brushPattern = max(stroke1, max(stroke2, stroke3));
      
      // Create paint splatters
      float splatter = 0.0;
      for (int i = 0; i < 8; i++) {
        vec2 splatterPos = vec2(
          sin(time * 0.7 + float(i) * 0.8) * 0.3 + 0.5,
          cos(time * 0.9 + float(i) * 1.2) * 0.3 + 0.5
        );
        float dist = distance(uv, splatterPos);
        splatter += smoothstep(0.1 * splatterDensity, 0.02 * splatterDensity, dist) * random(vec2(float(i), time));
      }
      
      // Mix paint colors based on noise and effects
      vec3 color1Mix = mix(paintColor1, paintColor2, baseNoise);
      vec3 color2Mix = mix(color1Mix, paintColor3, detailNoise * 0.7);
      
      // Apply brush strokes
      vec3 brushColor = mix(color2Mix, paintColor1 * 1.2, brushPattern);
      
      // Apply splatters
      vec3 finalColor = mix(brushColor, paintColor3 * 1.5, splatter * 0.6);
      
      // Add some texture variation
      float texture = fbm(uv * 16.0) * 0.1;
      finalColor += texture;
      
      // Ensure colors stay in valid range
      finalColor = clamp(finalColor, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Register the shader effect
  Effect.ShadersStore["paintVertexShader"] = paintVertexShader;
  Effect.ShadersStore["paintFragmentShader"] = paintFragmentShader;

  // Create a plane to render the paint effect
  const paintPlane = PlaneBuilder.CreatePlane("paintBackdrop", {
    size: 200,
    updatable: false
  }, scene);

  // Position the plane behind everything
  paintPlane.position = new Vector3(0, 0, -50);
  paintPlane.rotation.x = 0;
  // Create the shader material
  const paintMaterial = new ShaderMaterial("paintMaterial", scene, {
    vertex: "paintVertexShader",
    fragment: "paintFragmentShader"
  }, {
    attributes: ["position", "uv"],
    uniforms: [
      "worldViewProjection", 
      "time", 
      "paintColor1", 
      "paintColor2", 
      "paintColor3",
      "brushStrength",
      "splatterDensity"
    ]
  });

  // Set shader uniforms with beautiful paint colors
  paintMaterial.setVector3("paintColor1", new Vector3(0.8, 0.4, 0.2)); // Warm orange
  paintMaterial.setVector3("paintColor2", new Vector3(0.2, 0.6, 0.8)); // Cool blue  
  paintMaterial.setVector3("paintColor3", new Vector3(0.7, 0.2, 0.6)); // Purple accent
  paintMaterial.setFloat("brushStrength", 1.0);
  paintMaterial.setFloat("splatterDensity", 0.8);

  // Apply material to plane
  paintPlane.material = paintMaterial;
  
  // Ensure the plane doesn't interfere with other objects
  paintPlane.isPickable = false;
  paintPlane.checkCollisions = false;

  // Animate the shader with time
  let startTime = performance.now();
  scene.registerBeforeRender(() => {
    const currentTime = (performance.now() - startTime) / 1000.0;
    paintMaterial.setFloat("time", currentTime);
  });

  console.log('Paint backdrop created with shader-based paint effects');
}