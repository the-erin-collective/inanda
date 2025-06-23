import './polyfills.server.mjs';
import{a as e}from"./chunk-NW7RVBCE.mjs";var i="uvAttributeDeclaration",f=`#ifdef UV{X}
attribute vec2 uv{X};
#endif
`;e.IncludesShadersStore[i]||(e.IncludesShadersStore[i]=f);var r="prePassVertexDeclaration",c=`#ifdef PREPASS
#ifdef PREPASS_LOCAL_POSITION
varying vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
varying vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying float vNormViewDepth;
#endif
#if defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)
uniform mat4 previousViewProjection;varying vec4 vCurrentPosition;varying vec4 vPreviousPosition;
#endif
#endif
`;e.IncludesShadersStore[r]||(e.IncludesShadersStore[r]=c);var n="samplerVertexDeclaration",v=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
varying vec2 v_VARYINGNAME_UV;
#endif
`;e.IncludesShadersStore[n]||(e.IncludesShadersStore[n]=v);var t="bumpVertexDeclaration",E=`#if defined(BUMP) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#endif
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=E);var o="prePassVertex",I=`#ifdef PREPASS_DEPTH
vViewPos=(view*worldPos).rgb;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
vNormViewDepth=((view*worldPos).z-cameraInfo.x)/(cameraInfo.y-cameraInfo.x);
#endif
#ifdef PREPASS_LOCAL_POSITION
vPosition=positionUpdated.xyz;
#endif
#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*worldPos;
#if NUM_BONE_INFLUENCERS>0
mat4 previousInfluence;previousInfluence=mPreviousBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
previousInfluence+=mPreviousBones[int(matricesIndices[1])]*matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
previousInfluence+=mPreviousBones[int(matricesIndices[2])]*matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
previousInfluence+=mPreviousBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
previousInfluence+=mPreviousBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
vPreviousPosition=previousViewProjection*finalPreviousWorld*previousInfluence*vec4(positionUpdated,1.0);
#else
vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#endif
`;e.IncludesShadersStore[o]||(e.IncludesShadersStore[o]=I);var s="uvVariableDeclaration",N=`#if !defined(UV{X}) && defined(MAINUV{X})
vec2 uv{X}=vec2(0.,0.);
#endif
#ifdef MAINUV{X}
vMainUV{X}=uv{X};
#endif
`;e.IncludesShadersStore[s]||(e.IncludesShadersStore[s]=N);var d="samplerVertexImplementation",_=`#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV==0
if (v_INFONAME_==0.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uvUpdated,1.0,0.0));}
#ifdef UV2
else if (v_INFONAME_==1.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv2Updated,1.0,0.0));}
#endif
#ifdef UV3
else if (v_INFONAME_==2.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv3,1.0,0.0));}
#endif
#ifdef UV4
else if (v_INFONAME_==3.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv4,1.0,0.0));}
#endif
#ifdef UV5
else if (v_INFONAME_==4.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv5,1.0,0.0));}
#endif
#ifdef UV6
else if (v_INFONAME_==5.)
{v_VARYINGNAME_UV=vec2(_MATRIXNAME_Matrix*vec4(uv6,1.0,0.0));}
#endif
#endif
`;e.IncludesShadersStore[d]||(e.IncludesShadersStore[d]=_);var a="decalVertexDeclaration",S=`#ifdef DECAL
uniform vec4 vDecalInfos;uniform mat4 decalMatrix;
#endif
`;e.IncludesShadersStore[a]||(e.IncludesShadersStore[a]=S);
