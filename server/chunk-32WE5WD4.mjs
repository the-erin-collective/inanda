import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="passPixelShader",a=`varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;e.ShadersStore[r]||(e.ShadersStore[r]=a);var t={name:r,shader:a};export{t as a};
