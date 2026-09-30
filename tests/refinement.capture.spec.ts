import { expect, test } from '@playwright/test';
for (const width of [1440, 390]) test(`refinement home ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 await page.locator('.entry-shell img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>(i as HTMLImageElement).decode()));});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/visuals/refinement-home-${width}.png`,fullPage:true});
});
for (const [width,height] of [[1440,900],[1920,1080],[1024,900]]) test(`refinement tuning and readable editing ${width}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');await page.getByRole('button',{name:'Edit a copy of Radial burn'}).click();await expect(page.getByText('Preview ready',{exact:true})).toBeVisible();
 await page.screenshot({path:`docs/visuals/refinement-tune-${width}.png`});
 if(width===1440){await page.getByRole('button',{name:'Enlarge preview',exact:true}).click();await page.getByRole('button',{name:'Split',exact:true}).click();await page.screenshot({path:'docs/visuals/refinement-enlarged-preview.png'});await page.keyboard.press('Escape');await page.getByRole('button',{name:'Effect',exact:true}).click();}
 const build=await page.getByTestId('preview-build-id').textContent();
 await page.getByRole('button',{name:'Fit all nodes',exact:true}).click();
 await page.getByRole('button',{name:'Select Number node',exact:true}).first().click();
 await page.getByRole('button',{name:'Edit selected · 100%',exact:true}).click();
 await expect(page.getByLabel('Canvas zoom')).toHaveText('100%');
 await expect(page.locator('.inspector-content').getByRole('spinbutton',{name:'Edge width default'})).toBeVisible();
 await page.screenshot({path:`docs/visuals/refinement-edit-${width}.png`});
 await page.getByRole('button',{name:/Graph properties/}).click();
 await expect(page.getByTestId('preview-build-id')).toHaveText(build!);
 await expect(page.locator('.runtime-parameter').first()).toBeVisible();
});
