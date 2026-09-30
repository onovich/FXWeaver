import type { GraphIssue } from './diagnostics';
import { getNodeDefinition } from './registry';
import type { GraphDocument, GraphPortRef } from './schema';

export interface ConnectionCheckOptions {
  /** Used only when an edit replaces an edge as one atomic command. */
  ignoreEdgeIds?: readonly string[];
}

/** Returns the first structural issue for a proposed output-to-input connection. */
export function checkConnection(
  graph: GraphDocument,
  from: GraphPortRef,
  to: GraphPortRef,
  options: ConnectionCheckOptions = {},
): GraphIssue | null {
  const sourceNode = graph.nodes.find((node) => node.id === from.nodeId);
  if (!sourceNode) return { code: 'MISSING_NODE', message: `Source node ${from.nodeId} does not exist.`, nodeId: from.nodeId };
  const targetNode = graph.nodes.find((node) => node.id === to.nodeId);
  if (!targetNode) return { code: 'MISSING_NODE', message: `Target node ${to.nodeId} does not exist.`, nodeId: to.nodeId };

  const sourceDefinition = getNodeDefinition(graph.graphKind, sourceNode.type);
  const targetDefinition = getNodeDefinition(graph.graphKind, targetNode.type);
  if (!sourceDefinition) return { code: 'UNKNOWN_NODE_TYPE', message: `Unknown source type ${sourceNode.type}.`, nodeId: sourceNode.id };
  if (!targetDefinition) return { code: 'UNKNOWN_NODE_TYPE', message: `Unknown target type ${targetNode.type}.`, nodeId: targetNode.id };

  const output = sourceDefinition.outputs.find((port) => port.id === from.portId);
  if (!output) {
    const wrongDirection = sourceDefinition.inputs.some((port) => port.id === from.portId);
    return {
      code: wrongDirection ? 'WRONG_DIRECTION' : 'MISSING_PORT',
      message: wrongDirection ? `${from.portId} is an input, not an output.` : `Output ${from.portId} does not exist.`,
      nodeId: from.nodeId, portId: from.portId,
    };
  }
  const input = targetDefinition.inputs.find((port) => port.id === to.portId);
  if (!input) {
    const wrongDirection = targetDefinition.outputs.some((port) => port.id === to.portId);
    return {
      code: wrongDirection ? 'WRONG_DIRECTION' : 'MISSING_PORT',
      message: wrongDirection ? `${to.portId} is an output, not an input.` : `Input ${to.portId} does not exist.`,
      nodeId: to.nodeId, portId: to.portId,
    };
  }

  if (output.type !== input.type) {
    return {
      code: 'TYPE_MISMATCH',
      message: `${output.type} cannot connect to ${input.type}; add an explicit conversion node.`,
      nodeId: to.nodeId, portId: to.portId,
    };
  }

  const ignored = new Set(options.ignoreEdgeIds ?? []);
  if (graph.edges.some((edge) => !ignored.has(edge.id) && edge.to.nodeId === to.nodeId && edge.to.portId === to.portId)) {
    return { code: 'INPUT_OCCUPIED', message: `Input ${input.label} already has a connection.`, nodeId: to.nodeId, portId: to.portId };
  }

  if (createsCycle(graph, from.nodeId, to.nodeId, ignored)) {
    return { code: 'CYCLE', message: 'This connection would create a cycle.', nodeId: to.nodeId, portId: to.portId };
  }

  return null;
}

function createsCycle(graph: GraphDocument, sourceId: string, targetId: string, ignored: Set<string>): boolean {
  if (sourceId === targetId) return true;
  const visited = new Set<string>();
  const pending = [targetId];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of graph.edges) {
      if (!ignored.has(edge.id) && edge.from.nodeId === current) pending.push(edge.to.nodeId);
    }
  }
  return false;
}
