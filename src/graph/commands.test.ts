import { describe, expect, it } from 'vitest';
import { applyCommand, createEditorDocument, type EditorDocument, type GraphCommand } from './commands';
import { FOUNDATION_GRAPH_KIND } from './registry';
import { graphFingerprint } from './schema';

function execute(document: EditorDocument, command: GraphCommand): EditorDocument {
  const result = applyCommand(document, command);
  expect(result.ok).toBe(true);
  return result.document;
}

describe('immutable graph commands', () => {
  it('adds, moves, connects, disconnects, and deletes without changing prior state', () => {
    const empty = createEditorDocument(FOUNDATION_GRAPH_KIND);
    const withRoot = execute(empty, { type: 'add-node', nodeId: 'root', nodeType: 'foundation.output', position: { x: 400, y: 0 } });
    const withNumber = execute(withRoot, { type: 'add-node', nodeId: 'number', nodeType: 'foundation.number', position: { x: 0, y: 0 } });
    const moved = execute(withNumber, { type: 'move-nodes', positions: { number: { x: 80, y: 24 } } });
    expect(graphFingerprint(moved.graph)).toBe(graphFingerprint(withNumber.graph));
    expect(withNumber.layout.nodePositions.number).toEqual({ x: 0, y: 0 });
    const connected = execute(moved, { type: 'connect', edgeId: 'edge', from: { nodeId: 'number', portId: 'value' }, to: { nodeId: 'root', portId: 'value' } });
    expect(empty.graph.nodes).toEqual([]);
    expect(connected.graph.edges).toHaveLength(1);
    const disconnected = execute(connected, { type: 'disconnect', edgeId: 'edge' });
    expect(disconnected.graph.edges).toEqual([]);
    const deleted = execute(connected, { type: 'delete-nodes', nodeIds: ['number'] });
    expect(deleted.graph.nodes.map((node) => node.id)).toEqual(['root']);
    expect(deleted.graph.edges).toEqual([]);
    expect(deleted.layout.nodePositions.number).toBeUndefined();
    expect(connected.graph.nodes).toHaveLength(2);
  });

  it('rejects invalid operations without modifying the document', () => {
    const empty = createEditorDocument(FOUNDATION_GRAPH_KIND);
    const root = execute(empty, { type: 'add-node', nodeId: 'root', nodeType: 'foundation.output', position: { x: 0, y: 0 } });
    for (const command of [
      { type: 'add-node', nodeId: 'other', nodeType: 'foundation.output', position: { x: 0, y: 0 } },
      { type: 'delete-nodes', nodeIds: ['root'] },
      { type: 'disconnect', edgeId: 'missing' },
      { type: 'move-nodes', positions: { root: { x: Infinity, y: 0 } } },
    ] as GraphCommand[]) {
      const result = applyCommand(root, command);
      expect(result.ok).toBe(false);
      expect(result.document).toBe(root);
      if (!result.ok) expect(result.issue.message.length).toBeGreaterThan(0);
    }
  });

  it('validates property edits and leaves previous values intact', () => {
    const number = execute(createEditorDocument(FOUNDATION_GRAPH_KIND), { type: 'add-node', nodeId: 'number', nodeType: 'foundation.number', position: { x: 0, y: 0 } });
    const edited = execute(number, { type: 'set-property', nodeId: 'number', propertyId: 'value', value: 3.5 });
    expect(number.graph.nodes[0].values.value).toBe(0);
    expect(edited.graph.nodes[0].values.value).toBe(3.5);
    const rejected = applyCommand(edited, { type: 'set-property', nodeId: 'number', propertyId: 'value', value: 999 });
    expect(rejected.ok).toBe(false);
    expect(rejected.document).toBe(edited);
  });

  it('keeps an exposed parameter and its node property synchronized', () => {
    const number = execute(createEditorDocument(FOUNDATION_GRAPH_KIND), { type: 'add-node', nodeId: 'number', nodeType: 'foundation.number', position: { x: 0, y: 0 } });
    const exposed = execute(number, { type: 'expose-parameter', parameterId: 'p', nodeId: 'number', propertyId: 'value', name: 'Amount' });
    expect(exposed.graph.parameters[0].defaultValue).toBe(0);
    const edited = execute(exposed, { type: 'set-property', nodeId: 'number', propertyId: 'value', value: 4.5 });
    expect(edited.graph.nodes[0].values.value).toBe(4.5);
    expect(edited.graph.parameters[0].defaultValue).toBe(4.5);
    expect(exposed.graph.parameters[0].defaultValue).toBe(0);
    const renamed = execute(edited, { type: 'rename-parameter', parameterId: 'p', name: 'Intensity' });
    expect(renamed.graph.parameters[0]).toMatchObject({ id: 'p', name: 'Intensity', defaultValue: 4.5 });
    const removed = execute(renamed, { type: 'remove-parameter', parameterId: 'p' });
    expect(removed.graph.parameters).toEqual([]);
    expect(removed.graph.nodes[0].values.value).toBe(4.5);
  });

  it('limits exposed scalar defaults to an editable finite slider range', () => {
    const number = execute(createEditorDocument(FOUNDATION_GRAPH_KIND), { type: 'add-node', nodeId: 'number', nodeType: 'foundation.number', position: { x: 0, y: 0 } });
    const exposed = execute(number, { type: 'expose-parameter', parameterId: 'p', nodeId: 'number', propertyId: 'value', name: 'Amount' });
    const ranged = execute(exposed, { type: 'set-parameter-range', parameterId: 'p', min: -1, max: 1 });
    expect(ranged.graph.parameters[0]).toMatchObject({ min: -1, max: 1 });
    expect(applyCommand(ranged, { type: 'set-property', nodeId: 'number', propertyId: 'value', value: 2 }).ok).toBe(false);
    expect(applyCommand(ranged, { type: 'set-parameter-range', parameterId: 'p', min: 0.5, max: 1 }).ok).toBe(false);
    expect(applyCommand(ranged, { type: 'set-parameter-range', parameterId: 'p', min: 1, max: 1 }).ok).toBe(false);
  });
});
