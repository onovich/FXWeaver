import { chromium } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const evidence={};
for(const [id,title,times]of [['03','Radial burn',[0,0.85,1.6,2.8,5.5]],['09','Hologram scan',[0.9,2.2,2.9,3.8]]]) {
 await page.goto('http://127.0.0.1:4173/');await page.getByRole('button',{name:`Edit a copy of ${title}`}).click();await page.getByText('Preview ready',{exact:true}).waitFor();
 await page.screenshot({path:`docs/visuals/showcase-v2-${id}-workspace.png`});
 const frames=[];
 async function capture(label) {
  const result=await page.locator('.preview-stage canvas').evaluate(canvas=>{
   const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);const {data}=ctx.getImageData(0,0,copy.width,copy.height);
   let visible=0,hot=0;for(let i=0;i<data.length;i+=4){if(data[i]+data[i+1]+data[i+2]>45)visible++;if(data[i]>200&&data[i+1]>65&&data[i+1]<220&&data[i+2]<110)hot++;}
   return {dataUrl:canvas.toDataURL(),visible,hot};
  });
  const file=`docs/visuals/showcase-v2-${id}-${label}.png`;const bytes=Buffer.from(result.dataUrl.split(',')[1],'base64');await writeFile(file,bytes);
  const frame={label,file,sha256:createHash('sha256').update(bytes).digest('hex'),visiblePixels:result.visible,hotPixels:result.hot};frames.push(frame);return frame;
 }
 for(const time of times){await page.getByLabel('Fixed preview time',{exact:true}).fill(String(time));await page.waitForTimeout(100);await capture(`t${time}`);}
 if(id==='03') {
  await page.getByRole('spinbutton',{name:'Auto burn',exact:true}).fill('0');await page.getByRole('spinbutton',{name:'Auto burn',exact:true}).press('Enter');
  for(const progress of [0,1]){await page.getByRole('spinbutton',{name:'Burn progress',exact:true}).fill(String(progress));await page.getByRole('spinbutton',{name:'Burn progress',exact:true}).press('Enter');await page.waitForTimeout(100);await capture(`manual-${progress}`);}
 } else {
  for(const name of ['Scan intensity','Glitch displacement','RGB separation','Sweep glow']){const field=page.getByRole('spinbutton',{name,exact:true});await field.fill('0');await field.press('Enter');}
  await page.waitForTimeout(100);await capture('neutral');
  await page.getByRole('button',{name:'Original',exact:true}).click();const original=await page.locator('.preview-original').getAttribute('src');await writeFile('docs/visuals/showcase-v2-09-neutral-original.png',Buffer.from(original.split(',')[1],'base64'));
 }
 const buildId=await page.getByTestId('preview-build-id').textContent();
 evidence[id]={buildId,frames,method:'Actual generated Pixi WebGL2 canvas frames at fixed time/ordinary runtime parameters.'};
 const sheet=await browser.newPage({viewport:{width:1200,height:900}});
 const items=await Promise.all(frames.map(async f=>({...f,data:'data:image/png;base64,'+(await readFile(f.file)).toString('base64')})));
 await sheet.setContent(`<body style="margin:0;background:#111820;color:#d7eaff;font:16px system-ui"><h2 style="padding:16px">${title} · Actual frames · cropped to artwork region</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${items.map(f=>`<figure style="margin:0;background:#17212c"><figcaption style="padding:10px">${f.label}</figcaption><div style="height:430px;overflow:hidden;position:relative"><img style="position:absolute;width:800px;height:640px;left:-203px;top:-100px" src="${f.data}"></div></figure>`).join('')}</div></body>`);
 await sheet.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));await sheet.screenshot({path:`docs/visuals/showcase-v2-${id}-sequence.png`,fullPage:true});await sheet.close();
}
await writeFile('docs/visuals/showcase-v2-sequence-evidence.json',JSON.stringify(evidence,null,2)+'\n');await browser.close();
