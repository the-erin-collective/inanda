import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="filterPixelShader",o=`varying vec2 vUV;uniform sampler2D textureSampler;uniform mat4 kernelMatrix;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec3 baseColor=texture2D(textureSampler,vUV).rgb;vec3 updatedColor=(kernelMatrix*vec4(baseColor,1.0)).rgb;gl_FragColor=vec4(updatedColor,1.0);}`;e.ShadersStore[r]||(e.ShadersStore[r]=o);var a={name:r,shader:o};export{a};
