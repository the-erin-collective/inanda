import{a as r}from"./chunk-L3UYHT7M.js";var e="bloomMergePixelShader",o=`uniform sampler2D textureSampler;uniform sampler2D bloomBlur;varying vec2 vUV;uniform float bloomWeight;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(textureSampler,vUV);vec3 blurred=texture2D(bloomBlur,vUV).rgb;gl_FragColor.rgb=gl_FragColor.rgb+(blurred.rgb*bloomWeight); }
`;r.ShadersStore[e]||(r.ShadersStore[e]=o);var t={name:e,shader:o};export{t as a};
