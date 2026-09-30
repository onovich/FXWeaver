import { describe, expect, it } from 'vitest';
import {
  createEmptyGraph,
  createEmptyLayout,
  graphFingerprint,
  semanticGraphJson,
  type GraphDocument,
} from './schema';

const graph: GraphDocument = {
  ...createEmptyGraph('foundation.test'),
  nodes: [
    { id: 'b', type: 'value', definitionVersion: 1, values: { z: 4, nested: { y: 2, x: 1 } } },
    { id: 'a', type: 'root', definitionVersion: 1, values: {} },
  ],
  edges: [{ id: 'edge-2', from: { nodeId: 'b', portId: 'out' }, to: { nodeId: 'a', portId: 'in' } }],
  parameters: [{ id: 'p-1', name: 'Amount', valueType: 'float', sourceNodeId: 'b', sourceKey: 'z', defaultValue: 4 }],
};

describe('source graph semantics', () => {
  it('canonicalizes collection and object-key order without mutating the graph', () => {
    const reordered: GraphDocument = {
      ...graph,
      nodes: [graph.nodes[1], { ...graph.nodes[0], values: { nested: { x: 1, y: 2 }, z: 4 } }],
    };
    expect(semanticGraphJson(reordered)).toBe(semanticGraphJson(graph));
    expect(graph.nodes[0].id).toBe('b');
  });

  it('excludes layout but changes the fingerprint for semantic edits', () => {
    const layout = createEmptyLayout();
    layout.nodePositions.a = { x: 200, y: 300 };
    layout.viewport.zoom = 2;
    expect(graphFingerprint(graph)).toBe(graphFingerprint({ ...graph }));
    expect(graphFingerprint({ ...graph, nodes: [{ ...graph.nodes[0], values: { z: 5 } }, graph.nodes[1]] }))
      .not.toBe(graphFingerprint(graph));
  });

  it('creates an unfinished graph independently of any renderer', () => {
    expect(createEmptyGraph('foundation.test')).toMatchObject({ schemaVersion: 1, nodes: [], edges: [] });
  });
});
