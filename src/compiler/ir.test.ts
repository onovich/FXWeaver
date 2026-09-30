import { describe, expect, it } from 'vitest';
import { applyCommand, type EditorDocument } from '../graph/commands';
import { createProject } from '../graph/project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from '../graph/registry';
import { canonicalIrJson, lowerFilterGraph } from './ir';

function add(document: EditorDocument, id: string, nodeType: string): EditorDocument {
  const result = applyCommand(document, { type: 'add-node', nodeId: id, nodeType, position: { x: 0, y: 0 } });
  if (!result.ok) throw new Error(result.issue.message);
  return result.document;
}

function connect(document: EditorDocument, id: string, fromNode: string, fromPort: string, toNode: string, toPort: string): EditorDocument {
  const result = applyCommand(document, { type: 'connect', edgeId: id, from: { nodeId: fromNode, portId: fromPort }, to: { nodeId: toNode, portId: toPort } });
  if (!result.ok) throw new Error(result.issue.message);
  return result.document;
}

describe('typed Filter IR', () => {
  it('sorts a branching graph topologically with stable bytes across graph array and layout order', () => {
    const project = createProject('ir', 'IR', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = project;
    document = add(document, 'source', 'filter.source');
    document = add(document, 'color', 'filter.color');
    document = add(document, 'conversion', 'filter.color-rgba');
    document = add(document, 'mix', 'filter.mix-vec4');
    document = add(document, 'weight', 'filter.float');
    document = connect(document, 'edge-a', 'source', 'rgba', 'mix', 'a');
    document = connect(document, 'edge-b', 'color', 'color', 'conversion', 'color');
    document = connect(document, 'edge-c', 'conversion', 'rgba', 'mix', 'b');
    document = connect(document, 'edge-d', 'weight', 'value', 'mix', 't');
    document = connect(document, 'edge-e', 'mix', 'value', 'root', 'rgba');
    const first = lowerFilterGraph(document.graph);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const ids = first.ir.nodes.map((node) => node.id);
    expect(ids.indexOf('color')).toBeLessThan(ids.indexOf('conversion'));
    expect(ids.indexOf('conversion')).toBeLessThan(ids.indexOf('mix'));
    expect(ids.indexOf('source')).toBeLessThan(ids.indexOf('mix'));
    expect(ids.indexOf('mix')).toBeLessThan(ids.indexOf('root'));
    expect(first.ir.nodes.find((node) => node.id === 'mix')?.inputs).toMatchObject([
      { portId: 'a', valueType: 'vec4', fromNodeId: 'source' },
      { portId: 'b', valueType: 'vec4', fromNodeId: 'conversion' },
      { portId: 't', valueType: 'float', fromNodeId: 'weight' },
    ]);
    const shuffled = { ...document.graph, nodes: [...document.graph.nodes].reverse(),
      edges: [...document.graph.edges].reverse(), parameters: [...document.graph.parameters].reverse() };
    const second = lowerFilterGraph(shuffled);
    expect(second.ok).toBe(true);
    if (second.ok) expect(canonicalIrJson(second.ir)).toBe(canonicalIrJson(first.ir));
    const moved = { ...document, layout: { ...document.layout, nodePositions: { ...document.layout.nodePositions, color: { x: 900, y: -20 } } } };
    expect(lowerFilterGraph(moved.graph)).toEqual(first);
  });

  it('carries stable parameter and texture IDs without inventing image data', () => {
    const base = createProject('deps', 'Dependencies', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = base;
    document = add(document, 'uv', 'filter.uv');
    document = add(document, 'image', 'filter.sample-image');
    document = add(document, 'amount', 'filter.float');
    document = connect(document, 'sample-uv', 'uv', 'uv', 'image', 'uv');
    document = connect(document, 'sample-output', 'image', 'rgba', 'root', 'rgba');
    const exposed = applyCommand(document, { type: 'expose-parameter', parameterId: 'amount-stable', nodeId: 'amount', propertyId: 'value', name: 'Amount' });
    expect(exposed.ok).toBe(true);
    const result = lowerFilterGraph(exposed.document.graph);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ir.dependencyAssetIds).toEqual(['unbound']);
    expect(result.ir.nodes.find((node) => node.id === 'amount')?.properties).toMatchObject([{ id: 'value', parameterId: 'amount-stable' }]);
  });

  it('rejects test graphs and incomplete or cyclic Filter graphs with source locations', () => {
    const testGraph = createProject('test', 'Test', FOUNDATION_GRAPH_KIND, 'root');
    expect(lowerFilterGraph(testGraph.graph)).toMatchObject({ ok: false, issues: [{ code: 'UNSUPPORTED_BUILD_GRAPH_KIND' }] });
    const filter = createProject('filter', 'Filter', FILTER_GRAPH_KIND, 'root');
    expect(lowerFilterGraph(filter.graph)).toMatchObject({ ok: false, issues: [{ code: 'MISSING_REQUIRED_INPUT', nodeId: 'root', portId: 'rgba' }] });
    let document: EditorDocument = filter;
    document = add(document, 'a', 'filter.add-float');
    document = add(document, 'b', 'filter.add-float');
    const cycle = { ...document.graph, edges: [
      { id: 'ab', from: { nodeId: 'a', portId: 'value' }, to: { nodeId: 'b', portId: 'a' } },
      { id: 'ba', from: { nodeId: 'b', portId: 'value' }, to: { nodeId: 'a', portId: 'a' } },
    ] };
    const result = lowerFilterGraph(cycle);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CYCLE', nodeId: expect.any(String) })]));
  });
});
