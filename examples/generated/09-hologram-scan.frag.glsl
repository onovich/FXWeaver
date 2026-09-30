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
uniform float uTime;

vec4 fxSampleSource(vec2 frameUv) {
  if (any(lessThan(frameUv, vec2(0.0))) || any(greaterThan(frameUv, vec2(1.0)))) return vec4(0.0);
  vec2 inputUv = frameUv * (uOutputFrame.zw * uInputSize.zw);
  return texture(uTexture, clamp(inputUv, uInputClamp.xy, uInputClamp.zw));
}

void main() {
  float v0_value = 0.5;
  float v1_value = uParam3;
  vec2 v2_value = uParam0;
  float v3_seconds = uTime;
  float v4_value = uParam2;
  float v5_value = 1.0;
  float v6_value = 0.9;
  float v7_value = uParam1;
  float v8_value = 0.72;
  vec4 v9_rgba = texture(uTexture, vTextureCoord);
  vec2 v10_uv = vTextureCoord / (uOutputFrame.zw * uInputSize.zw);
  vec2 v11_value = (v10_uv + v2_value);
  vec4 v12_rgba = fxSampleSource(v11_value);
  float v13_r = v9_rgba.r;
  float v13_g = v9_rgba.g;
  float v13_b = v9_rgba.b;
  float v13_a = v9_rgba.a;
  float v14_r = v12_rgba.r;
  float v14_g = v12_rgba.g;
  float v14_b = v12_rgba.b;
  float v14_a = v12_rgba.a;
  float v15_value = (v14_r * v13_a);
  vec4 v16_value = vec4(v15_value, v13_g, v13_b, v13_a);
  float v17_x = v10_uv.x;
  float v17_y = v10_uv.y;
  float v18_value = (v17_y * v4_value);
  float v19_value = (v3_seconds * v1_value);
  float v20_value = (v18_value + v19_value);
  float v21_value = sin(v20_value);
  float v22_value = (v21_value + v5_value);
  float v23_value = (v22_value * v0_value);
  float v24_value = smoothstep(v8_value, v6_value, v23_value);
  float v25_value = (v24_value * v7_value);
  float v26_value = (v5_value - v25_value);
  vec4 v27_value = (v16_value * v26_value);
  finalColor = v27_value;
}
