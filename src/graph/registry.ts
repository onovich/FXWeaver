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

const nodeDefinitions: Record<string, NodeDefinition> = {
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
  [FOUNDATION_GRAPH_KIND]: {
    id: FOUNDATION_GRAPH_KIND,
    label: 'Foundation test graph',
    rootNodeType: 'foundation.output',
    nodeTypes: Object.keys(nodeDefinitions),
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
