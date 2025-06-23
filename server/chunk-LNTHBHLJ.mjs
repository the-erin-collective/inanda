import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var o="fogVertex",r=`#ifdef FOG
vFogDistance=(view*worldPos).xyz;
#endif
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=r);
