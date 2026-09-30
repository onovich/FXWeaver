import { chromium } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({ viewport:{width:1440,height:900} });
for (const [id,name] of [['03','Radial burn'],['05','Local melt'],['09','Hologram scan']]) {
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('button',{name:`Edit a copy of ${name}`}).click();
  await page.getByText('Preview ready',{exact:true}).waitFor();
  const buildId=await page.getByTestId('preview-build-id').textContent();
  await page.locator('.preview-stage canvas').waitFor();
  const data=await page.locator('.preview-stage canvas').evaluate(canvas=>canvas.toDataURL());
  await writeFile(`docs/visuals/showcase-${id}-effect.png`, Buffer.from(data.split(',')[1],'base64'));
  await page.getByRole('button',{name:'Original',exact:true}).click();
  const original=await page.locator('.preview-original').getAttribute('src');
  await writeFile(`docs/visuals/showcase-${id}-original.png`,Buffer.from(original.split(',')[1],'base64'));
  const files={source:'public/art/game/crystal-ward-base.png',project:`examples/showcase/${id}-${{'03':'radial-burn','05':'local-melt','09':'hologram-scan'}[id]}.fxweave.json`,effect:`docs/visuals/showcase-${id}-effect.png`,original:`docs/visuals/showcase-${id}-original.png`};
  const sha256={};for(const [key,file]of Object.entries(files))sha256[key]=createHash('sha256').update(await readFile(file)).digest('hex');
  await writeFile(`docs/visuals/showcase-${id}-evidence.json`, JSON.stringify({buildId,...files,sha256,method:'Actual canvas.toDataURL from generated Pixi WebGL2 Filter; original is same host with filters removed.'},null,2)+'\n');
}
await browser.close();
