import { describe, expect, it } from 'vitest';
import { applyCommand, type EditorDocument } from '../graph/commands';
import { createProject } from '../graph/project';
import { FILTER_GRAPH_KIND, listNodeDefinitions } from '../graph/registry';
import { generateFilter, supportsFilterNode } from './generate';
import { lowerFilterGraph } from './ir';

function build(document: EditorDocument) {
  const lowered = lowerFilterGraph(document.graph);
  if (!lowered.ok) throw new Error(JSON.stringify(lowered.issues));
  return generateFilter(lowered.ir);
}

function apply(document: EditorDocument, command: Parameters<typeof applyCommand>[1]): EditorDocument {
  const result = applyCommand(document, command);
  if (!result.ok) throw new Error(result.issue.message);
  return result.document;
}

describe('deterministic Pixi Filter generator', () => {
  it('covers every registered Filter operation with generic generation rules', () => {
    expect(listNodeDefinitions(FILTER_GRAPH_KIND).every((definition) => supportsFilterNode(definition.type))).toBe(true);
  });

  it('emits source sampling and a node-to-line map with stable bytes', () => {
    const base = createProject('source', 'Source', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = apply(base, { type: 'add-node', nodeId: 'source', nodeType: 'filter.source', position: { x: 2, y: 3 } });
    document = apply(document, { type: 'connect', edgeId: 'edge', from: { nodeId: 'source', portId: 'rgba' }, to: { nodeId: 'root', portId: 'rgba' } });
    const first = build(document);
    expect(first.fragmentSource.startsWith('#version 300 es\n')).toBe(true);
    expect(first.fragmentSource).toContain('texture(uTexture, vTextureCoord)');
    expect(first.fragmentSource).toContain('finalColor = ');
    expect(first.nodeSourceRanges.source.firstLine).toBeLessThan(first.nodeSourceRanges.root.firstLine);
    expect(first.textureBindings).toEqual([]);
    expect(first.backend).toBe('pixi.webgl2');
    const reordered = { ...document, graph: { ...document.graph, nodes: [...document.graph.nodes].reverse(), edges: [...document.graph.edges].reverse() },
      layout: { ...document.layout, nodePositions: { root: { x: -100, y: 80 }, source: { x: 900, y: -20 } } } };
    expect(build(reordered)).toEqual(first);
    let changed = apply(document, { type: 'add-node', nodeId: 'constant', nodeType: 'filter.vec4', position: { x: 5, y: 6 } });
    changed = apply(changed, { type: 'connect', edgeId: 'replacement', from: { nodeId: 'constant', portId: 'value' },
      to: { nodeId: 'root', portId: 'rgba' }, replaceExisting: true });
    expect(build(changed).buildId).not.toBe(first.buildId);
    expect(build(changed).fragmentSource).not.toBe(first.fragmentSource);
  });

  it('keeps generated code and build ID when only a runtime parameter default changes', () => {
    const base = createProject('uniform', 'Uniform', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = apply(base, { type: 'add-node', nodeId: 'value', nodeType: 'filter.vec4', position: { x: 0, y: 0 } });
    document = apply(document, { type: 'connect', edgeId: 'edge', from: { nodeId: 'value', portId: 'value' }, to: { nodeId: 'root', portId: 'rgba' } });
    const compiledLiteral = build(document);
    document = apply(document, { type: 'expose-parameter', parameterId: 'stable-id', nodeId: 'value', propertyId: 'value', name: 'Color' });
    const first = build(document);
    expect(first.buildId).not.toBe(compiledLiteral.buildId);
    expect(first.fragmentSource).toContain('uniform vec4 uParam0;');
    expect(first.parameterBindings).toMatchObject([{ id: 'stable-id', uniformName: 'uParam0' }]);
    const changed = apply(document, { type: 'set-property', nodeId: 'value', propertyId: 'value', value: [1, 0.2, 0.3, 0.5] });
    const second = build(changed);
    expect(second.buildId).toBe(first.buildId);
    expect(second.fragmentSource).toBe(first.fragmentSource);
    expect(second.parameterBindings[0].defaultValue).toEqual([1, 0.2, 0.3, 0.5]);
    const unexposed = apply({ ...document, graph: { ...document.graph, parameters: [] } }, { type: 'set-property', nodeId: 'value', propertyId: 'value', value: [1, 0, 0, 1] });
    expect(build(unexposed).buildId).not.toBe(compiledLiteral.buildId);
  });

  it('emits guarded source and dependency sampling with a stable resource table', () => {
    const base = createProject('sampling', 'Sampling', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = apply(base, { type: 'add-node', nodeId: 'uv', nodeType: 'filter.uv', position: { x: 0, y: 0 } });
    document = apply(document, { type: 'add-node', nodeId: 'image', nodeType: 'filter.sample-image', position: { x: 0, y: 0 } });
    document = apply(document, { type: 'connect', edgeId: 'a', from: { nodeId: 'uv', portId: 'uv' }, to: { nodeId: 'image', portId: 'uv' } });
    document = apply(document, { type: 'connect', edgeId: 'b', from: { nodeId: 'image', portId: 'rgba' }, to: { nodeId: 'root', portId: 'rgba' } });
    const generated = build(document);
    expect(generated.textureBindings).toEqual([{ assetId: 'unbound', uniformName: 'uAsset0', samplerName: 'uAsset0Sampler' }]);
    expect(generated.fragmentSource).toContain('vec4 fxSampleAsset0(vec2 uv)');
    expect(generated.fragmentSource).toContain('greaterThan(uv, vec2(1.0))');
    expect(generated.fragmentSource).toContain('vTextureCoord / (uOutputFrame.zw * uInputSize.zw)');
    expect(generated.nodeSourceRanges.image).toBeTruthy();
  });

  it('premultiplies a hexadecimal color literal for the Filter output convention', () => {
    const base = createProject('color', 'Color', FILTER_GRAPH_KIND, 'root');
    let document: EditorDocument = apply(base, { type: 'add-node', nodeId: 'color', nodeType: 'filter.color', position: { x: 0, y: 0 } });
    document = apply(document, { type: 'add-node', nodeId: 'conversion', nodeType: 'filter.color-rgba', position: { x: 0, y: 0 } });
    document = apply(document, { type: 'set-property', nodeId: 'color', propertyId: 'value', value: '#ff000080' });
    document = apply(document, { type: 'connect', edgeId: 'a', from: { nodeId: 'color', portId: 'color' }, to: { nodeId: 'conversion', portId: 'color' } });
    document = apply(document, { type: 'connect', edgeId: 'b', from: { nodeId: 'conversion', portId: 'rgba' }, to: { nodeId: 'root', portId: 'rgba' } });
    const generated = build(document);
    expect(generated.fragmentSource).toContain('vec4(0.5019607843137255, 0.0, 0.0, 0.5019607843137255)');
  });
});
