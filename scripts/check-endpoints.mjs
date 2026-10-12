#!/usr/bin/env node
/**
 * 端点覆盖闸门（自洽校验，不依赖网络与代码仓库）
 *
 * 事实源：
 *   - 代码仓库 elecredit-cli/src/contracts/remote-capabilities.ts
 *   - 代码仓库 sdk/elecredit/endpoints.py
 *   - 代码仓库 docs/api/elecredit/
 *
 * 本站把这些端点重写为面向读者的页面。本脚本保证「本站的端点页」与下面的
 * CANONICAL 清单一一对应：少一篇、路径写错、ID 写错，都会让构建失败。
 *
 * 为什么需要它：这个项目历史上出现过「代码 10 个端点、文档只有 8 篇」的漂移。
 *
 * 用法：node scripts/check-endpoints.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 与代码仓库注册表对齐的 10 个端点（bizId 使用仓库内的短码） */
const CANONICAL = [
  { bizId: 'A07', endpoint: '/mohu/wh', page: 'fuzzy.md' },
  { bizId: 'A03', endpoint: '/saic/enterprise/deep/wh', page: 'deep.md' },
  { bizId: 'A04', endpoint: '/enterprise/companyLevel/wh', page: 'scale.md' },
  { bizId: 'B06', endpoint: '/enterprise/taxInfo', page: 'tax.md' },
  { bizId: 'B04', endpoint: '/enterprise/biddingYPageWh', page: 'bidding.md' },
  { bizId: 'D07', endpoint: '/enterprise/adminPunishment', page: 'admin-punishment.md' },
  { bizId: 'D11', endpoint: '/risk/sifaInfo/wh', page: 'judicial.md' },
  { bizId: 'D14', endpoint: '/litigation/xgbzxrPeople/wh', page: 'xgbzxr.md' },
  { bizId: 'F09', endpoint: '/saic/equityPenetration', page: 'graph.md' },
  { bizId: 'P0020019', endpoint: '/saic/SaicinvWh', page: 'actual-controller.md' },
];

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'api');

/** 解析文件顶部 YAML front matter 里的标量键值 */
function parseFrontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    result[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return result;
}

const errors = [];

const found = new Map();
for (const file of readdirSync(apiDir)) {
  if (!file.endsWith('.md') || file === 'index.md') continue;
  const meta = parseFrontMatter(readFileSync(join(apiDir, file), 'utf8'));
  if (!meta.bizId || !meta.endpoint) {
    errors.push(`${file}: 缺少 front matter 的 bizId / endpoint`);
    continue;
  }
  found.set(meta.bizId, { endpoint: meta.endpoint, page: file });
}

for (const expected of CANONICAL) {
  const actual = found.get(expected.bizId);
  if (!actual) {
    errors.push(`缺少端点页：${expected.bizId}（${expected.endpoint}）`);
    continue;
  }
  if (actual.endpoint !== expected.endpoint) {
    errors.push(
      `${expected.bizId}: 路径不一致 —— 站点写「${actual.endpoint}」，注册表是「${expected.endpoint}」`,
    );
  }
  if (actual.page !== expected.page) {
    errors.push(`${expected.bizId}: 页面文件名不一致 —— 站点是「${actual.page}」，注册表是「${expected.page}」`);
  }
  found.delete(expected.bizId);
}

for (const [bizId, info] of found) {
  errors.push(`多出的端点页：${bizId}（${info.page}），不在注册表里`);
}

if (errors.length > 0) {
  console.error(`✗ 端点覆盖校验失败（${errors.length} 项）：`);
  for (const message of errors) console.error(`  - ${message}`);
  console.error('\n若不打算改动端点清单，请修正页面；若清单确实变了，请同步更新本脚本的 CANONICAL。');
  process.exit(1);
}

console.log(`✓ 端点覆盖校验通过：${CANONICAL.length}/${CANONICAL.length} 与注册表一致`);
