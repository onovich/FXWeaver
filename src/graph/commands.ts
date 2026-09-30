import { checkConnection } from './connections';
import type { GraphIssue } from './diagnostics';
import { getGraphKind, getNodeDefinition } from './registry';
import { createEmptyGraph, createEmptyLayout, type GraphDocument, type GraphLayout, type GraphPortRef, type JsonValue } from './schema';
import { isValueOfType } from './values';

export interface EditorDocument {
  graph: GraphDocument;
  layout: GraphLayout;
}

export type GraphCommand =
  | { type: 'add-node'; nodeId: string; nodeType: string; position: { x: number; y: number } }
  | { type: 'delete-nodes'; nodeIds: string[] }
  | { type: 'move-nodes'; positions: Record<string, { x: number; y: number }> }
  | { type: 'connect'; edgeId: string; from: GraphPortRef; to: GraphPortRef }
  | { type: 'disconnect'; edgeId: string }
  | { type: 'set-property'; nodeId: string; propertyId: string; value: JsonValue };

export type CommandResult = { ok: true; document: EditorDocument } | { ok: false; document: EditorDocument; issue: GraphIssue };

export function createEditorDocument(graphKind: string): EditorDocument {
  return { graph: createEmptyGraph(graphKind), layout: createEmptyLayout() };
}

function reject(document: EditorDocument, message: string, issue: Partial<GraphIssue> = {}): CommandResult {
  return { ok: false, document, issue: { code: 'COMMAND_REJECTED', message, ...issue } };
}

function validPosition(position: { x: number; y: number }): boolean {
  return Number.isFinite(position.x) && Number.isFinite(position.y);
}

/** Every edit returns a new document or the untouched original plus a reason. */
export function applyCommand(document: EditorDocument, command: GraphCommand): CommandResult {
  const { graph, layout } = document;
  switch (command.type) {
    case 'add-node': {
      const definition = getNodeDefinition(graph.graphKind, command.nodeType);
      if (!definition) return reject(document, `Node type ${command.nodeType} is unavailable in this graph.`, { code: 'UNKNOWN_NODE_TYPE' });
      if (graph.nodes.some((node) => node.id === command.nodeId)) return reject(document, `Node ID ${command.nodeId} is already in use.`, { code: 'ID_CONFLICT', nodeId: command.nodeId });
      if (!validPosition(command.position)) return reject(document, 'Node position must be finite.');
      if (getGraphKind(graph.graphKind)?.rootNodeType === command.nodeType && graph.nodes.some((node) => node.type === command.nodeType)) {
        return reject(document, 'The graph already has its output root.', { code: 'MULTIPLE_ROOTS' });
      }
      const values = Object.fromEntries(definition.properties.map((property) => [property.id, structuredClone(property.defaultValue)]));
      return {
        ok: true,
        document: {
          graph: { ...graph, nodes: [...graph.nodes, { id: command.nodeId, type: command.nodeType, definitionVersion: definition.version, values }] },
          layout: { ...layout, nodePositions: { ...layout.nodePositions, [command.nodeId]: { ...command.position } } },
        },
      };
    }
    case 'delete-nodes': {
      const ids = new Set(command.nodeIds);
      if (ids.size === 0) return reject(document, 'Choose a node to delete.');
      if ([...ids].some((id) => !graph.nodes.some((node) => node.id === id))) return reject(document, 'One or more selected nodes no longer exist.');
      const rootType = getGraphKind(graph.graphKind)?.rootNodeType;
      if (graph.nodes.some((node) => ids.has(node.id) && node.type === rootType)) return reject(document, 'The output root cannot be deleted.');
      const nodePositions = Object.fromEntries(Object.entries(layout.nodePositions).filter(([id]) => !ids.has(id)));
      return {
        ok: true,
        document: {
          graph: {
            ...graph,
            nodes: graph.nodes.filter((node) => !ids.has(node.id)),
            edges: graph.edges.filter((edge) => !ids.has(edge.from.nodeId) && !ids.has(edge.to.nodeId)),
            parameters: graph.parameters.filter((parameter) => !ids.has(parameter.sourceNodeId)),
          },
          layout: { ...layout, nodePositions, selectedNodeIds: layout.selectedNodeIds.filter((id) => !ids.has(id)) },
        },
      };
    }
    case 'move-nodes': {
      for (const [id, position] of Object.entries(command.positions)) {
        if (!graph.nodes.some((node) => node.id === id) || !validPosition(position)) return reject(document, `Cannot move node ${id}.`, { nodeId: id });
      }
      return { ok: true, document: { ...document, layout: { ...layout, nodePositions: { ...layout.nodePositions, ...structuredClone(command.positions) } } } };
    }
    case 'connect': {
      if (graph.edges.some((edge) => edge.id === command.edgeId)) return reject(document, `Edge ID ${command.edgeId} is already in use.`, { code: 'ID_CONFLICT', edgeId: command.edgeId });
      const issue = checkConnection(graph, command.from, command.to);
      if (issue) return { ok: false, document, issue };
      return { ok: true, document: { ...document, graph: { ...graph, edges: [...graph.edges, { id: command.edgeId, from: { ...command.from }, to: { ...command.to } }] } } };
    }
    case 'disconnect': {
      if (!graph.edges.some((edge) => edge.id === command.edgeId)) return reject(document, `Edge ${command.edgeId} does not exist.`, { edgeId: command.edgeId });
      return { ok: true, document: { ...document, graph: { ...graph, edges: graph.edges.filter((edge) => edge.id !== command.edgeId) } } };
    }
    case 'set-property': {
      const node = graph.nodes.find((item) => item.id === command.nodeId);
      if (!node) return reject(document, `Node ${command.nodeId} does not exist.`, { code: 'MISSING_NODE', nodeId: command.nodeId });
      const property = getNodeDefinition(graph.graphKind, node.type)?.properties.find((item) => item.id === command.propertyId);
      if (!property) return reject(document, `Property ${command.propertyId} does not exist.`, { code: 'INVALID_PROPERTY', nodeId: command.nodeId, portId: command.propertyId });
      const value = command.value;
      if (!isValueOfType(value, property.type) ||
        (typeof value === 'number' && ((property.min !== undefined && value < property.min) || (property.max !== undefined && value > property.max)))) {
        return reject(document, `${property.label} needs a valid ${property.type} value.`, { code: 'INVALID_PROPERTY', nodeId: command.nodeId, portId: command.propertyId });
      }
      return {
        ok: true,
        document: { ...document, graph: { ...graph, nodes: graph.nodes.map((item) => item.id === node.id ? { ...item, values: { ...item.values, [property.id]: structuredClone(value) } } : item) } },
      };
    }
  }
}
