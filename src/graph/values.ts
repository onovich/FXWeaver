import type { JsonValue, ValueType } from './schema';

const MAX_GLSL_FLOAT = 3.402823466e38;
function isGlslNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_GLSL_FLOAT;
}

export function isValueOfType(value: JsonValue, type: ValueType): boolean {
  switch (type) {
    case 'float': return isGlslNumber(value);
    case 'vec2': return isNumericTuple(value, 2);
    case 'vec3': return isNumericTuple(value, 3);
    case 'vec4': return isNumericTuple(value, 4);
    case 'color': return typeof value === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);
    case 'texture': return typeof value === 'string' && value.length > 0;
  }
}

function isNumericTuple(value: JsonValue, length: number): boolean {
  return Array.isArray(value) && value.length === length && value.every(isGlslNumber);
}
