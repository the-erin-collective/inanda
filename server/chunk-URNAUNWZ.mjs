import './polyfills.server.mjs';
import{a as t}from"./chunk-NW7RVBCE.mjs";var e="taaPixelShader",r=`var textureSampler: texture_2d<f32>;var historySampler: texture_2d<f32>;uniform factor: f32;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {let c=textureLoad(textureSampler,vec2<i32>(fragmentInputs.position.xy),0);let h=textureLoad(historySampler,vec2<i32>(fragmentInputs.position.xy),0);fragmentOutputs.color= mix(h,c,uniforms.factor);}
`;t.ShadersStoreWGSL[e]||(t.ShadersStoreWGSL[e]=r);var o={name:e,shader:r};export{o as a};
