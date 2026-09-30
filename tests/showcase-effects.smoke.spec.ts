import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function pixels(page: import('@playwright/test').Page) {
  return page.locator('.preview-stage canvas').evaluate((canvas: HTMLCanvasElement) => {
    const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;
    const ctx=copy.getContext('2d')!;ctx.drawImage(canvas,0,0);const {data}=ctx.getImageData(0,0,copy.width,copy.height);
    let visible=0,hot=0;for(let i=0;i<data.length;i+=4){if(data[i]+data[i+1]+data[i+2]>45)visible++;if(data[i]>200&&data[i+1]>65&&data[i+1]<220&&data[i+2]<110)hot++;}
    return {image:canvas.toDataURL(),visible,hot};
  });
}
async function set(page: import('@playwright/test').Page,name:string,value:number) {
 const field=page.getByRole('spinbutton',{name,exact:true});await field.fill(String(value));await field.press('Enter');
}
async function compareOriginal(page: import('@playwright/test').Page) {
 await page.getByRole('button',{name:'Original',exact:true}).click();
 return page.locator('.preview-stage canvas').evaluate(async(canvas:HTMLCanvasElement)=>{
  const image=document.querySelector<HTMLImageElement>('.preview-original')!;await image.decode();
  const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=canvas.width;a.height=b.height=canvas.height;
  a.getContext('2d')!.drawImage(canvas,0,0);b.getContext('2d')!.drawImage(image,0,0);
  const x=a.getContext('2d')!.getImageData(0,0,a.width,a.height).data,y=b.getContext('2d')!.getImageData(0,0,b.width,b.height).data;
  let sum=0;for(let i=0;i<x.length;i++)sum+=Math.abs(x[i]-y[i]);return sum/x.length;
 });
}
test('showcase burn cycles with time, has a hot edge, and manual endpoints preserve or remove source',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Edit a copy of Radial burn'}).click();await expect(page.getByText('Preview ready',{exact:true})).toBeVisible();
 const build=await page.getByTestId('preview-build-id').textContent();const canvas=await page.locator('.preview-stage canvas').elementHandle();
 const initial=await pixels(page);expect(initial.hot).toBeGreaterThan(500);
 await page.getByRole('button',{name:'Play',exact:true}).click();await expect.poll(async()=> (await pixels(page)).image).not.toBe(initial.image);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await set(page,'Auto burn',0);await set(page,'Burn progress',0);await expect.poll(async()=> (await pixels(page)).hot).toBe(0);const complete=await pixels(page);expect(complete.visible).toBeGreaterThan(initial.visible);
 expect(await compareOriginal(page)).toBeLessThan(0.3);await page.getByRole('button',{name:'Effect',exact:true}).click();
 await set(page,'Burn progress',1);await expect.poll(async()=> (await pixels(page)).visible).toBe(0);
 await expect(page.getByTestId('preview-build-id')).toHaveText(build!);expect(await page.locator('.preview-stage canvas').evaluate((now,old)=>now===old,canvas!)).toBe(true);
});
test('showcase scan animates, restores the source at neutral settings, and publishes its actual generated manifest',async({page})=>{
 const file=JSON.parse(await readFile(path.resolve(import.meta.dirname,'../examples/showcase/09-hologram-scan.fxweave.json'),'utf8'));
 const manifest=JSON.parse(await readFile(path.resolve(import.meta.dirname,'../examples/showcase/09-hologram-scan.manifest.json'),'utf8'));
 await page.goto('/');await page.getByRole('button',{name:'Edit a copy of Hologram scan'}).click();await expect(page.getByText('Preview ready',{exact:true})).toBeVisible();
 await expect(page.getByTestId('preview-build-id')).toHaveText(manifest.buildId);const first=await pixels(page);
 await page.getByLabel('Fixed preview time',{exact:true}).fill('3.8');await expect.poll(async()=> (await pixels(page)).image).not.toBe(first.image);
 await page.getByRole('button',{name:'Play',exact:true}).click();const playing=await pixels(page);await expect.poll(async()=> (await pixels(page)).image).not.toBe(playing.image);await page.getByRole('button',{name:'Pause',exact:true}).click();
 for(const name of ['Scan intensity','Glitch displacement','RGB separation','Sweep glow'])await set(page,name,0);
 await expect.poll(()=>compareOriginal(page)).toBeLessThan(0.3);
 expect(file.graph.nodes.length).toBeGreaterThan(50);expect(manifest.usesTime).toBe(true);await expect(page.getByText('Problems 0')).toBeVisible();
});
