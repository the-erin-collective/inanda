import{a as e}from"./chunk-L3UYHT7M.js";var i="pickingPixelShader",r=`#if defined(INSTANCES)
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
