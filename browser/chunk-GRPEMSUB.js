import{a as e}from"./chunk-L3UYHT7M.js";var r="meshUVSpaceRendererFinaliserVertexShader",i=`precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec2 vUV;void main() {gl_Position=worldViewProjection*vec4(position,1.0);vUV=uv;}
`;e.ShadersStore[r]||(e.ShadersStore[r]=i);var t={name:r,shader:i};export{t as a};
