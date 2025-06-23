import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var r="copyTextureToTexturePixelShader",t=`uniform conversion: f32;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;varying vUV: vec2f;
#include<helperFunctions>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {var color: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#ifdef DEPTH_TEXTURE
fragmentOutputs.fragDepth=color.r;
#else
if (uniforms.conversion==1.) {color=toLinearSpaceVec4(color);} else if (uniforms.conversion==2.) {color=toGammaSpace(color);}
fragmentOutputs.color=color;
#endif
}
`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=t);var n={name:r,shader:t};export{n as a};
