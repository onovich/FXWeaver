import type { JsonValue, ValueType } from './schema';

export function isValueOfType(value: JsonValue, type: ValueType): boolean {
  switch (type) {
    case 'float': return typeof value === 'number' && Number.isFinite(value);
    case 'vec2': return isNumericTuple(value, 2);
    case 'vec3': return isNumericTuple(value, 3);
    case 'vec4': return isNumericTuple(value, 4);
    case 'color': return typeof value === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);
    case 'texture': return typeof value === 'string' && value.length > 0;
  }
}

function isNumericTuple(value: JsonValue, length: number): boolean {
  return Array.isArray(value) && value.length === length && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}
