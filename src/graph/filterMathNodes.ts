import type { NodeDefinition } from './registry';
import type { ValueType } from './schema';

type PortSpec = [id: string, type: ValueType];

function define(name: string, label: string, category: string, inputs: PortSpec[], outputs: PortSpec[], description: string): NodeDefinition {
  return {
    type: `filter.${name}`, version: 1, label, category, description,
    inputs: inputs.map(([id, type]) => ({ id, label: id, type, required: true })),
    outputs: outputs.map(([id, type]) => ({ id, label: id, type })), properties: [],
  };
}

const floatBinary = [
  ['add', 'Add', 'a + b'],
  ['subtract', 'Subtract', 'a - b'],
  ['multiply', 'Multiply', 'a × b'],
  ['divide', 'Divide', 'a ÷ b'],
  ['min', 'Minimum', 'smaller input'],
  ['max', 'Maximum', 'larger input'],
  ['mod', 'Modulo', 'floating-point remainder'],
  ['pow', 'Power', 'a raised to b'],
] as const;

const floatUnary = [
  ['sin', 'Sine', 'sine of radians'],
  ['cos', 'Cosine', 'cosine of radians'],
  ['abs', 'Absolute', 'absolute value'],
  ['floor', 'Floor', 'round down'],
  ['fract', 'Fraction', 'fractional part'],
] as const;

const definitions: NodeDefinition[] = [
  ...floatBinary.map(([name, label, description]) => define(`${name}-float`, label, 'Math', [['a', 'float'], ['b', 'float']], [['value', 'float']], description)),
  ...floatUnary.map(([name, label, description]) => define(`${name}-float`, label, 'Math', [['x', 'float']], [['value', 'float']], description)),
  define('clamp-float', 'Clamp', 'Math', [['x', 'float'], ['low', 'float'], ['high', 'float']], [['value', 'float']], 'Limits a scalar to the low–high interval.'),
  define('step-float', 'Step', 'Threshold', [['edge', 'float'], ['x', 'float']], [['value', 'float']], 'Hard threshold: 0 below edge, otherwise 1.'),
  define('smoothstep-float', 'Smoothstep', 'Threshold', [['low', 'float'], ['high', 'float'], ['x', 'float']], [['value', 'float']], 'Smooth transition from 0 to 1 between two edges.'),
  define('mix-float', 'Mix Number', 'Mix', [['a', 'float'], ['b', 'float'], ['t', 'float']], [['value', 'float']], 'Linear interpolation with scalar weight.'),
  define('add-vec2', 'Add Vector 2', 'Math', [['a', 'vec2'], ['b', 'vec2']], [['value', 'vec2']], 'Adds two coordinate pairs.'),
  define('subtract-vec2', 'Subtract Vector 2', 'Math', [['a', 'vec2'], ['b', 'vec2']], [['value', 'vec2']], 'Subtracts two coordinate pairs.'),
  define('scale-vec2', 'Scale Vector 2', 'Math', [['vector', 'vec2'], ['scale', 'float']], [['value', 'vec2']], 'Scales a coordinate pair by a number.'),
  define('length-vec2', 'Vector 2 Length', 'Math', [['vector', 'vec2']], [['value', 'float']], 'Distance of a coordinate pair from zero.'),
  define('distance-vec2', 'Vector 2 Distance', 'Math', [['a', 'vec2'], ['b', 'vec2']], [['value', 'float']], 'Distance between two coordinate pairs.'),
  define('add-vec3', 'Add Vector 3', 'Math', [['a', 'vec3'], ['b', 'vec3']], [['value', 'vec3']], 'Adds three-component values.'),
  define('scale-vec3', 'Scale Vector 3', 'Math', [['vector', 'vec3'], ['scale', 'float']], [['value', 'vec3']], 'Scales a three-component value.'),
  define('mix-vec3', 'Mix Vector 3', 'Mix', [['a', 'vec3'], ['b', 'vec3'], ['t', 'float']], [['value', 'vec3']], 'Linear interpolation of three-component values.'),
  define('add-vec4', 'Add Vector 4', 'Math', [['a', 'vec4'], ['b', 'vec4']], [['value', 'vec4']], 'Adds four-component values.'),
  define('scale-vec4', 'Scale Vector 4', 'Math', [['vector', 'vec4'], ['scale', 'float']], [['value', 'vec4']], 'Scales a four-component value.'),
  define('mix-vec4', 'Mix Vector 4', 'Mix', [['a', 'vec4'], ['b', 'vec4'], ['t', 'float']], [['value', 'vec4']], 'Linear interpolation of RGBA or four-component values.'),
  define('split-vec2', 'Split Vector 2', 'Channel', [['vector', 'vec2']], [['x', 'float'], ['y', 'float']], 'Reads individual coordinate components.'),
  define('compose-vec2', 'Compose Vector 2', 'Channel', [['x', 'float'], ['y', 'float']], [['value', 'vec2']], 'Combines two numbers into a coordinate pair.'),
  define('split-vec4', 'Split RGBA', 'Channel', [['rgba', 'vec4']], [['r', 'float'], ['g', 'float'], ['b', 'float'], ['a', 'float']], 'Reads individual RGBA components.'),
  define('rgb-vec4', 'RGB from RGBA', 'Channel', [['rgba', 'vec4']], [['rgb', 'vec3']], 'Reads RGB while discarding alpha.'),
  define('alpha-vec4', 'Alpha from RGBA', 'Channel', [['rgba', 'vec4']], [['alpha', 'float']], 'Reads alpha from RGBA.'),
  define('compose-vec3', 'Compose Vector 3', 'Channel', [['x', 'float'], ['y', 'float'], ['z', 'float']], [['value', 'vec3']], 'Combines three numbers.'),
  define('compose-vec4', 'Compose Vector 4', 'Channel', [['x', 'float'], ['y', 'float'], ['z', 'float'], ['w', 'float']], [['value', 'vec4']], 'Combines four numbers.'),
  define('compose-rgba', 'Compose RGBA', 'Channel', [['rgb', 'vec3'], ['alpha', 'float']], [['rgba', 'vec4']], 'Combines RGB and alpha for Filter output.'),
];

export const filterMathNodeTypes = definitions.map((definition) => definition.type);
export const filterMathNodes: Record<string, NodeDefinition> = Object.fromEntries(definitions.map((definition) => [definition.type, definition]));
