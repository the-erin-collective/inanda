import './polyfills.server.mjs';
import{a as r}from"./chunk-NW7RVBCE.mjs";var e="fluidRenderingParticleDiffusePixelShader",o=`uniform float particleAlpha;varying vec2 uv;varying vec3 diffuseColor;void main(void) {vec3 normal;normal.xy=uv*2.0-1.0;float r2=dot(normal.xy,normal.xy);if (r2>1.0) discard;glFragColor=vec4(diffuseColor,1.0);}
`;r.ShadersStore[e]||(r.ShadersStore[e]=o);var a={name:e,shader:o};export{a};
