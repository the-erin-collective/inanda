import{a as e}from"./chunk-L3UYHT7M.js";var o="boundingBoxRendererFragmentDeclaration",d=`uniform vec4 color;
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=d);var r="boundingBoxRendererPixelShader",n=`#include<__decl__boundingBoxRendererFragment>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[r]||(e.ShadersStore[r]=n);var s={name:r,shader:n};export{s as a};
