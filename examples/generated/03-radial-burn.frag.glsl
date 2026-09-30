#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uOutputFrame;
uniform highp vec4 uInputClamp;
uniform vec2 uParam0;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform vec4 uParam4;
uniform sampler2D uAsset0;

vec4 fxSampleAsset0(vec2 uv) {
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);
  return texture(uAsset0, uv);
}

void main() {
  vec4 v0_rgba = texture(uTexture, vTextureCoord);
  vec2 v1_uv = vTextureCoord / (uOutputFrame.zw * uInputSize.zw);
  vec4 v2_color = uParam4;
  vec4 v3_rgba = fxSampleAsset0(v1_uv);
  vec4 v4_rgba = v2_color;
  float v5_value = uParam1;
  float v6_value = 1.0;
  float v7_r = v3_rgba.r;
  float v7_g = v3_rgba.g;
  float v7_b = v3_rgba.b;
  float v7_a = v3_rgba.a;
  float v8_value = uParam2;
  float v9_value = (v7_r * v8_value);
  float v10_value = uParam3;
  float v11_value = (v10_value + v9_value);
  vec2 v12_value = uParam0;
  float v13_value = distance(v1_uv, v12_value);
  float v14_value = (v11_value + v5_value);
  float v15_value = smoothstep(v11_value, v14_value, v13_value);
  vec4 v16_value = mix(v0_rgba, v4_rgba, v15_value);
  float v17_value = (v6_value - v15_value);
  vec4 v18_value = (v16_value * v17_value);
  finalColor = v18_value;
}
