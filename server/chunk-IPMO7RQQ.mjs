import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="meshUVSpaceRendererMaskerPixelShader",t=`varying vUV: vec2f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color= vec4f(1.0,1.0,1.0,1.0);}
`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=t);var n={name:r,shader:t};export{n as a};
