import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="meshUboDeclaration",o=`struct Mesh {world : mat4x4<f32>,
visibility : f32,};var<uniform> mesh : Mesh;
#define WORLD_UBO
`;e.IncludesShadersStoreWGSL[r]||(e.IncludesShadersStoreWGSL[r]=o);
