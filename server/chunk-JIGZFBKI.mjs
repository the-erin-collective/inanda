import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var o="pointCloudVertex",t=`#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=t);
