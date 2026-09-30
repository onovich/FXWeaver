import { checkConnection } from './connections';
import type { GraphIssue } from './diagnostics';
import { getGraphKind, getNodeDefinition } from './registry';
import { GRAPH_SCHEMA_VERSION, type GraphDocument } from './schema';
import { isValueOfType } from './values';

/** Diagnoses a source graph without changing it. Incomplete graphs remain saveable. */
export function validateGraph(graph: GraphDocument): GraphIssue[] {
  const issues: GraphIssue[] = [];
  if (graph.schemaVersion !== GRAPH_SCHEMA_VERSION) {
    issues.push({ code: 'UNSUPPORTED_SCHEMA_VERSION', message: `Graph schema ${graph.schemaVersion} is not supported.` });
    return issues;
  }
  const kind = getGraphKind(graph.graphKind);
  if (!kind) {
    issues.push({ code: 'UNKNOWN_GRAPH_KIND', message: `Graph kind ${graph.graphKind} is not supported.` });
    return issues;
  }

  const seenNodes = new Set<string>();
  for (const node of graph.nodes) {
    if (seenNodes.has(node.id)) issues.push({ code: 'DUPLICATE_NODE_ID', message: `Node ID ${node.id} is duplicated.`, nodeId: node.id });
    seenNodes.add(node.id);
    const definition = getNodeDefinition(graph.graphKind, node.type);
    if (!definition) {
      issues.push({ code: 'UNKNOWN_NODE_TYPE', message: `Node type ${node.type} is not supported.`, nodeId: node.id });
      continue;
    }
    if (node.definitionVersion !== definition.version) {
      issues.push({ code: 'UNSUPPORTED_DEFINITION_VERSION', message: `${definition.label} version ${node.definitionVersion} is not supported.`, nodeId: node.id });
    }
    for (const property of definition.properties) {
      const value = node.values[property.id];
      if (value === undefined || !isValueOfType(value, property.type) ||
        (typeof value === 'number' && ((property.min !== undefined && value < property.min) || (property.max !== undefined && value > property.max)))) {
        issues.push({ code: 'INVALID_PROPERTY', message: `${definition.label}: ${property.label} has an invalid value.`, nodeId: node.id, portId: property.id });
      }
    }
    for (const key of Object.keys(node.values)) {
      if (!definition.properties.some((property) => property.id === key)) {
        issues.push({ code: 'INVALID_PROPERTY', message: `${definition.label}: unknown property ${key}.`, nodeId: node.id, portId: key });
      }
    }
  }

  const roots = graph.nodes.filter((node) => node.type === kind.rootNodeType);
  if (roots.length === 0) issues.push({ code: 'MISSING_ROOT', message: 'The graph needs one output root.' });
  if (roots.length > 1) issues.push({ code: 'MULTIPLE_ROOTS', message: 'The graph has more than one output root.', nodeId: roots[1].id });

  const seenEdges = new Set<string>();
  const validEdges = new Set<string>();
  for (const edge of graph.edges) {
    if (seenEdges.has(edge.id)) issues.push({ code: 'DUPLICATE_EDGE_ID', message: `Edge ID ${edge.id} is duplicated.`, edgeId: edge.id });
    seenEdges.add(edge.id);
    const issue = checkConnection(graph, edge.from, edge.to, { ignoreEdgeIds: [edge.id] });
    if (issue) issues.push({ ...issue, edgeId: edge.id });
    else validEdges.add(edge.id);
  }

  for (const node of graph.nodes) {
    const definition = getNodeDefinition(graph.graphKind, node.type);
    if (!definition) continue;
    for (const input of definition.inputs.filter((port) => port.required)) {
      if (!graph.edges.some((edge) => validEdges.has(edge.id) && edge.to.nodeId === node.id && edge.to.portId === input.id)) {
        issues.push({ code: 'MISSING_REQUIRED_INPUT', message: `${definition.label}: ${input.label} needs a connection.`, nodeId: node.id, portId: input.id });
      }
    }
  }

  const seenParameters = new Set<string>();
  const seenParameterBindings = new Set<string>();
  for (const parameter of graph.parameters) {
    if (seenParameters.has(parameter.id)) issues.push({ code: 'DUPLICATE_PARAMETER_ID', message: `Parameter ID ${parameter.id} is duplicated.`, nodeId: parameter.sourceNodeId });
    seenParameters.add(parameter.id);
    const binding = `${parameter.sourceNodeId}\0${parameter.sourceKey}`;
    if (seenParameterBindings.has(binding)) issues.push({ code: 'DUPLICATE_PARAMETER_BINDING', message: `Property ${parameter.sourceKey} is exposed more than once.`, nodeId: parameter.sourceNodeId, portId: parameter.sourceKey });
    seenParameterBindings.add(binding);
    const node = graph.nodes.find((item) => item.id === parameter.sourceNodeId);
    const property = node && getNodeDefinition(graph.graphKind, node.type)?.properties.find((item) => item.id === parameter.sourceKey);
    if (!property || property.type === 'texture' || property.type !== parameter.valueType || !isValueOfType(parameter.defaultValue, parameter.valueType) ||
      JSON.stringify(node?.values[parameter.sourceKey]) !== JSON.stringify(parameter.defaultValue) ||
      (parameter.min !== undefined && parameter.max !== undefined && parameter.min >= parameter.max) ||
      (typeof parameter.defaultValue === 'number' &&
        (parameter.min !== undefined && parameter.defaultValue < parameter.min || parameter.max !== undefined && parameter.defaultValue > parameter.max))) {
      issues.push({ code: 'INVALID_PARAMETER', message: `Parameter ${parameter.name} is not bound to a compatible property.`, nodeId: parameter.sourceNodeId, portId: parameter.sourceKey });
    }
  }

  return issues;
}
