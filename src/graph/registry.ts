import type { JsonValue, ValueType } from './schema';

export interface PortDefinition {
  id: string;
  label: string;
  type: ValueType;
  required?: boolean;
}

export interface PropertyDefinition {
  id: string;
  label: string;
  type: ValueType;
  defaultValue: JsonValue;
  min?: number;
  max?: number;
  step?: number;
}

export interface NodeDefinition {
  type: string;
  version: number;
  label: string;
  category: string;
  description: string;
  inputs: readonly PortDefinition[];
  outputs: readonly PortDefinition[];
  properties: readonly PropertyDefinition[];
}

export interface GraphKindDefinition {
  id: string;
  label: string;
  rootNodeType: string;
  nodeTypes: readonly string[];
  isTestOnly: boolean;
}

/** A graph kind used solely to prove editor and source-graph behavior. */
export const FOUNDATION_GRAPH_KIND = 'foundation.test';
export const FILTER_GRAPH_KIND = 'pixi.filter2d';

const nodeDefinitions: Record<string, NodeDefinition> = {
  'filter.output': {
    type: 'filter.output', version: 1, label: 'Filter Output', category: 'Output',
    description: 'Final RGBA for the host content. A source connection will be required before build.',
    inputs: [{ id: 'rgba', label: 'RGBA', type: 'vec4', required: true }], outputs: [], properties: [],
  },
  'filter.source': {
    type: 'filter.source', version: 1, label: 'Source RGBA', category: 'Input',
    description: 'The host content already drawn into the Filter input, sampled at this fragment UV.',
    inputs: [], outputs: [{ id: 'rgba', label: 'RGBA', type: 'vec4' }], properties: [],
  },
  'filter.uv': {
    type: 'filter.uv', version: 1, label: 'Filter UV', category: 'Input',
    description: 'Normalized coordinates of the Filter input frame, not the Sprite atlas UV.',
    inputs: [], outputs: [{ id: 'uv', label: 'UV', type: 'vec2' }], properties: [],
  },
  'filter.time': {
    type: 'filter.time', version: 1, label: 'Time', category: 'Input',
    description: 'Preview time in seconds; pausing the preview freezes this value.',
    inputs: [], outputs: [{ id: 'seconds', label: 'Seconds', type: 'float' }], properties: [],
  },
  'filter.float': {
    type: 'filter.float', version: 1, label: 'Number', category: 'Value',
    description: 'Editable scalar; expose it as a stable runtime parameter when needed.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'float' }],
    properties: [{ id: 'value', label: 'Value', type: 'float', defaultValue: 0, min: -10000, max: 10000, step: 0.01 }],
  },
  'filter.vec2': {
    type: 'filter.vec2', version: 1, label: 'Vector 2', category: 'Value',
    description: 'Editable pair of coordinates or values.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'vec2' }],
    properties: [{ id: 'value', label: 'Value', type: 'vec2', defaultValue: [0, 0] }],
  },
  'filter.vec3': {
    type: 'filter.vec3', version: 1, label: 'Vector 3', category: 'Value',
    description: 'Editable three-component value.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'vec3' }],
    properties: [{ id: 'value', label: 'Value', type: 'vec3', defaultValue: [0, 0, 0] }],
  },
  'filter.vec4': {
    type: 'filter.vec4', version: 1, label: 'Vector 4', category: 'Value',
    description: 'Editable four-component RGBA or vector value.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'vec4' }],
    properties: [{ id: 'value', label: 'Value', type: 'vec4', defaultValue: [0, 0, 0, 1] }],
  },
  'filter.color': {
    type: 'filter.color', version: 1, label: 'Color', category: 'Value',
    description: 'Editable hexadecimal color with optional alpha. Convert explicitly before RGBA math.',
    inputs: [], outputs: [{ id: 'color', label: 'Color', type: 'color' }],
    properties: [{ id: 'value', label: 'Color', type: 'color', defaultValue: '#ffffffff' }],
  },
  'filter.color-rgba': {
    type: 'filter.color-rgba', version: 1, label: 'Color to RGBA', category: 'Convert',
    description: 'Explicitly converts a color value to four normalized RGBA components.',
    inputs: [{ id: 'color', label: 'Color', type: 'color', required: true }],
    outputs: [{ id: 'rgba', label: 'RGBA', type: 'vec4' }], properties: [],
  },
  'foundation.output': {
    type: 'foundation.output', version: 1, label: 'Test Output', category: 'Output',
    description: 'Completes a test graph. It has no Shader meaning.',
    inputs: [{ id: 'value', label: 'Value', type: 'float', required: true }], outputs: [], properties: [],
  },
  'foundation.number': {
    type: 'foundation.number', version: 1, label: 'Number', category: 'Input',
    description: 'An editable scalar for testing graph operations.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'float' }],
    properties: [{ id: 'value', label: 'Value', type: 'float', defaultValue: 0, min: -100, max: 100, step: 0.1 }],
  },
  'foundation.add': {
    type: 'foundation.add', version: 1, label: 'Add', category: 'Math',
    description: 'A two-input test node for validating required ports.',
    inputs: [
      { id: 'a', label: 'A', type: 'float', required: true },
      { id: 'b', label: 'B', type: 'float', required: true },
    ],
    outputs: [{ id: 'value', label: 'Value', type: 'float' }], properties: [],
  },
  'foundation.pass': {
    type: 'foundation.pass', version: 1, label: 'Pass', category: 'Math',
    description: 'A test node that can expose cycles during connection checks.',
    inputs: [{ id: 'in', label: 'In', type: 'float', required: true }],
    outputs: [{ id: 'out', label: 'Out', type: 'float' }], properties: [],
  },
  'foundation.vector2': {
    type: 'foundation.vector2', version: 1, label: 'Vector 2', category: 'Input',
    description: 'A different output type for type-mismatch tests.',
    inputs: [], outputs: [{ id: 'value', label: 'Value', type: 'vec2' }],
    properties: [{ id: 'value', label: 'Value', type: 'vec2', defaultValue: [0, 0] }],
  },
};

const graphKinds: Record<string, GraphKindDefinition> = {
  [FILTER_GRAPH_KIND]: {
    id: FILTER_GRAPH_KIND,
    label: 'PixiJS 2D Filter',
    rootNodeType: 'filter.output',
    nodeTypes: ['filter.output', 'filter.source', 'filter.uv', 'filter.time', 'filter.float',
      'filter.vec2', 'filter.vec3', 'filter.vec4', 'filter.color', 'filter.color-rgba'],
    isTestOnly: false,
  },
  [FOUNDATION_GRAPH_KIND]: {
    id: FOUNDATION_GRAPH_KIND,
    label: 'Foundation test graph',
    rootNodeType: 'foundation.output',
    nodeTypes: ['foundation.output', 'foundation.number', 'foundation.add', 'foundation.pass', 'foundation.vector2'],
    isTestOnly: true,
  },
};

export function getGraphKind(id: string): GraphKindDefinition | undefined {
  return graphKinds[id];
}

export function getNodeDefinition(graphKind: string, type: string): NodeDefinition | undefined {
  const kind = getGraphKind(graphKind);
  return kind?.nodeTypes.includes(type) ? nodeDefinitions[type] : undefined;
}

export function listNodeDefinitions(graphKind: string): NodeDefinition[] {
  return getGraphKind(graphKind)?.nodeTypes.map((type) => nodeDefinitions[type]).filter((item) => item !== undefined) ?? [];
}

/** Registry authoring errors are checked in tests; graph validation is separate. */
export function registryIssues(): string[] {
  const issues: string[] = [];
  for (const kind of Object.values(graphKinds)) {
    if (!kind.nodeTypes.includes(kind.rootNodeType)) issues.push(`${kind.id}: root is not allowed`);
    for (const type of kind.nodeTypes) {
      if (!nodeDefinitions[type]) issues.push(`${kind.id}: missing node ${type}`);
    }
  }
  for (const definition of Object.values(nodeDefinitions)) {
    const portIds = [...definition.inputs, ...definition.outputs].map((port) => port.id);
    if (new Set(portIds).size !== portIds.length) issues.push(`${definition.type}: duplicate port ID`);
    const propertyIds = definition.properties.map((property) => property.id);
    if (new Set(propertyIds).size !== propertyIds.length) issues.push(`${definition.type}: duplicate property ID`);
  }
  return issues;
}
