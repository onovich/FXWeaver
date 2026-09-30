/** Source graph data. None of these fields contain canvas presentation state. */
export const GRAPH_SCHEMA_VERSION = 1 as const;

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ValueType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'texture';

export interface GraphNode {
  id: string;
  type: string;
  definitionVersion: number;
  values: Record<string, JsonValue>;
}

export interface GraphPortRef {
  nodeId: string;
  portId: string;
}

export interface GraphEdge {
  id: string;
  from: GraphPortRef;
  to: GraphPortRef;
}

export interface GraphParameter {
  id: string;
  name: string;
  valueType: ValueType;
  sourceNodeId: string;
  sourceKey: string;
  defaultValue: JsonValue;
  min?: number;
  max?: number;
}

export interface GraphDocument {
  schemaVersion: typeof GRAPH_SCHEMA_VERSION;
  graphKind: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  parameters: GraphParameter[];
}

/** Presentation state is saved with a project but excluded from graph semantics. */
export interface GraphLayout {
  nodePositions: Record<string, { x: number; y: number }>;
  viewport: { x: number; y: number; zoom: number };
  selectedNodeIds: string[];
}

export function createEmptyGraph(graphKind: string): GraphDocument {
  return { schemaVersion: GRAPH_SCHEMA_VERSION, graphKind, nodes: [], edges: [], parameters: [] };
}

export function createEmptyLayout(): GraphLayout {
  return { nodePositions: {}, viewport: { x: 0, y: 0, zoom: 1 }, selectedNodeIds: [] };
}

export function canonicalJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJsonValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => compareIds(a, b)).map(([key, item]) => [key, canonicalJsonValue(item)]),
    );
  }
  return value;
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Stable representation of the authored semantics, independent of array and object-key order. */
export function semanticGraphJson(graph: GraphDocument): string {
  return JSON.stringify(canonicalJsonValue({
    schemaVersion: graph.schemaVersion,
    graphKind: graph.graphKind,
    nodes: [...graph.nodes].sort((a, b) => compareIds(a.id, b.id)),
    edges: [...graph.edges].sort((a, b) => compareIds(a.id, b.id)),
    parameters: [...graph.parameters].sort((a, b) => compareIds(a.id, b.id)),
  }));
}

/** Fast change fingerprint, not a cryptographic signature. */
export function graphFingerprint(graph: GraphDocument): string {
  let hash = 0xcbf29ce484222325n;
  for (const codePoint of semanticGraphJson(graph)) {
    hash ^= BigInt(codePoint.codePointAt(0)!);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return `g${graph.schemaVersion}-${hash.toString(16).padStart(16, '0')}`;
}
