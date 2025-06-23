import{a as e}from"./chunk-L3UYHT7M.js";var n="pickingPixelShader",r=`#if defined(INSTANCES)
varying vMeshID: vec4f;
#else
uniform meshID: vec4f;
#endif
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#if defined(INSTANCES)
fragmentOutputs.color=input.vMeshID;
#else
fragmentOutputs.color=uniforms.meshID;
#endif
}`;e.ShadersStoreWGSL[n]||(e.ShadersStoreWGSL[n]=r);var i={name:n,shader:r};export{i as a};
