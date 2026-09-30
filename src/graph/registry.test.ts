import { describe, expect, it } from 'vitest';
import {
  FILTER_GRAPH_KIND,
  FOUNDATION_GRAPH_KIND,
  getGraphKind,
  getNodeDefinition,
  listNodeDefinitions,
  registryIssues,
} from './registry';

describe('foundation registry', () => {
  it('has one explicit test-only graph kind with a unique output root', () => {
    const kind = getGraphKind(FOUNDATION_GRAPH_KIND);
    expect(kind).toMatchObject({ rootNodeType: 'foundation.output', isTestOnly: true });
    expect(listNodeDefinitions(FOUNDATION_GRAPH_KIND).filter((node) => node.type === kind?.rootNodeType)).toHaveLength(1);
    expect(registryIssues()).toEqual([]);
  });

  it('exposes exact typed port signatures and rejects unknown definitions', () => {
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'foundation.add')?.inputs)
      .toMatchObject([{ id: 'a', type: 'float' }, { id: 'b', type: 'float' }]);
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'foundation.vector2')?.outputs[0].type).toBe('vec2');
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'missing')).toBeUndefined();
    expect(getNodeDefinition('missing-kind', 'foundation.add')).toBeUndefined();
  });
});

describe('Pixi Filter node contract', () => {
  it('keeps host inputs and typed values in the Filter kind only', () => {
    const kind = getGraphKind(FILTER_GRAPH_KIND);
    expect(kind).toMatchObject({ rootNodeType: 'filter.output', isTestOnly: false });
    expect(listNodeDefinitions(FILTER_GRAPH_KIND).filter((node) => node.type === kind?.rootNodeType)).toHaveLength(1);
    expect(getNodeDefinition(FILTER_GRAPH_KIND, 'filter.source')?.outputs).toMatchObject([{ id: 'rgba', type: 'vec4' }]);
    expect(getNodeDefinition(FILTER_GRAPH_KIND, 'filter.uv')?.outputs).toMatchObject([{ id: 'uv', type: 'vec2' }]);
    expect(getNodeDefinition(FILTER_GRAPH_KIND, 'filter.time')?.outputs).toMatchObject([{ id: 'seconds', type: 'float' }]);
    expect(getNodeDefinition(FILTER_GRAPH_KIND, 'filter.color-rgba')?.inputs).toMatchObject([{ id: 'color', type: 'color' }]);
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'filter.source')).toBeUndefined();
    expect(getNodeDefinition(FILTER_GRAPH_KIND, 'foundation.number')).toBeUndefined();
    expect(registryIssues()).toEqual([]);
  });
});
