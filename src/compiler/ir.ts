import type { GraphIssue } from '../graph/diagnostics';
import { FILTER_GRAPH_KIND, getNodeDefinition } from '../graph/registry';
import { canonicalJsonValue, type GraphDocument, type JsonValue, type ValueType } from '../graph/schema';
import { validateGraph } from '../graph/validation';

export const FILTER_IR_VERSION = 1 as const;

export interface IrInput {
  portId: string;
  valueType: ValueType;
  fromNodeId: string;
  fromPortId: string;
}

export interface IrOutput {
  portId: string;
  valueType: ValueType;
}

export interface IrProperty {
  id: string;
  valueType: ValueType;
  value: JsonValue;
  parameterId?: string;
}

export interface IrNode {
  id: string;
  type: string;
  definitionVersion: number;
  inputs: IrInput[];
  outputs: IrOutput[];
  properties: IrProperty[];
}

export interface FilterIR {
  irVersion: typeof FILTER_IR_VERSION;
  graphSchemaVersion: number;
  graphKind: typeof FILTER_GRAPH_KIND;
  rootNodeId: string;
  nodes: IrNode[];
  dependencyAssetIds: string[];
}

export type IrResult = { ok: true; ir: FilterIR } | { ok: false; issues: GraphIssue[] };

function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

function topologicalIds(graph: GraphDocument): string[] {
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of graph.edges) {
    incoming.set(edge.to.nodeId, incoming.get(edge.to.nodeId)! + 1);
    outgoing.get(edge.from.nodeId)!.push(edge.to.nodeId);
  }
  const ready = [...incoming].filter(([, count]) => count === 0).map(([id]) => id).sort(compare);
  const ordered: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift()!;
    ordered.push(id);
    for (const target of outgoing.get(id)!.sort(compare)) {
      const count = incoming.get(target)! - 1;
      incoming.set(target, count);
      if (count === 0) { ready.push(target); ready.sort(compare); }
    }
  }
  return ordered;
}

/** Validate first, then lower the authored graph to a stable, typed operation order. */
export function lowerFilterGraph(graph: GraphDocument): IrResult {
  if (graph.graphKind !== FILTER_GRAPH_KIND) {
    return { ok: false, issues: [{ code: 'UNSUPPORTED_BUILD_GRAPH_KIND', message: `Graph kind ${graph.graphKind} cannot generate a PixiJS Filter.` }] };
  }
  const issues = validateGraph(graph);
  if (issues.length > 0) {
    return { ok: false, issues: [...issues].sort((a, b) => compare(`${a.nodeId ?? ''}\0${a.portId ?? ''}\0${a.code}\0${a.edgeId ?? ''}`, `${b.nodeId ?? ''}\0${b.portId ?? ''}\0${b.code}\0${b.edgeId ?? ''}`)) };
  }

  const order = topologicalIds(graph);
  if (order.length !== graph.nodes.length) {
    return { ok: false, issues: [{ code: 'CYCLE', message: 'The graph contains a cycle and cannot be lowered.' }] };
  }
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const dependencies = new Set<string>();
  const nodes = order.map((id): IrNode => {
    const node = byId.get(id)!;
    const definition = getNodeDefinition(graph.graphKind, node.type)!;
    const inputs = definition.inputs.flatMap((port): IrInput[] => {
      const edge = graph.edges.find((item) => item.to.nodeId === id && item.to.portId === port.id);
      return edge ? [{ portId: port.id, valueType: port.type, fromNodeId: edge.from.nodeId, fromPortId: edge.from.portId }] : [];
    }).sort((a, b) => compare(a.portId, b.portId));
    const outputs = definition.outputs.map((port): IrOutput => ({ portId: port.id, valueType: port.type }))
      .sort((a, b) => compare(a.portId, b.portId));
    const properties = definition.properties.map((property): IrProperty => {
      const value = canonicalJsonValue(node.values[property.id]) as JsonValue;
      if (property.type === 'texture') dependencies.add(value as string);
      const parameter = graph.parameters.find((item) => item.sourceNodeId === id && item.sourceKey === property.id);
      return { id: property.id, valueType: property.type, value, ...(parameter ? { parameterId: parameter.id } : {}) };
    }).sort((a, b) => compare(a.id, b.id));
    return { id, type: node.type, definitionVersion: node.definitionVersion, inputs, outputs, properties };
  });
  return { ok: true, ir: { irVersion: FILTER_IR_VERSION, graphSchemaVersion: graph.schemaVersion,
    graphKind: FILTER_GRAPH_KIND, rootNodeId: graph.nodes.find((node) => node.type === 'filter.output')!.id,
    nodes, dependencyAssetIds: [...dependencies].sort(compare) } };
}

export function canonicalIrJson(ir: FilterIR): string {
  return JSON.stringify(canonicalJsonValue(ir));
}
