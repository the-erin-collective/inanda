import{a as r}from"./chunk-L3UYHT7M.js";var e="extractHighlightsPixelShader",o=`#include<helperFunctions>
varying vec2 vUV;uniform sampler2D textureSampler;uniform float threshold;uniform float exposure;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);float luma=dot(LuminanceEncodeApprox,gl_FragColor.rgb*exposure);gl_FragColor.rgb=step(threshold,luma)*gl_FragColor.rgb;}`;r.ShadersStore[e]||(r.ShadersStore[e]=o);var l={name:e,shader:o};export{l as a};
