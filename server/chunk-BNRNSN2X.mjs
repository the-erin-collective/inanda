import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="copyTexture3DLayerToTexturePixelShader",o=`precision highp sampler3D;uniform sampler3D textureSampler;uniform int layerNum;varying vec2 vUV;void main(void) {vec3 coord=vec3(0.0,0.0,float(layerNum));coord.xy=vec2(vUV.x,vUV.y)*vec2(textureSize(textureSampler,0).xy);vec3 color=texelFetch(textureSampler,ivec3(coord),0).rgb;gl_FragColor=vec4(color,1);}
`;e.ShadersStore[r]||(e.ShadersStore[r]=o);var a={name:r,shader:o};export{a};
