import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Deterministic design artwork. Node ports and wires share one coordinate model.
const W = 1920;
const H = 1080;
const C = {
  bg: '#0a1118', panel: '#111b25', panel2: '#17232e', stroke: '#293b49',
  text: '#eaf2f8', muted: '#94a9ba', muted2: '#6e8496', cyan: '#2cdded',
  blue: '#58a5ff', purple: '#b68cff', amber: '#ffc66d', green: '#76d9ae',
};
const types = { texture: C.cyan, vec2: C.purple, float: C.amber, rgb: C.blue, alpha: C.green };
const nodes = [
  { id:'sourceTexture', name:'Source Texture', category:'INPUT · ASSET', x:270,y:160,w:186,h:130, accent:C.cyan,
    outputs:[{id:'texture',label:'Texture',type:'texture',dy:65}], detail:'hero.png · 1024 × 1024' },
  { id:'uv', name:'UV', category:'INPUT · HOST', x:275,y:330,w:165,h:100, accent:C.purple,
    outputs:[{id:'uv',label:'UV · vec2',type:'vec2',dy:65}], detail:'Normalized 0…1' },
  { id:'sample', name:'Sample Source', category:'SAMPLING', x:570,y:168,w:200,h:170, accent:C.blue,
    inputs:[{id:'texture',label:'Texture',type:'texture',dy:68},{id:'uv',label:'UV',type:'vec2',dy:107}],
    outputs:[{id:'color',label:'RGB',type:'rgb',dy:75},{id:'alpha',label:'Alpha',type:'alpha',dy:120}], detail:'sample(source, uv)' },
  { id:'time', name:'Time', category:'INPUT · HOST', x:275,y:485,w:165,h:100, accent:C.purple,
    outputs:[{id:'time',label:'Seconds',type:'float',dy:67}], detail:'Preview clock · 0.72 s' },
  { id:'noiseSpeed', name:'Noise Speed', category:'PARAM · p_speed', x:275,y:620,w:165,h:110, accent:C.amber,
    outputs:[{id:'speed',label:'Speed',type:'float',dy:74}], detail:'3.50 · uniform float' },
  { id:'scaleTime', name:'Multiply', category:'MATH', x:505,y:505,w:160,h:148, accent:C.amber,
    inputs:[{id:'time',label:'Time',type:'float',dy:70},{id:'speed',label:'Speed',type:'float',dy:110}],
    outputs:[{id:'scaledTime',label:'Time',type:'float',dy:90}], detail:'time × speed' },
  { id:'noise', name:'Noise 2D', category:'PROCEDURAL', x:700,y:490,w:185,h:165, accent:C.purple,
    inputs:[{id:'uv',label:'UV',type:'vec2',dy:75},{id:'time',label:'Time',type:'float',dy:115}],
    outputs:[{id:'noise',label:'Noise',type:'float',dy:95}], detail:'Animated scalar noise' },
  { id:'threshold', name:'Threshold', category:'PARAM · p_threshold', x:700,y:755,w:185,h:105, accent:C.amber,
    outputs:[{id:'threshold',label:'Value',type:'float',dy:69}], detail:'0.50 · uniform float' },
  { id:'rimColor', name:'Rim Color', category:'PARAM · p_rim', x:955,y:340,w:175,h:108, accent:C.blue,
    outputs:[{id:'rim',label:'RGB',type:'rgb',dy:69}], detail:'#00E5FF' },
  { id:'mask', name:'Dissolve Mask', category:'MASK · SELECTED', x:940,y:500,w:190,h:218, accent:C.cyan, selected:true,
    inputs:[{id:'noise',label:'Noise',type:'float',dy:62},{id:'threshold',label:'Threshold',type:'float',dy:104}],
    outputs:[{id:'mask',label:'Mask',type:'float',dy:71},{id:'edge',label:'Edge',type:'float',dy:113}], detail:'Edge width  0.08' },
  { id:'compose', name:'Compose Result', category:'RGBA COMPOSITE', x:1200,y:290,w:190,h:310, accent:C.blue,
    inputs:[{id:'sourceColor',label:'Source RGB',type:'rgb',dy:70},{id:'sourceAlpha',label:'Source Alpha',type:'alpha',dy:113},
      {id:'rim',label:'Rim Color',type:'rgb',dy:156},{id:'mask',label:'Mask',type:'float',dy:199},{id:'edge',label:'Edge',type:'float',dy:242}],
    outputs:[{id:'color',label:'Color',type:'rgb',dy:255},{id:'alpha',label:'Alpha',type:'alpha',dy:284}],
    detail:'color + rim · alpha × mask' },
  { id:'filter', name:'Filter Output', category:'ROOT · UNIQUE', x:1410,y:430,w:88,h:165, accent:C.green,
    inputs:[{id:'color',label:'Color',type:'rgb',dy:83},{id:'alpha',label:'Alpha',type:'alpha',dy:125}], detail:'2D' },
];

const edges = [
  ['sourceTexture.texture','sample.texture'], ['uv.uv','sample.uv'],
  ['uv.uv','noise.uv'], ['time.time','scaleTime.time'],
  ['noiseSpeed.speed','scaleTime.speed'], ['scaleTime.scaledTime','noise.time'],
  ['noise.noise','mask.noise'], ['threshold.threshold','mask.threshold'],
  ['sample.color','compose.sourceColor'], ['sample.alpha','compose.sourceAlpha'],
  ['rimColor.rim','compose.rim'], ['mask.mask','compose.mask'], ['mask.edge','compose.edge'],
  ['compose.color','filter.color'], ['compose.alpha','filter.alpha'],
];

function esc(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function txt(x,y,s,cls='body',extra='') { return `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(s)}</text>`; }
function line(x1,y1,x2,y2,stroke=C.stroke,width=1) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`; }
function rect(x,y,w,h,fill,rx=0,stroke='none',sw=1) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`; }
function circle(x,y,r,fill,stroke='none',sw=1) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`; }
function port(ref, side) {
  const [nodeId,portId]=ref.split('.'); const n=nodes.find(v=>v.id===nodeId); if(!n) throw Error(`Missing node ${nodeId}`);
  const p=n[side].find(v=>v.id===portId); if(!p) throw Error(`Missing port ${ref}`);
  return {x:side==='outputs'?n.x+n.w:n.x,y:n.y+p.dy,type:p.type};
}
function edgePath(a,b,from,to) {
  // Fan UV around, rather than behind, the Multiply node.
  if(from==='uv.uv'&&to==='noise.uv') {
    return `M${a.x},${a.y} C540,${a.y} 580,470 670,470 C690,470 680,${b.y} ${b.x},${b.y}`;
  }
  // Keep both source-sample wires above the Rim Color node, then turn down in
  // the open gutter immediately before Compose Result. This makes them fully
  // traceable without a node covering the middle of either wire.
  if(from==='sample.color'||from==='sample.alpha') {
    const turn=from==='sample.color'?1138:1147;
    return `M${a.x},${a.y} C930,${a.y} 1080,${a.y} ${turn},${a.y} C1181,${a.y} 1172,${b.y} ${b.x},${b.y}`;
  }
  const dx=b.x-a.x; const bend=Math.max(26,Math.min(160,dx*.48));
  return `M${a.x},${a.y} C${a.x+bend},${a.y} ${b.x-bend},${b.y} ${b.x},${b.y}`;
}
function renderEdges() {
  return edges.map(([from,to])=>{
    const a=port(from,'outputs'), b=port(to,'inputs');
    if(a.type!==b.type) throw Error(`Type mismatch ${from} (${a.type}) -> ${to} (${b.type})`);
    if(a.x>=b.x) throw Error(`Backwards wire ${from} -> ${to}`);
    const path=edgePath(a,b,from,to), color=types[a.type];
    return `<path d="${path}" fill="none" stroke="#071016" stroke-width="7" stroke-linecap="round"/>`+
      `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".95"/>`;
  }).join('');
}
function renderNode(n) {
  const out=[]; const border=n.selected?'#36e4ef':n.accent;
  out.push(`<g class="node" filter="url(#nodeShadow)">`);
  out.push(rect(n.x,n.y,n.w,n.h,'#14212b',9,border,n.selected?2.5:1.25));
  out.push(`<path d="M${n.x+9},${n.y} H${n.x+n.w-9} Q${n.x+n.w},${n.y} ${n.x+n.w},${n.y+9} V${n.y+37} H${n.x} V${n.y+9} Q${n.x},${n.y} ${n.x+9},${n.y}" fill="${n.selected?'#155469':'#1a2c39'}"/>`);
  if(n.id==='filter') {
    out.push(txt(n.x+10,n.y+21,'Filter','nodeTitle'));
    out.push(txt(n.x+10,n.y+36,'Output','nodeTitle'));
    out.push(txt(n.x+10,n.y+61,'2D · ROOT','micro',`fill="${n.accent}"`));
  } else {
    out.push(txt(n.x+13,n.y+25,n.name,'nodeTitle'));
    out.push(txt(n.x+13,n.y+49,n.category,'micro',`fill="${n.accent}"`));
  }
  for(const p of n.inputs||[]) {
    const py=n.y+p.dy; out.push(circle(n.x,py,6.5,types[p.type],'#0a1118',2));
    out.push(txt(n.x+15,py+5,p.label,'portLabel'));
  }
  for(const p of n.outputs||[]) {
    const py=n.y+p.dy; out.push(circle(n.x+n.w,py,6.5,types[p.type],'#0a1118',2));
    out.push(txt(n.x+n.w-15,py+5,p.label,'portLabel',`text-anchor="end"`));
  }
  if(n.id==='sourceTexture') {
    out.push(rect(n.x+13,n.y+86,n.w-26,31,'#203542',5,'#385365'));
    out.push(rect(n.x+19,n.y+92,19,19,'#2c95a5',3));
    out.push(txt(n.x+44,n.y+107,'hero.png · RGBA','small'));
  } else if(n.id==='rimColor') {
    out.push(rect(n.x+15,n.y+79,29,16,'#00e5ff',3)); out.push(txt(n.x+53,n.y+93,'#00E5FF','small'));
  } else if(n.id==='mask') {
    out.push(line(n.x+16,n.y+169,n.x+n.w-16,n.y+169,'#3a5362',3));
    out.push(line(n.x+16,n.y+169,n.x+104,n.y+169,C.cyan,3));
    out.push(circle(n.x+104,n.y+169,5,C.cyan));
    out.push(txt(n.x+16,n.y+195,n.detail,'small'));
  } else if(n.id==='compose') {
    out.push(line(n.x+15,n.y+226,n.x+n.w-15,n.y+226,'#3c5362'));
    out.push(txt(n.x+15,n.y+280,'RGB + rim / A × mask','micro'));
  } else if(n.id==='filter') {
    // The narrow root stays readable without a second detail line.
  } else {
    out.push(txt(n.x+13,n.y+n.h-13,n.detail,'micro'));
  }
  out.push('</g>'); return out.join('');
}

function iconCircle(x,y,color=C.muted) { return circle(x,y,7,'none',color,1.6)+line(x-3,y,x+3,y,color,1.4); }
function sideItem(y,label,symbol,color,selected=false) {
  return `${rect(16,y,199,40,selected?'#213545':'#16242f',6,selected?'#356179':'#263b49')}`+
    `${rect(24,y+8,24,24,'#192b38',5,color)}`+txt(36,y+26,symbol,'icon',`text-anchor="middle" fill="${color}"`)+txt(59,y+26,label,'sideLabel');
}
function sidebar() {
  let s=rect(0,55,230,971,'#101a24')+line(229,55,229,1026,'#28404f');
  s+=rect(9,68,91,38,'#223646',6)+txt(54,93,'Nodes','tab active','text-anchor="middle"');
  s+=txt(143,93,'Assets','tab',`text-anchor="middle"`)+line(10,106,100,106,C.blue,2);
  s+=rect(14,125,199,39,'#1b2935',5,'#304758')+txt(28,150,'⌕  Search nodes…','small');
  s+=txt(15,196,'INPUT','sideHeading');
  s+=sideItem(205,'Source Texture','▣',C.cyan,true)+sideItem(250,'UV','◇',C.purple)+sideItem(295,'Time','◷',C.purple);
  s+=txt(15,363,'PARAMETERS','sideHeading');
  s+=sideItem(371,'Float','1.0',C.amber)+sideItem(416,'Color','●',C.blue);
  s+=txt(15,486,'MATH & MASK','sideHeading');
  s+=sideItem(494,'Multiply','×',C.amber)+sideItem(539,'Noise 2D','≋',C.purple)+sideItem(584,'Dissolve Mask','◒',C.cyan);
  s+=txt(15,660,'OUTPUT','sideHeading');
  s+=sideItem(668,'Compose Result','⊕',C.blue)+sideItem(713,'Filter Output','▤',C.green);
  s+=line(14,945,215,945,'#304656')+txt(16,969,'12 nodes in graph','small')+txt(16,991,'F  Fit graph   •   Space  Pan','micro');
  return s;
}
function previewArt() {
  // A deterministic 2D sprite and dissolve illustration, not a cached raster result.
  let s=`<g clip-path="url(#previewClip)">`;
  s+=rect(1528,149,374,400,'url(#checker)');
  s+=`<ellipse cx="1709" cy="502" rx="109" ry="13" fill="#12364b" opacity=".35"/>`;
  s+=`<g clip-path="url(#visibleSpriteClip)">`;
  s+=`<path d="M1670 454 L1643 506 Q1719 530 1786 503 L1752 447 Z" fill="#245779" stroke="#60b5d5" stroke-width="4"/>`;
  s+=`<path d="M1648 450 Q1634 404 1654 368 L1674 353 L1680 318 L1721 303 L1753 323 L1764 366 Q1780 418 1755 452 Z" fill="#3f7899" stroke="#8bc5de" stroke-width="4"/>`;
  s+=`<path d="M1658 378 L1615 399 L1597 463 L1641 474 L1656 425" fill="#2f6689" stroke="#70b7d4" stroke-width="4"/>`;
  s+=`<path d="M1755 378 L1801 399 L1815 466 L1771 474 L1758 426" fill="#24536f" stroke="#6eb7d2" stroke-width="4"/>`;
  s+=`<path d="M1657 324 Q1652 283 1674 258 L1697 268 L1713 247 L1733 266 L1757 262 Q1771 287 1762 330 L1744 346 L1674 348 Z" fill="#d8e5ee" stroke="#84b4d2" stroke-width="5"/>`;
  s+=`<path d="M1673 327 L1691 343 L1728 341 L1750 327 L1742 373 L1714 391 L1682 373 Z" fill="#dcbda5" stroke="#a6d6e5" stroke-width="4"/>`;
  s+=`<path d="M1686 351 L1701 352 M1723 352 L1739 350" stroke="#117eb7" stroke-width="4" stroke-linecap="round"/>`;
  s+=`<path d="M1668 329 L1655 297 L1678 273 L1688 303 L1704 258 L1724 288 L1747 256 L1769 285 L1751 335" fill="#e1edf4" stroke="#8dc8e2" stroke-width="4"/>`;
  s+=`<path d="M1680 386 L1705 411 L1733 386 L1747 406 L1719 434 L1688 412 Z" fill="#099bd2" stroke="#72d9ef" stroke-width="3"/>`;
  s+=`<path d="M1647 453 L1765 452" stroke="#4fbddd" stroke-width="5"/>`;
  s+=`</g>`;
  // Disappearing side: the edge follows the source sprite's right contour.
  s+=`<path d="M1749 268 Q1773 285 1764 322 L1754 350 L1769 380 L1770 432 L1785 470" fill="none" stroke="#073e59" stroke-width="15" opacity=".8"/>`;
  s+=`<path d="M1749 268 Q1773 285 1764 322 L1754 350 L1769 380 L1770 432 L1785 470" fill="none" stroke="#00e5ff" stroke-width="5" filter="url(#cyanGlow)"/>`;
  s+='</g>'; return s;
}
function controls() {
  let s=rect(1510,55,410,971,'#101b25')+line(1510,55,1510,1026,'#2c4250');
  s+=txt(1530,89,'Preview','sectionTitle');
  s+=rect(1746,68,155,30,'#1b2a36',5,'#324b5b')+txt(1758,88,'Sprite (2D)  ▾','small');
  s+=rect(1528,149,374,400,'none',5,'#3a5363',1.2)+previewArt();
  s+=rect(1529,563,50,34,'#203443',5,'#3c5c70')+txt(1554,586,'▶','small','text-anchor="middle"');
  s+=line(1593,580,1772,580,'#375061',5)+line(1593,580,1661,580,C.blue,5)+circle(1661,580,7,C.blue);
  s+=txt(1782,585,'0.72 / 2.00 s','small');
  s+=rect(1529,608,165,34,'#1b2b38',5,'#324b5b')+txt(1612,630,'Original','small','text-anchor="middle"');
  s+=rect(1700,608,132,34,'#2879df',5)+txt(1766,630,'Effect','small white','text-anchor="middle"');
  s+=rect(1840,608,60,34,'#1b2b38',5,'#324b5b')+txt(1870,630,'Fit','small','text-anchor="middle"');
  s+=txt(1530,674,'Preview #1042 · current graph','micro')+line(1510,690,1920,690,'#29404e');
  s+=txt(1530,723,'Inspector','sectionTitle');
  s+=rect(1528,739,374,154,'#172632',7,'#2c4657');
  s+=txt(1544,766,'Dissolve Mask','inspectorTitle')+txt(1884,766,'Selected','micro',`text-anchor="end" fill="${C.cyan}"`);
  s+=line(1544,777,1886,777,'#304657');
  s+=txt(1544,803,'Threshold','small white')+rect(1668,787,218,30,'#20313d',4,'#3a5360')+txt(1678,807,'↗  Threshold · p_threshold','small');
  s+=txt(1544,845,'Edge Width','small white')+line(1669,838,1804,838,'#3d5362',4)+line(1669,838,1736,838,C.blue,4)+circle(1736,838,6,C.blue)+rect(1812,822,74,31,'#20313d',4,'#3a5360')+txt(1849,843,'0.08','small white','text-anchor="middle"');
  s+=txt(1544,877,'Threshold is linked; edit the parameter below.','micro');
  s+=rect(1528,904,374,115,'#172632',7,'#2c4657')+txt(1544,928,'Effect Parameters','inspectorTitle');
  s+=txt(1886,928,'↗ graph bindings','micro',`text-anchor="end"`);
  s+=txt(1544,952,'Threshold','small white')+rect(1809,935,77,27,'#20313d',4,'#537082')+txt(1847,954,'0.50','small white','text-anchor="middle"');
  s+=txt(1544,981,'Noise Speed','small white')+rect(1809,964,77,27,'#20313d',4,'#537082')+txt(1847,983,'3.50','small white','text-anchor="middle"');
  s+=txt(1544,1010,'Rim Color','small white')+rect(1778,996,20,20,'#00e5ff',3)+rect(1805,993,81,26,'#20313d',4,'#537082')+txt(1846,1011,'#00E5FF','small white','text-anchor="middle"');
  return s;
}
function headerAndFooter() {
  let s=rect(0,0,W,55,'url(#topBar)')+line(0,54,W,54,'#2a3b47');
  s+=txt(24,36,'FXWeave','brand')+line(156,11,156,44,'#314350');
  s+=txt(177,35,'Dissolve Study','headerTitle')+txt(338,35,'▾','small');
  s+=line(372,11,372,44,'#314350')+txt(393,35,'2D Filter · WebGL','small');
  s+=line(570,11,570,44,'#314350')+txt(590,35,'✓  Saved to project','small');
  s+=txt(785,35,'↶','headerIcon')+txt(832,35,'↷','headerIcon');
  s+=circle(1478,28,5,'#51db83')+txt(1494,34,'Build OK  #1042','small white');
  s+=rect(1664,11,91,33,'#1c2c38',5,'#3a5263')+txt(1710,33,'Save','small white','text-anchor="middle"');
  s+=rect(1767,11,131,33,'#2787e9',5)+txt(1832,33,'Output  ▾','small white','text-anchor="middle"');
  s+=rect(0,1026,W,54,'#111b25')+line(0,1026,W,1026,'#314451');
  s+=txt(25,1061,'☰','small')+line(51,1038,51,1068,'#304553');
  s+=circle(75,1054,8,'#48d786')+txt(69,1059,'✓','micro white');
  s+=txt(92,1060,'Problems 0','small white')+line(227,1038,227,1068,'#304553');
  s+=txt(247,1060,'⌘  Generated Shader','small')+line(435,1038,435,1068,'#304553');
  s+=txt(456,1060,'Source graph v18  ·  Generator 0.1  ·  Build #1042','small');
  s+=txt(1889,1060,'100%','small','text-anchor="end"');
  return s;
}
const defs=`<defs>
  <linearGradient id="topBar" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#172430"/><stop offset="1" stop-color="#121d28"/></linearGradient>
  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#31414d" stroke-width=".7" opacity=".27"/></pattern>
  <pattern id="checker" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#59636b"/><path d="M0 0H16V16H0ZM16 16H32V32H16Z" fill="#79828a"/></pattern>
  <clipPath id="previewClip"><rect x="1528" y="149" width="374" height="400" rx="5"/></clipPath>
  <clipPath id="visibleSpriteClip"><path d="M1528 149 H1749 L1754 261 L1750 297 L1764 321 L1753 351 L1768 380 L1770 421 L1785 470 L1773 549 H1528 Z"/></clipPath>
  <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/><feOffset in="blur" dy="5" result="off"/><feComponentTransfer in="off" result="dim"><feFuncA type="linear" slope=".24"/></feComponentTransfer><feMerge><feMergeNode in="dim"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="cyanGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
const style=`<style>
  text{font-family:Inter,'Segoe UI',Arial,sans-serif;letter-spacing:.1px;fill:${C.text}}
  .brand{font-size:25px;font-weight:750;letter-spacing:-.8px}.headerTitle{font-size:16px;font-weight:650}
  .headerIcon{font-size:24px;fill:${C.muted}}.body{font-size:14px}.small{font-size:13px;fill:${C.muted}}
  .white{fill:${C.text}}.micro{font-size:11px;fill:${C.muted2}}.tab{font-size:14px;fill:${C.muted}}
  .tab.active{fill:${C.text};font-weight:650}.sideHeading{font-size:12px;font-weight:750;fill:#5dc7e6;letter-spacing:1.2px}
  .sideLabel{font-size:13px;fill:#dbe8f1}.icon{font-size:14px;font-weight:700}.nodeTitle{font-size:14px;font-weight:700}
  .portLabel{font-size:12px;fill:#d7e5ed}.sectionTitle{font-size:17px;font-weight:650}.inspectorTitle{font-size:14px;font-weight:700}
</style>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="FXWeave V0 node editor development review artwork showing a valid dissolve graph">
${defs}${style}
${rect(0,0,W,H,C.bg)}${rect(230,55,1280,971,'url(#grid)')}
${sidebar()}
${txt(255,91,'Dissolve graph','sectionTitle')}${txt(1419,91,'84%  •  F to fit','small','text-anchor="end"')}
${txt(255,115,'Source + UV → Sample   ·   UV + Time → Noise → Mask   ·   Compose → Filter','micro')}
${renderEdges()}
${nodes.map(renderNode).join('')}
${controls()}
${headerAndFooter()}
</svg>`;

const targets=new Set(); for(const [from,to] of edges){ if(targets.has(to)) throw Error(`Multiple wires to ${to}`); targets.add(to); port(from,'outputs'); port(to,'inputs'); }
const out=join(dirname(fileURLToPath(import.meta.url)),'fxweave-v0-editor-review.svg');
writeFileSync(out,svg,{encoding:'utf8'});
console.log(`Wrote ${out}`);
console.log(`${nodes.length} nodes, ${edges.length} validated typed connections, ${targets.size} uniquely fed inputs.`);
