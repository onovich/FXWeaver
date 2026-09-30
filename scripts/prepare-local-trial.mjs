import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.fxweave-local');
await mkdir(output, { recursive: true });
const results = [];
for (const id of ['03', '05', '09']) {
  const result = JSON.parse(await readFile(path.join(output, `work${id}-result.json`), 'utf8'));
  const bytes = await readFile(path.join(output, result.projectFile));
  if (createHash('sha256').update(bytes).digest('hex') !== result.projectHash) {
    throw new Error(`work${id} changed since automated verification. Keep your edited file; verify it before refreshing this recovery index.`);
  }
  results.push(result);
}
await writeFile(path.join(output, 'CONTINUE.md'), `# 本地试用恢复入口

生成于 ${new Date().toISOString()}。自动验证操作者：Codex via Playwright；人工跨日使用尚未验证。

1. 在 D:\\WebProjects\\FXWeaver 运行 npm run dev，打开终端给出的地址。
2. 在入口点 Open project file，选择下方工程；工程已嵌入图片，无需访问 Unity。
3. 点 Fit all nodes / F 查看全图，点 Enlarge preview 查看大画面，Esc 返回。
4. 修改参数或节点后，用 Save As 保存到本目录的新文件，避免重跑自动试用覆盖你的版本。
5. 把实际日期、耗时、卡点和下次继续位置写入 human-selfuse-record.md；明天按记录打开你的新文件继续。

${results.map((r) => `## 作品 ${r.work}

- 文件：${path.join(output, r.projectFile)}
- SHA-256：${r.projectHash}
- 构建：${r.buildId}
- 起点：${r.graphParameter.name} 默认 ${r.graphParameter.value}，运行值 ${r.runtimeValue}；${r.host}，固定时间 ${r.fixedTime} 秒。
- 已保存适配全部节点的视口；可从这里继续调参、改图及比较原图。
- 私有证据：work${r.work}-result.json、work${r.work}-workbench.png、work${r.work}-enlarged-effect.png、work${r.work}-enlarged-split.png。
`).join('\n')}

重跑 npm run trial:local 会重新生成 work03/05/09 及自动证据；人工版本请用不同文件名。
`, 'utf8');
const template = await readFile(path.join(root, 'templates', 'human-selfuse-record.md'), 'utf8');
try { await writeFile(path.join(output, 'human-selfuse-record.md'), template, { encoding: 'utf8', flag: 'wx' }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
console.log(`Recovery index ready: ${path.join(output, 'CONTINUE.md')}. Existing human notes preserved.`);
