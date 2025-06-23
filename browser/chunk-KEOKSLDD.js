import{a as e}from"./chunk-L3UYHT7M.js";var o="copyTextureToTexturePixelShader",r=`uniform float conversion;uniform sampler2D textureSampler;varying vec2 vUV;
#include<helperFunctions>
void main(void) 
{vec4 color=texture2D(textureSampler,vUV);
#ifdef DEPTH_TEXTURE
gl_FragDepth=color.r;
#else
if (conversion==1.) {color=toLinearSpace(color);} else if (conversion==2.) {color=toGammaSpace(color);}
gl_FragColor=color;
#endif
}
`;e.ShadersStore[o]||(e.ShadersStore[o]=r);var i={name:o,shader:r};export{i as a};
