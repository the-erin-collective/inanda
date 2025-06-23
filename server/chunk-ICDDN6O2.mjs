import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var i="pickingPixelShader",r=`#if defined(INSTANCES)
varying vec4 vMeshID;
#else
uniform vec4 meshID;
#endif
void main(void) {
#if defined(INSTANCES)
gl_FragColor=vMeshID;
#else
gl_FragColor=meshID;
#endif
}`;e.ShadersStore[i]||(e.ShadersStore[i]=r);var d={name:i,shader:r};export{d as a};
