import{a as o}from"./chunk-L3UYHT7M.js";var r="oitFinalPixelShader",a=`precision highp float;uniform sampler2D uFrontColor;uniform sampler2D uBackColor;void main() {ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec4 frontColor=texelFetch(uFrontColor,fragCoord,0);vec4 backColor=texelFetch(uBackColor,fragCoord,0);float alphaMultiplier=1.0-frontColor.a;glFragColor=vec4(
frontColor.rgb+alphaMultiplier*backColor.rgb,
frontColor.a+backColor.a
);}`;o.ShadersStore[r]||(o.ShadersStore[r]=a);var e={name:r,shader:a};export{e as a};
