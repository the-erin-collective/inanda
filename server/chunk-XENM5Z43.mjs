import './polyfills.server.mjs';
import{a as t}from"./chunk-NW7RVBCE.mjs";var e="oitBackBlendPixelShader",r=`var uBackColor: texture_2d<f32>;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=textureLoad(uBackColor,vec2i(fragmentInputs.position.xy),0);if (fragmentOutputs.color.a==0.0) {discard;}}
`;t.ShadersStoreWGSL[e]||(t.ShadersStoreWGSL[e]=r);var o={name:e,shader:r};export{o as a};
