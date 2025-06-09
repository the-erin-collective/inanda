import { 
  Scene, 
  Color4, 
  ShaderMaterial, 
  CreatePlane, 
  Vector3,
} from '@babylonjs/core';

export function createPaintBackdrop(scene: Scene): void {
  // Set the background color to white so the paint backdrop is visible over white
  scene.clearColor = new Color4(1, 1, 1, 1);

  // Define paint shader vertex source
  const paintVertexShader = `
    precision highp float;
    
    attribute vec3 position;
    attribute vec2 uv;
    
    uniform mat4 worldViewProjection;
    uniform float time;
    
    varying vec2 vUV;
    
    void main(void) {
      vUV = uv;
      // Add very subtle vertex movement for organic feel (much slower)
      vec3 newPosition = position;
      newPosition.x += sin(time * 0.15 + position.y * 2.0) * 0.01;
      newPosition.y += cos(time * 0.1 + position.x * 1.5) * 0.01;
      
      gl_Position = worldViewProjection * vec4(newPosition, 1.0);
    }
  `;
  // Define enhanced fluid paint shader fragment source
  const paintFragmentShader = `
    precision highp float;
    
    varying vec2 vUV;
    
    uniform float time;
    uniform vec3 paintColor1;
    uniform vec3 paintColor2;
    uniform vec3 paintColor3;
    uniform vec2 wakePos;
    uniform float wakeStrength;
    
    // Enhanced noise function with better distribution
    float hash(vec2 p) {
      p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
      return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
    }
    
    // Improved smooth noise with better interpolation
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      
      float a = hash(i + vec2(0.0, 0.0));
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    
    // Enhanced FBM with more octaves for richer detail
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Curl noise for fluid-like motion
    vec2 curlNoise(vec2 p) {
      float eps = 0.01;
      float n1 = noise(p + vec2(eps, 0.0));
      float n2 = noise(p - vec2(eps, 0.0));
      float n3 = noise(p + vec2(0.0, eps));
      float n4 = noise(p - vec2(0.0, eps));
        float dx = (n1 - n2) / (2.0 * eps);
      float dy = (n3 - n4) / (2.0 * eps);
      return vec2(dy, -dx);
    }
    
    // Fluid domain warping for organic flow with varied directions and speeds
    vec2 domainWarp(vec2 p, float time, vec2 direction, float speed) {
      vec2 q = vec2(fbm(p + direction * time * speed),
                    fbm(p + vec2(5.2, 1.3) + direction.yx * time * speed * 0.8));
        vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + direction * time * speed * 0.5),
                    fbm(p + 4.0 * q + vec2(8.3, 2.8) + direction.yx * time * speed * 0.6));
      return fbm(p + 4.0 * r) * vec2(1.0);
    }
    
    // Simplified rainbow mixing function for testing
    vec3 mixColorsRainbow(vec3 col1, vec3 col2, vec3 col3, float m1, float m2, float m3, float m4, float m5, float m6, float m7, vec2 uv, float layer1, float layer2, float layer3, float layer4, float layer5, float layer6, float layer7) {
      // Basic rainbow color mixing without edge detection
      vec3 red = col1;
      vec3 orange = mix(col1, vec3(1.0, 0.5, 0.1), 0.7);
      vec3 yellow = vec3(1.0, 0.9, 0.2);
      vec3 green = vec3(0.2, 0.9, 0.3);
      vec3 blue = col2;
      vec3 indigo = mix(col2, col3, 0.6);
      vec3 violet = col3;
      
      // Simple blend
      float total = m1 + m2 + m3 + m4 + m5 + m6 + m7 + 0.01;
      vec3 finalBlend = (red * m1 + orange * m2 + yellow * m3 + green * m4 + blue * m5 + indigo * m6 + violet * m7) / total;
      
      return finalBlend;
    }
    
    void main(void) {
      vec2 uv = vUV;
      float t = time * 0.025; // Much slower overall time scale
      
      float dirSpeed = 0.17;
      // Precompute and reuse sin/cos for direction vectors
      float td0 = t * dirSpeed;
      float td1 = td0 + 1.0;
      float td2 = td0 + 2.0;
      float td3 = td0 + 3.0;
      float td4 = td0 + 4.0;
      float td5 = td0 + 5.0;
      float s0 = sin(td0), c1 = cos(td1);
      float s2 = sin(td2), c3 = cos(td3);
      float s4 = sin(td4), c5 = cos(td5);
      vec2 dir1 = normalize(vec2(s0, c1));
      vec2 dir2 = normalize(vec2(s2, c3));
      vec2 dir3 = normalize(vec2(s4, c5));
      
      // Precompute and reuse sin/cos for color flows and window offset
      vec2 windowOffset = vec2(sin(t * 0.04), cos(t * 0.035)) * 1.2; // Keep this one as it's the base
      
      // Simplify color flow patterns to reduce unique calculations
      float baseTime = t * 0.05; // A single base time multiplier
      
      vec2 colorFlow1 = vec2(sin(baseTime), cos(baseTime + 1.0)) * 0.4 + windowOffset;
      vec2 colorFlow2 = vec2(cos(baseTime + 2.0), sin(baseTime + 3.0)) * 0.35 + windowOffset;
      vec2 colorFlow3 = vec2(sin(baseTime + 4.0), cos(baseTime + 5.0)) * 0.38 + windowOffset;
      vec2 colorFlow4 = vec2(cos(baseTime + 6.0), sin(baseTime + 7.0)) * 0.42 + windowOffset;
      vec2 colorFlow5 = vec2(sin(baseTime + 8.0), cos(baseTime + 9.0)) * 0.36 + windowOffset;
      vec2 colorFlow6 = vec2(cos(baseTime + 10.0), sin(baseTime + 11.0)) * 0.39 + windowOffset;
      vec2 colorFlow7 = vec2(sin(baseTime + 12.0), cos(baseTime + 13.0)) * 0.37 + windowOffset;
      
      // Create multiple fluid motion fields with slower fine details to reduce rippling
      float baseMotionScale = 1.5; // Unified scale for uv input
      vec2 motion1 = curlNoise(uv * baseMotionScale + dir1 * t * 0.018) * 0.015; // Slower large-scale motion
      vec2 motion2 = curlNoise(uv * baseMotionScale * 1.4 + dir2 * t * 0.003) * 0.008; // Adjusted strength
      vec2 motion3 = curlNoise(uv * baseMotionScale * 1.2 + dir3 * t * 0.002) * 0.006; // Adjusted strength
      
      // Combine motions for complex flow
      vec2 fluidUV = uv + motion1 + motion2 * 0.6 + motion3 * 0.4;
      // Mouse wake distortion (apply here, before using fluidUV)
      float wakeDist2 = dot(uv - wakePos, uv - wakePos);
      float wakeAmount = wakeStrength * exp(-wakeDist2 * 2500.0); // 50^2 = 2500, sharper falloff
      vec2 wakeDir = normalize(uv - wakePos + 0.0001);
      fluidUV += wakeDir * wakeAmount * 0.005; // stronger distortion
      
      // Domain warping with slower evolving directions to reduce fine rippling
      float baseWarpSpeed = 0.015; // Unified base speed for warping
      vec2 warp1 = domainWarp(fluidUV * 1.8, t, normalize(dir1), baseWarpSpeed * 2.0); // Adjusted speed
      vec2 warp2 = domainWarp(fluidUV * 2.5 + warp1 * 0.4, t, normalize(dir2), baseWarpSpeed * 0.3); // Adjusted speed
      vec2 warp3 = domainWarp(fluidUV * 1.2 + warp2 * 0.2, t, normalize(dir3), baseWarpSpeed * 0.2); // Adjusted speed
      
      // Multi-scale noise layers with slower fine details to reduce rippling
      float layer1 = fbm((fluidUV + colorFlow1) * 4.2 + warp1 * 0.6 + dir1 * t * 0.011); // Red regions - slower
      float layer2 = fbm((fluidUV + colorFlow2) * 5.8 + warp2 * 0.4 + dir2 * t * 0.013); // Orange regions - slower
      float layer3 = fbm((fluidUV + colorFlow3) * 7.5 + warp1 * 0.3 + dir3 * t * 0.012); // Yellow regions - slower
      float layer4 = fbm((fluidUV + colorFlow4) * 3.9 + warp3 * 0.5 + dir1 * t * 0.009); // Green regions - slower
      float layer5 = fbm((fluidUV + colorFlow5) * 6.1 + warp2 * 0.35 + dir2 * t * 0.014); // Blue regions - slower
      float layer6 = fbm((fluidUV + colorFlow6) * 8.2 + warp1 * 0.25 + dir3 * t * 0.01); // Indigo regions - slower
      float layer7 = fbm((fluidUV + colorFlow7) * 4.7 + warp3 * 0.45 + dir1 * t * 0.012); // Violet regions - slower

      // Create base masks with moderate smoothing
      float mask1 = smoothstep(-0.2, 0.8, layer1 + layer2 * 0.2 + layer4 * 0.15); // Red (wider)
      float mask2 = smoothstep(-0.1, 0.9, layer2 + layer3 * 0.25 + layer1 * 0.15); // Orange (wider)
      float mask3 = smoothstep(-0.3, 0.7, layer3 + layer4 * 0.2 + layer5 * 0.2); // Yellow (wider)
      float mask4 = smoothstep(0.0, 1.0, layer4 + layer5 * 0.25 + layer6 * 0.15); // Green (wider)
      float mask5 = smoothstep(-0.25, 0.75, layer5 + layer6 * 0.2 + layer7 * 0.2); // Blue (wider)
      float mask6 = smoothstep(-0.15, 0.85, layer6 + layer7 * 0.25 + layer1 * 0.15); // Indigo (wider)
      float mask7 = smoothstep(-0.35, 0.65, layer7 + layer1 * 0.2 + layer3 * 0.15); // Violet (wider)
      
      // Add global coverage layer to ensure no gaps between colors
      float globalCoverage = smoothstep(-1.0, 0.5, (layer1 + layer2 + layer3 + layer4 + layer5 + layer6 + layer7) * 0.2);
      
      // Add swirling patterns with much slower evolution and changing directions
      vec2 center = vec2(0.5);
      vec2 toCenter = uv - center;
      float angle = atan(toCenter.y, toCenter.x);
      float radius = length(toCenter);
      
      // Multiple swirl patterns with slowly evolving speeds and directions
      float swirl1 = sin(angle * 3.0 + radius * 8.0 + t * 0.3) * 0.5 + 0.5; // Much slower large swirls
      float swirl2 = sin(angle * 5.0 + radius * 12.0 + t * 0.4) * 0.3 + 0.7; // Slower medium speed
      float swirl = (swirl1 + swirl2) * 0.5;
      swirl *= smoothstep(0.8, 0.0, radius); // Softer and more gradual fade
      
      // Create multiple smaller fluid tendrils with slowly evolving motion directions
      float tendrils = 0.0;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        // Precompute and reuse sin/cos for tendril directions
        float fi21 = fi * 2.1, fi17 = fi * 1.7;
        float sfi21 = sin(fi21), cfi17 = cos(fi17);
        vec2 direction = normalize(vec2(sfi21, cfi17)); // Static direction based on fi
        
        float speed = 0.2; // Constant speed for all tendrils
        float tSpeed = t * speed + fi * 2.1;
        float s_tSpeed = sin(tSpeed);
        vec2 offset = direction * s_tSpeed * 0.25;
        float tendrilDist2 = dot(fluidUV - (center + offset), fluidUV - (center + offset));
        float tendril = smoothstep(0.03 * 0.03, 0.0, tendrilDist2);
        tendrils += tendril * 0.8; // Constant weight for all tendrils
      }
      
      // Enhanced rainbow color blending with more variety and smooth window transitions
      vec3 baseColor = mixColorsRainbow(paintColor1, paintColor2, paintColor3,
                                       mask1 + swirl * 0.2 + globalCoverage * 0.1, 
                                       mask2 + tendrils * 0.3 + globalCoverage * 0.15, 
                                       mask3 + swirl * tendrils * 0.4 + globalCoverage * 0.1,
                                       mask4 + swirl * 0.25 + globalCoverage * 0.2,
                                       mask5 + tendrils * 0.35 + globalCoverage * 0.1,
                                       mask6 + swirl * 0.3 + globalCoverage * 0.15,
                                       mask7 + tendrils * swirl * 0.45 + globalCoverage * 0.1,
                                       fluidUV, layer1, layer2, layer3, layer4, layer5, layer6, layer7);
      
      // Add slower rainbow iridescence to reduce fast rippling while keeping effect
      vec3 iridescent = vec3(
        sin(layer1 * 1.5 + t * 0.08) * 0.5 + 0.5, // Much slower red-orange shifts
        sin(layer3 * 1.8 + t * 0.09 + 2.1) * 0.5 + 0.5, // Slower yellow-green shifts  
        sin(layer5 * 1.6 + t * 0.07 + 4.2) * 0.5 + 0.5  // Slower blue-violet shifts
      );
      
      // Slower rainbow color temperature mixing to reduce shimmering
      vec3 warmShift = vec3(1.1, 0.95, 0.85); // Warm tones
      vec3 coolShift = vec3(0.85, 0.95, 1.15); // Cool tones
      float temperatureMix = sin(t * 0.05 + layer2 * 0.8) * 0.5 + 0.5; // Slower temperature changes
      vec3 temperatureBlend = mix(coolShift, warmShift, temperatureMix);
      
      // Blend with base colors using enhanced rainbow mixing
      vec3 finalColor = mix(baseColor, baseColor * iridescent * temperatureBlend, 0.2);
      
      // Add flowing rainbow highlights with enhanced brightness
      float highlight = smoothstep(0.3, 1.0, layer2 + layer4 + swirl * 0.4 + layer6 * 0.3);
      finalColor += highlight * 0.2;
      
      // Boost saturation for more vibrant rainbow colors
      float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
      finalColor = mix(vec3(luminance), finalColor, 1.7); // Higher saturation for rainbow effect
        // Add color temperature warmth without muddying
      finalColor.r += 0.05;
      finalColor.g += 0.02;
      
      // Add much slower temporal color shifts to eliminate fast rippling
      finalColor.rgb += vec3(
        sin(t * 0.06) * 0.015, // Much slower shifts to reduce rippling
        cos(t * 0.05) * 0.015,
        sin(t * 0.07) * 0.015
      );
      
      // Ensure vibrant color range without clamping too early
      finalColor = clamp(finalColor, 0.0, 1.2);
      
      // --- SOFT EDGE FADE LOGIC ---
      // Find the strongest mask at this pixel (how "inside" a region you are)
      float maxMask = max(max(max(max(max(max(mask1, mask2), mask3), mask4), mask5), mask6), mask7);
      float minMask = min(min(min(min(min(min(mask1, mask2), mask3), mask4), mask5), mask6), mask7);
      float fineDetail = maxMask - minMask; // Higher where there's a sharp transition (fine detail)
      float fineDetailFade = 1.0 - smoothstep(0.0, 0.2, fineDetail); // Lower alpha where fine detail is high
      // Fade out alpha at the edge of any region, modulated by fine detail fade
      float edgeAlpha = smoothstep(0.0, 0.15, maxMask) * fineDetailFade;
      
      float globalOpacity = 0.1; // Set to 50% opacity
      gl_FragColor = vec4(finalColor, edgeAlpha * globalOpacity);

      // Debug: visualize the wakePos as a red dot
      // float debugDist = distance(vUV, wakePos);
      // if (debugDist < 0.01) {
      //   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      //   return;
      // }
    }
  `;
  // Create a plane to render the paint effect with extended coverage
  const paintPlane = CreatePlane("paintBackdrop", {
    width: 2000,  // 2.5x wider than original 800 (800 * 2.5 = 2000)
    height: 960,  // 20% taller than original 800 (800 * 1.2 = 960)
    updatable: false
  }, scene);
  // Position the plane much further below everything (since camera looks down from above)
  paintPlane.position = new Vector3(0, -1000, 0);  // Even further below the origin
  paintPlane.rotation.x = Math.PI / 2; // Rotate to face upward towards the camera
  // Create the shader material
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
      "wakePos",
      "wakeStrength"
    ]
  });  // Set shader uniforms with rainbow spectrum colors for window-like effect
  paintMaterial.setVector3("paintColor1", new Vector3(1.0, 0.15, 0.3)); // Deep red-pink
  paintMaterial.setVector3("paintColor2", new Vector3(0.2, 0.8, 1.0)); // Bright cyan-blue  
  paintMaterial.setVector3("paintColor3", new Vector3(0.95, 0.1, 0.85)); // Vivid magenta
  // Apply material to plane
  paintPlane.material = paintMaterial;
  
  // Freeze the material for performance (as long as only uniforms are updated)
  paintMaterial.freeze();
  
  // Ensure the plane renders as a backdrop
  paintPlane.isPickable = false;
  paintPlane.checkCollisions = false;
  paintPlane.renderingGroupId = 0; // Render first
  paintPlane.infiniteDistance = true; // Always render at maximum depth

  // Mouse wake effect state
  let mousePos = { x: 0.5, y: 0.5 }; // always tracks latest mouse position
  let wakePos = { x: 0.5, y: 0.5 }; // last position where wakeStrength was reset
  let wakeStrength = 0.0;
  let lastWakeUpdate = performance.now();
  const canvas = scene.getEngine().getRenderingCanvas();
  if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      // Babylon.js expects pointerX/Y in client coordinates
      const pickResult = scene.pick(pointerX, pointerY, mesh => mesh === paintPlane);
      if (pickResult && pickResult.hit && pickResult.getTextureCoordinates) {
        const uv = pickResult.getTextureCoordinates();
        if (uv) {
          mousePos.x = uv.x;
          mousePos.y = uv.y;
          wakePos.x = mousePos.x;
          wakePos.y = mousePos.y;
          wakeStrength = 1.0;
          lastWakeUpdate = performance.now();
        }
      }
    });
  }

  // Animate the shader with time
  let startTime = performance.now();
  let accumulatedTime = 0;
  let lastFrameTime = performance.now();
  scene.registerBeforeRender(() => {
    const now = performance.now();
    const deltaTime = (now - lastFrameTime) / 1000.0; // seconds
    lastFrameTime = now;
    const animationRatio = scene.getAnimationRatio();
    accumulatedTime += deltaTime * animationRatio;
    paintMaterial.setFloat("time", accumulatedTime);
    // Decay wakeStrength exponentially to fade out over ~2 seconds
    const dt = (now - lastWakeUpdate) / 1000.0;
    // Exponential decay: strength = exp(-t / tau), tau ~8s (even slower decay)
    const tau = 16.0;
    wakeStrength *= Math.exp(-dt / tau);
    lastWakeUpdate = now;
    // Always set wakePos to latest mouse position every frame
    paintMaterial.setVector2("wakePos", new Vector3(mousePos.x, mousePos.y, 0));
    paintMaterial.setFloat("wakeStrength", wakeStrength);
  });

  console.log('Paint backdrop created with shader-based paint effects');
}