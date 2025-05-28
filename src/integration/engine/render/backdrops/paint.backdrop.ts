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
  // Set the background color to transparent so the paint backdrop is visible
  scene.clearColor = new Color4(0, 0, 0, 0);

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
        // Add very subtle vertex movement for organic feel (much slower)
      vec3 newPosition = position;
      newPosition.x += sin(time * 0.15 + position.y * 2.0) * 0.01;
      newPosition.y += cos(time * 0.1 + position.x * 1.5) * 0.01;
      
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
      
      // Create base paint texture using noise (much slower movement)
      float baseNoise = fbm(uv * 6.0 + time * 0.02);
      float detailNoise = fbm(uv * 18.0 + time * 0.01);
      
      // Create additional noise layers for more variety
      float coarseNoise = fbm(uv * 3.0 + time * 0.005);
      float fineNoise = fbm(uv * 32.0 + time * 0.015);
      
      // Create brush strokes at different angles (slower rotation)
      float stroke1 = brushStroke(uv + vec2(sin(time * 0.08) * 0.05, cos(time * 0.06) * 0.03), time * 0.12, 0.18 * brushStrength);
      float stroke2 = brushStroke(uv + vec2(cos(time * 0.05) * 0.03, sin(time * 0.07) * 0.04), time * 0.09 + 1.57, 0.15 * brushStrength);
      float stroke3 = brushStroke(uv + vec2(sin(time * 0.11) * 0.02, cos(time * 0.13) * 0.025), time * 0.15 + 3.14, 0.12 * brushStrength);
      float stroke4 = brushStroke(uv + vec2(cos(time * 0.04) * 0.04, sin(time * 0.09) * 0.03), time * 0.18 + 4.71, 0.10 * brushStrength);
      
      // Combine strokes with more variety
      float brushPattern = max(stroke1, max(stroke2, max(stroke3, stroke4)));
      
      // Create paint splatters (slower movement)
      float splatter = 0.0;
      for (int i = 0; i < 12; i++) {
        float iFloat = float(i);
        vec2 splatterPos = vec2(
          sin(time * 0.2 + iFloat * 0.5) * 0.4 + 0.5,
          cos(time * 0.3 + iFloat * 0.7) * 0.4 + 0.5
        );
        float dist = distance(uv, splatterPos);
        float splatterSize = 0.05 + sin(time * 0.1 + iFloat) * 0.02;
        splatter += smoothstep(splatterSize * splatterDensity, splatterSize * 0.3 * splatterDensity, dist) * random(vec2(iFloat, time * 0.1));
      }
      
      // Mix paint colors with more complex blending
      vec3 color1Mix = mix(paintColor1, paintColor2, baseNoise * 0.7 + coarseNoise * 0.3);
      vec3 color2Mix = mix(color1Mix, paintColor3, detailNoise * 0.5 + fineNoise * 0.2);
      vec3 color3Mix = mix(paintColor2, paintColor1 * 0.8, coarseNoise * 0.6);
      
      // Apply brush strokes with more subtle blending
      vec3 brushColor = mix(color2Mix, color3Mix, brushPattern * 0.7);
      
      // Apply splatters with varied intensity
      vec3 splatterColor = mix(paintColor3 * 1.2, paintColor1 * 1.1, sin(time * 0.05));
      vec3 finalColor = mix(brushColor, splatterColor, splatter * 0.4);
      
      // Add multiple texture variation layers
      float texture1 = fbm(uv * 12.0 + time * 0.008) * 0.08;
      float texture2 = fbm(uv * 24.0 + time * 0.004) * 0.04;
      finalColor += texture1 + texture2;
      
      // Add subtle color shifts over time
      finalColor.r += sin(time * 0.03) * 0.02;
      finalColor.g += cos(time * 0.04) * 0.015;
      finalColor.b += sin(time * 0.025) * 0.02;
      
      // Ensure colors stay in valid range
      finalColor = clamp(finalColor, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;  // Create a plane to render the paint effect with extended coverage
  const paintPlane = PlaneBuilder.CreatePlane("paintBackdrop", {
    width: 2000,  // 2.5x wider than original 800 (800 * 2.5 = 2000)
    height: 960,  // 20% taller than original 800 (800 * 1.2 = 960)
    updatable: false
  }, scene);
  // Position the plane much further below everything (since camera looks down from above)
  paintPlane.position = new Vector3(0, -1000, 0);  // Even further below the origin
  paintPlane.rotation.x = Math.PI / 2; // Rotate to face upward towards the camera// Create the shader material
  const paintMaterial = new ShaderMaterial("paintMaterial", scene, {
    vertexSource: paintVertexShader,
    fragmentSource: paintFragmentShader
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
  
  // Ensure the plane renders as a backdrop
  paintPlane.isPickable = false;
  paintPlane.checkCollisions = false;
  paintPlane.renderingGroupId = 0; // Render first
  paintPlane.infiniteDistance = true; // Always render at maximum depth

  // Animate the shader with time
  let startTime = performance.now();
  scene.registerBeforeRender(() => {
    const currentTime = (performance.now() - startTime) / 1000.0;
    paintMaterial.setFloat("time", currentTime);
  });

  console.log('Paint backdrop created with shader-based paint effects');
}