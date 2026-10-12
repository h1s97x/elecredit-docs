# Elecredit 文档站

VitePress 文档站，读者是**接入方开发者（Node / Python / 任意语言）与 AI Agent**。
本仓是站点内容的**唯一来源**。

> 本文件是给维护者看的（怎么本地起、怎么发布），**不作为站点页面**
> （`.vitepress/config.mts` 里 `srcExclude: ['README.md']`）。

## 内容边界

| 属于本站 | 不属于本站 |
|---|---|
| 怎么配凭据、怎么签名 | 架构决策记录、审计报告 |
| 10 个端点的参数与响应 | 内部运行手册、发布治理 |
| CLI / SDK / Skill 怎么用 | 内部制品库地址、内网地址、项目代号 |
| 错误码分类与排障 | 代码级实现细节（留在代码仓库 `wiki/`） |

**本站不硬编码任何内部地址**。源码仓库是私有的，本站将来可能公开，两者边界不同：
仓库入口与「编辑此页」前缀都由构建环境注入（`DOCS_REPO_URL` / `DOCS_EDIT_LINK`），
未注入时不渲染。

## 本地预览

```bash
pnpm install          # 首次
pnpm dev              # http://localhost:5173
pnpm build            # 产物：.vitepress/dist
pnpm preview          # 预览构建产物
```

## 端点覆盖闸门（构建前必跑）

```bash
pnpm check:endpoints
```

规则：本站 `api/` 下的端点页必须与代码仓库注册表的 **10 个端点**一一对应
（`bizId` + 路径 + 文件名三项都比对）。少一篇、路径写错、多一篇都会失败。

这道闸门是为了防止这个项目历史上出现过的漂移：**代码 10 个端点、文档只有 8 篇**。

事实源在代码仓库：

- `elecredit-cli/src/contracts/remote-capabilities.ts`
- `sdk/elecredit/endpoints.py`
- `docs/api/elecredit/`

## 发布链路

```text
代码仓库（私有）
  │  人工把事实变更同步到本站（本站是面向读者的重写，不是复制）
  ▼
本仓 · 内容源（CNB，唯一编辑入口）
  │  push → git-sync 单向同步
  ▼
发布源（GitHub，公开）
  │  Actions：端点覆盖校验 → 构建 → 发布
  ▼
GitHub Pages
```

| 角色 | 负责 | 不负责 |
|---|---|---|
| 代码仓库 | 提供事实源（注册表、契约文档） | 不构建、不发布站点 |
| 本仓（内容源） | 唯一内容编辑入口，提交即同步 | 不做发布前校验 |
| GitHub 发布仓 | 端点覆盖校验 + 构建 + 发布 Pages | 不编辑内容（只被消费） |

校验闸放在**发布前**，保证任何一次发布都经过它。

### 前置条件（首次发布）

1. GitHub 侧已创建文档仓（`.cnb.yml` 里 `target_url` 指向它）。
2. `h1s97x/secret-env` 提供 `GITHUB_USERNAME` / `GITHUB_TOKEN`（`GITHUB_TOKEN` 需 repo 范围）。
3. GitHub 仓的 Pages Source 选 **GitHub Actions**
   （workflow 里 `configure-pages` 的 `enablement: true` 首次会自动开启）。

### 发布细节

| 项 | 说明 |
|---|---|
| 站点地址 | GitHub Pages **项目站点**，位于 `/<repo>/` 子路径；workflow 自动传 `--base` |
| cleanUrls | **默认关闭**：GitHub Pages 不做无扩展名 URL 重写，开启会导致内页 404。迁到 nginx / Netlify 时可设 `CLEAN_URLS=1` |
| 404 | VitePress 生成 `404.html`，GitHub Pages 直接可用 |
| 域名确定后 | 在 `.vitepress/config.mts` 打开 `sitemap.hostname` |

## 同步注意

- 内容只在**本仓**编辑；`git-sync` 是单向的（本仓 → GitHub），不要在 GitHub 侧直接改内容。
- 若本仓出现**重写历史**（rebase / amend / 强制推送），`git-sync` 会因非快进被拒而同步失败。
  此时需在 GitHub 侧强制更新，之后恢复正常。

## 写作约定

1. **不要复制正文**：事实源是代码仓库的契约文档与端点的实际行为，本站只做面向读者的重写与解释。
2. **危险操作必须显式标注**：用 `::: danger` / `::: warning`，例如 `SYS005 不是错误`、
   `P0020019 路径大小写`、`D11 range 上限 20`。
3. **每条结论尽量对应可执行命令**（能直接复制的 curl / CLI / Python 片段）。
4. **不写内部信息**：仓库路径、制品库域名一律用占位符。
5. 新增端点页时，必须带 `bizId` 与 `endpoint` front matter，否则 `pnpm check:endpoints` 会失败。
