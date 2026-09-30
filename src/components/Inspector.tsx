import { PropertyControl } from './PropertyControl';
import { ParameterNameControl } from './ParameterNameControl';
import { ParameterRangeControl } from './ParameterRangeControl';
import type { GraphCommand } from '../graph/commands';
import { getGraphKind, getNodeDefinition } from '../graph/registry';
import type { GraphDocument } from '../graph/schema';
import type { ProjectAssets } from '../graph/assets';

interface Props {
  graph: GraphDocument;
  assets: ProjectAssets;
  selectedNodeId?: string;
  dispatch: (command: GraphCommand) => boolean;
  onDelete: () => void;
}

export function Inspector({ graph, assets, selectedNodeId, dispatch, onDelete }: Props) {
  const node = graph.nodes.find((item) => item.id === selectedNodeId);
  const definition = node && getNodeDefinition(graph.graphKind, node.type);

  return <section className="inspector-panel" aria-labelledby="inspector-heading">
    <div className="panel-heading"><p className="section-kicker">GRAPH DEFAULTS</p><h2 id="inspector-heading">Inspector</h2></div>
    {node && definition ? <div className="inspector-content">
      <strong>{definition.label}</strong>
      {definition.properties.map((property) => {
        const linked = graph.parameters.find((parameter) => parameter.sourceNodeId === node.id && parameter.sourceKey === property.id);
        return <div key={property.id}>
          {property.type === 'texture' ? <div className="property-control">
            <label htmlFor={`dependency-${node.id}-${property.id}`}>{property.label}</label>
            <select id={`dependency-${node.id}-${property.id}`} aria-label="Dependency image" value={String(node.values[property.id])}
              onChange={(event) => dispatch({ type: 'set-property', nodeId: node.id, propertyId: property.id, value: event.target.value })}>
              <option value="unbound">Unbound</option>
              {!assets.dependencies.some((image) => image.id === node.values[property.id]) && node.values[property.id] !== 'unbound' &&
                <option value={String(node.values[property.id])}>Missing: {String(node.values[property.id])}</option>}
              {assets.dependencies.map((image) => <option key={image.id} value={image.id}>{image.name} · {image.id.slice(0, 8)}</option>)}
            </select>
          </div> : linked ? <><PropertyControl id={`linked-default-${node.id}-${property.id}`} property={{ ...property, label: `${linked.name} default`, min: linked.min, max: linked.max }} value={node.values[property.id]} onCommit={(value) => dispatch({ type: 'set-property', nodeId: node.id, propertyId: property.id, value })} /><p className="linked-property">Exposed as {linked.name}. This edits the graph default; Runtime parameters tunes the current scene.</p></> : <>
            <PropertyControl id={`inspector-${node.id}-${property.id}`} property={property} value={node.values[property.id]} onCommit={(value) => dispatch({ type: 'set-property', nodeId: node.id, propertyId: property.id, value })} />
            <button className="text-button" type="button" onClick={() => dispatch({ type: 'expose-parameter', parameterId: crypto.randomUUID(), nodeId: node.id, propertyId: property.id, name: property.label })}>Expose as parameter</button>
          </>}
        </div>;
      })}
      <details className="node-description"><summary>About this node</summary><p>{definition.description}</p></details>
      <p className="node-signature">{definition.inputs.length} inputs · {definition.outputs.length} outputs</p>
      <button className="secondary-button" type="button" disabled={node.type === getGraphKind(graph.graphKind)?.rootNodeType} onClick={onDelete}>Delete selected</button>
    </div> : <p className="panel-note">Select a node to inspect its properties.</p>}

    <div className="parameter-section" aria-labelledby="parameter-heading">
      <details className="parameter-management"><summary id="parameter-heading">Manage parameter definitions</summary><p className="panel-note">Defaults and ranges are saved in the graph. Tune the current look in Runtime parameters above.</p>
      {graph.parameters.length === 0 && <p className="panel-note">No exposed parameters yet.</p>}
      {graph.parameters.map((parameter) => {
        const source = graph.nodes.find((item) => item.id === parameter.sourceNodeId);
        const property = source && getNodeDefinition(graph.graphKind, source.type)?.properties.find((item) => item.id === parameter.sourceKey);
        if (!source || !property) return <p key={parameter.id} className="field-error">{parameter.name}: source property unavailable.</p>;
        return <div className="parameter-item" key={parameter.id}>
          <div className="parameter-title"><strong>{parameter.name}</strong><div className="parameter-title-actions"><ParameterNameControl id={`parameter-name-${parameter.id}`} name={parameter.name} onCommit={(name) => dispatch({ type: 'rename-parameter', parameterId: parameter.id, name })} /><button type="button" className="text-button" onClick={() => dispatch({ type: 'remove-parameter', parameterId: parameter.id })}>Remove</button></div></div>
          <PropertyControl id={`parameter-${parameter.id}`} property={{ ...property, label: parameter.name }} value={source.values[property.id]} onCommit={(value) => dispatch({ type: 'set-property', nodeId: source.id, propertyId: property.id, value })} />
          {parameter.valueType === 'float' && <ParameterRangeControl parameter={parameter} onCommit={(min, max) => dispatch({ type: 'set-parameter-range', parameterId: parameter.id, min, max })} />}
        </div>;
      })}
      </details>
    </div>
  </section>;
}
