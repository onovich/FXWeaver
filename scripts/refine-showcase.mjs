import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

// These projects are authored entirely as ordinary editor nodes and connections.
// The public compiler, not this script, supplies every GLSL expression.
function author(id) {
  const nodes=[],edges=[],parameters=[],positions={},depths=new Map();
  let sequence=0; const cache=new Map();
  const uuid=label=>{const s=createHash('sha256').update(`showcase-v2-${id}-${label}`).digest('hex');return `${s.slice(0,8)}-${s.slice(8,12)}-4${s.slice(13,16)}-a${s.slice(17,20)}-${s.slice(20,32)}`;};
  function node(type,inputs={},values={},port='value') {
    const n=uuid(`node-${sequence++}`); nodes.push({id:n,type:`filter.${type}`,definitionVersion:1,values});
    let depth=0; for(const [p,from]of Object.entries(inputs)){depth=Math.max(depth,(depths.get(from.nodeId)??0)+1);edges.push({id:uuid(`edge-${edges.length}`),from,to:{nodeId:n,portId:p}});}
    depths.set(n,depth);positions[n]={x:40+depth*235,y:60+nodes.filter(x=>depths.get(x.id)===depth).length*180};return {nodeId:n,portId:port};
  }
  const constant=(value,type='float')=>{const k=JSON.stringify([value,type]);if(!cache.has(k))cache.set(k,node(type,{}, {value}));return cache.get(k);};
  const param=(name,value,min,max,type='float')=>{const out=node(type,{}, {value},type==='color'?'color':'value');parameters.push({id:uuid(`param-${name}`),name,valueType:type,sourceNodeId:out.nodeId,sourceKey:'value',defaultValue:value,...(min!==undefined?{min,max}:{})});return out;};
  const op=(type,a,b)=>node(`${type}-float`,{a,b});const unary=(type,x)=>node(`${type}-float`,{x});
  const smooth=(a,b,x)=>node('smoothstep-float',{low:constant(a),high:constant(b),x});
  const one=constant(1),zero=constant(0);const add=(a,b)=>op('add',a,b),mul=(a,b)=>op('multiply',a,b),sub=(a,b)=>op('subtract',a,b);
  const uv=node('uv',{}, {},'uv'),xy=node('split-vec2',{vector:uv},{},'x'),y={...xy,portId:'y'},time=node('time',{}, {},'seconds');
  const source=node('source',{}, {},'rgba'),split=node('split-vec4',{rgba:source},{},'r'),alpha={...split,portId:'a'};
  const channels=[split,{...split,portId:'g'},{...split,portId:'b'}];
  let rgba;
  if(id==='03') {
    const progress=param('Burn progress',0.42,0,1),automatic=param('Auto burn',1,0,1),speed=param('Burn speed',0.16,0.02,0.5);
    const cycle=unary('fract',mul(time,speed));
    const p=node('mix-float',{a:progress,b:cycle,t:automatic});
    const radius=add(mul(p,constant(1.2)),constant(-0.15));
    const center=param('Center',[0.38,0.62],undefined,undefined,'vec2');
    const distance=node('distance-vec2',{a:uv,b:center});
    const moving=mul(time,constant(3));
    const nx=unary('sin',add(mul(xy,constant(43)),moving));
    const ny=unary('sin',sub(mul(y,constant(61)),moving));
    const detail=unary('sin',add(mul(add(xy,y),constant(109)),mul(time,constant(5))));
    const noise=param('Noise amount',0.055,0,0.15);
    const field=add(distance,mul(add(mul(add(nx,ny),constant(0.4)),mul(detail,constant(0.2))),noise));
    const signed=sub(field,radius),keep=smooth(-0.008,0.008,signed);
    const width=param('Edge width',0.055,0.015,0.15);
    const rim=mul(keep,sub(one,node('smoothstep-float',{low:constant(0.005),high:width,x:signed})));
    const hot=mul(keep,sub(one,smooth(0.002,0.025,signed)));
    const edge=param('Edge color','#ff5108ff',undefined,undefined,'color');
    const edge4=node('color-rgba',{color:edge},{},'rgba'),edgeSplit=node('split-vec4',{rgba:edge4},{},'r');
    const colors=[edgeSplit,{...edgeSplit,portId:'g'},{...edgeSplit,portId:'b'}];
    const hotcolors=[1,0.86,0.25];
    const rgb=channels.map((c,i)=>mul(add(node('mix-float',{a:c,b:mul(colors[i],alpha),t:rim}),mul(mul(hot,alpha),constant(hotcolors[i]*0.8))),keep));
    rgba=node('compose-vec4',{x:rgb[0],y:rgb[1],z:rgb[2],w:mul(alpha,keep)});
  } else {
    const intensity=param('Scan intensity',0.26,0,0.6),frequency=param('Line frequency',140,60,220),speed=param('Scan speed',0.23,0,1);
    const sine=unary('sin',mul(mul(y,frequency),constant(Math.PI*2)));
    const line=smooth(0.45,0.9,sine),shade=sub(one,mul(line,intensity));
    const bands=unary('floor',mul(y,constant(24))),tick=unary('floor',mul(time,constant(8)));
    const random=unary('fract',mul(unary('sin',add(mul(bands,constant(12.9898)),mul(tick,constant(78.233)))),constant(4375.85453)));
    const gate=node('step-float',{edge:constant(0.8),x:random});
    const amount=param('Glitch displacement',0.045,0,0.08);
    const displacement=mul(mul(sub(random,constant(0.5)),amount),gate);
    const shift=node('compose-vec2',{x:displacement,y:zero});
    const displaced=node('add-vec2',{a:uv,b:shift});
    const sample=node('sample-source',{uv:displaced},{},'rgba'),sampleSplit=node('split-vec4',{rgba:sample},{},'r');
    const offset=param('RGB separation',0.0025,0,0.03),offset2=node('compose-vec2',{x:offset,y:zero});
    const red=node('sample-source',{uv:node('add-vec2',{a:displaced,b:offset2})},{},'rgba');
    const blue=node('sample-source',{uv:node('subtract-vec2',{a:displaced,b:offset2})},{},'rgba');
    const rc=node('split-vec4',{rgba:red},{},'r'),bc=node('split-vec4',{rgba:blue},{},'b');
    const a={...sampleSplit,portId:'a'};
    const scanPosition=unary('fract',mul(time,speed));
    const d=unary('abs',sub(y,scanPosition));
    const sweep=mul(sub(one,smooth(0,0.085,d)),param('Sweep glow',0.45,0,0.8));
    const rgb=[rc,{...sampleSplit,portId:'g'},bc].map((c,i)=>add(mul(c,shade),mul(mul(sweep,a),constant([0.12,0.7,1][i]))));
    rgba=node('compose-vec4',{x:rgb[0],y:rgb[1],z:rgb[2],w:a});
  }
  node('output',{rgba},{},'');
  // Place constants beside their first consumer instead of a very tall left column.
  for(const n of nodes)if(['filter.float','filter.color','filter.vec2'].includes(n.type)) {
    const consumers=edges.filter(e=>e.from.nodeId===n.id).map(e=>depths.get(e.to.nodeId));
    if(consumers.length)depths.set(n.id,Math.max(0,Math.min(...consumers)-1));
  }
  const rows=new Map();for(const n of nodes){const d=depths.get(n.id),r=rows.get(d)??0;positions[n.id]={x:40+d*215,y:60+r*180};rows.set(d,r+1);}
  return {graph:{schemaVersion:1,graphKind:'pixi.filter2d',nodes,edges,parameters},layout:{nodePositions:positions,viewport:{x:10,y:60,zoom:0.2},selectedNodeIds:[]}};
}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/tests/fixtures/generated-filter.html');
for(const [id,slug]of [['03','radial-burn'],['09','hologram-scan']]) {
  const file=`examples/showcase/${id}-${slug}.fxweave.json`,project=JSON.parse(await readFile(file,'utf8'));
  Object.assign(project,author(id));project.assets.dependencies=[];project.preview.parameterValues={};project.preview.timeSeconds=id==='03'?1.6:2.2;
  for(const key of ['nodes','edges','parameters'])project.graph[key].sort((a,b)=>a.id.localeCompare(b.id));
  await page.goto('http://127.0.0.1:4173/tests/fixtures/generated-filter.html');
  const generated=await page.evaluate(async project=>{
    const {parseProject}=await import('/src/graph/project.ts');const p=parseProject(JSON.stringify(project));if(!p.ok)throw Error(p.message);
    const {lowerFilterGraph}=await import('/src/compiler/ir.ts');const {generateFilter}=await import('/src/compiler/generate.ts');
    const r=lowerFilterGraph(p.project.graph);if(!r.ok)throw Error(JSON.stringify(r.issues));return generateFilter(r.ir);
  },project);
  await writeFile(file,JSON.stringify(project,null,2)+'\n');
  const {fragmentSource,...manifest}=generated;
  await writeFile(`examples/showcase/${id}-${slug}.manifest.json`,JSON.stringify(manifest,null,2)+'\n');
  await writeFile(`examples/showcase/${id}-${slug}.frag.glsl`,fragmentSource);
  await writeFile(`examples/showcase/${id}-${slug}.creation-log.json`,JSON.stringify({method:'Ordinary node definitions and connected ports; generated by lowerFilterGraph + generateFilter.',script:'scripts/refine-showcase.mjs',buildId:generated.buildId,nodes:project.graph.nodes.map(n=>({id:n.id,type:n.type})),edges:project.graph.edges},null,2)+'\n');
  console.log(id,generated.buildId,project.graph.nodes.length);
}
await browser.close();
