import{a as o}from"./chunk-L3UYHT7M.js";var e="boundingBoxRendererUboDeclaration",r=`#ifdef WEBGL2
uniform vec4 color;uniform mat4 world;uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#else
layout(std140,column_major) uniform;uniform BoundingBoxRenderer {vec4 color;mat4 world;mat4 viewProjection;mat4 viewProjectionR;};
#endif
`;o.IncludesShadersStore[e]||(o.IncludesShadersStore[e]=r);
