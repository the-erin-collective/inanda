import{a as e}from"./chunk-L3UYHT7M.js";var r="meshUVSpaceRendererPixelShader",a=`precision highp float;varying vec2 vDecalTC;uniform sampler2D textureSampler;void main(void) {if (vDecalTC.x<0. || vDecalTC.x>1. || vDecalTC.y<0. || vDecalTC.y>1.) {discard;}
gl_FragColor=texture2D(textureSampler,vDecalTC);}
`;e.ShadersStore[r]||(e.ShadersStore[r]=a);var t={name:r,shader:a};export{t as a};
