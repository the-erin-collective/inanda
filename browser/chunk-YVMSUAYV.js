import{a as e}from"./chunk-L3UYHT7M.js";var t="kernelBlurVertex",o="sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};";e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=o);var r="kernelBlurVertexShader",n=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStore[r]||(e.ShadersStore[r]=n);var S={name:r,shader:n};export{S as a};
