#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uOutputFrame;
uniform highp vec4 uInputClamp;
uniform float uParam0;
uniform float uParam1;
uniform float uParam2;
uniform float uParam3;
uniform float uTime;

vec4 fxSampleSource(vec2 frameUv) {
  if (any(lessThan(frameUv, vec2(0.0))) || any(greaterThan(frameUv, vec2(1.0)))) return vec4(0.0);
  vec2 inputUv = frameUv * (uOutputFrame.zw * uInputSize.zw);
  return texture(uTexture, clamp(inputUv, uInputClamp.xy, uInputClamp.zw));
}

void main() {
  vec2 v0_uv = vTextureCoord / (uOutputFrame.zw * uInputSize.zw);
  float v1_x = v0_uv.x;
  float v1_y = v0_uv.y;
  float v2_value = uParam2;
  float v3_value = uParam0;
  float v4_value = uParam1;
  float v5_seconds = uTime;
  float v6_value = (v5_seconds * v3_value);
  float v7_value = uParam3;
  float v8_value = (v1_y * v7_value);
  float v9_value = (v8_value + v6_value);
  float v10_value = sin(v9_value);
  float v11_value = (v10_value * v4_value);
  float v12_value = (v11_value * v2_value);
  float v13_value = 0.0;
  vec2 v14_value = vec2(v12_value, v13_value);
  vec2 v15_value = (v0_uv + v14_value);
  vec4 v16_rgba = fxSampleSource(v15_value);
  finalColor = v16_rgba;
}
