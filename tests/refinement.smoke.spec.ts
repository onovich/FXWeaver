import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('selected exposed node edits its default directly while preserving the live scene and canvas', async ({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Edit a copy of Radial burn'}).click();
 await expect(page.getByText('Preview ready',{exact:true})).toBeVisible();
 const original = await page.locator('.preview-stage canvas').elementHandle();
 const build = await page.getByTestId('preview-build-id').textContent();
 await page.getByRole('button',{name:'Fit all nodes',exact:true}).click();
 await page.getByRole('button',{name:'Select Number node',exact:true}).first().click();
 await page.getByRole('button',{name:'Edit selected · 100%',exact:true}).click();
 const field=page.locator('.inspector-content').getByRole('spinbutton',{name:'Edge width default'});
 await field.fill('0.045');await field.press('Enter');await expect(field).toHaveValue('0.045');
 await expect(page.getByTestId('preview-build-id')).toHaveText(build!);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();
 const project=JSON.parse(await readFile((await (await download).path())!,'utf8'));
 expect(project.graph.parameters.find((p:{name:string})=>p.name==='Edge width').defaultValue).toBe(.045);
 expect(Object.values(project.preview.parameterValues)).toContain(.2);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(field).toHaveValue('0.07');
 await page.getByRole('button',{name:/Graph properties/}).click();
 await expect(page.locator('.runtime-parameter').getByRole('spinbutton',{name:'Radius',exact:true})).toHaveValue('0.2');
 expect(await page.locator('.preview-stage canvas').evaluate((canvas,old)=>canvas===old,original!)).toBe(true);
 await page.getByRole('button',{name:'Split',exact:true}).click();
 await page.getByRole('button',{name:'Enlarge preview',exact:true}).click();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Split',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('.preview-stage canvas').evaluate((canvas,old)=>canvas===old,original!)).toBe(true);
});
