import { describe, expect, it } from 'vitest';
import { applyCommand } from './commands';
import { filterMathNodeTypes } from './filterMathNodes';
import { createProject, parseProject, serializeProject } from './project';
import { FILTER_GRAPH_KIND, getNodeDefinition, registryIssues } from './registry';
import { validateGraph } from './validation';

describe('Filter math and channel contract', () => {
  it.each([
    ['filter.smoothstep-float', ['float', 'float', 'float'], ['float']],
    ['filter.mix-vec4', ['vec4', 'vec4', 'float'], ['vec4']],
    ['filter.scale-vec2', ['vec2', 'float'], ['vec2']],
    ['filter.distance-vec2', ['vec2', 'vec2'], ['float']],
    ['filter.split-vec4', ['vec4'], ['float', 'float', 'float', 'float']],
    ['filter.compose-rgba', ['vec3', 'float'], ['vec4']],
  ])('%s has stable typed ports', (type, inputs, outputs) => {
    const definition = getNodeDefinition(FILTER_GRAPH_KIND, type);
    expect(definition?.inputs.map((port) => port.type)).toEqual(inputs);
    expect(definition?.outputs.map((port) => port.type)).toEqual(outputs);
    expect(definition?.inputs.every((port) => port.required)).toBe(true);
  });

  it('registers each generic operation exactly once without a property-editor special case', () => {
    expect(new Set(filterMathNodeTypes).size).toBe(filterMathNodeTypes.length);
    expect(filterMathNodeTypes.every((type) => getNodeDefinition(FILTER_GRAPH_KIND, type)?.properties.length === 0)).toBe(true);
    expect(registryIssues()).toEqual([]);
  });

  it('keeps a threshold and RGBA mix graph editable, typed, and saveable', () => {
    const base = createProject('threshold', 'Threshold', FILTER_GRAPH_KIND, 'root');
    let document = { graph: base.graph, layout: base.layout };
    for (const [id, nodeType] of [
      ['source', 'filter.source'], ['tint', 'filter.vec4'], ['uv', 'filter.uv'],
      ['split', 'filter.split-vec2'], ['low', 'filter.float'], ['high', 'filter.float'],
      ['threshold', 'filter.smoothstep-float'], ['mix', 'filter.mix-vec4'],
    ]) {
      const result = applyCommand(document, { type: 'add-node', nodeId: id, nodeType, position: { x: 0, y: 0 } });
      expect(result.ok).toBe(true);
      document = result.document;
    }
    const wires = [
      ['source', 'rgba', 'mix', 'a'], ['tint', 'value', 'mix', 'b'],
      ['uv', 'uv', 'split', 'vector'], ['split', 'y', 'threshold', 'x'],
      ['low', 'value', 'threshold', 'low'], ['high', 'value', 'threshold', 'high'],
      ['threshold', 'value', 'mix', 't'], ['mix', 'value', 'root', 'rgba'],
    ];
    for (const [fromNode, fromPort, toNode, toPort] of wires) {
      const result = applyCommand(document, { type: 'connect', edgeId: `${fromNode}-${toNode}-${toPort}`,
        from: { nodeId: fromNode, portId: fromPort }, to: { nodeId: toNode, portId: toPort } });
      expect(result.ok).toBe(true);
      document = result.document;
    }
    expect(validateGraph(document.graph)).toEqual([]);
    expect(parseProject(serializeProject({ ...base, ...document }))).toMatchObject({ ok: true, issues: [] });
  });
});
