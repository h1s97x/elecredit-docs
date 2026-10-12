# Node.js CLI

`elecredit` 命令行客户端，面向**终端用户、CI 脚本和 AI Agent**。自动完成签名、重试与错误分类。

## 安装

```bash
npm install -g @h1s97x/elecredit-cli
```

要求 **Node.js ≥ 22.12.0**（依赖原生 `require(esm)` 支持）。

::: warning 私有制品库需要 scope 级 .npmrc
当前包发布在私有制品库。安装前请按仓库 CLI README 配置 **scope 级** `.npmrc`
（`@h1s97x:registry=...`）。

**不要**用 `--registry` 改全局地址——本包有 4 个公共依赖，全局改会让它们 401/404。
:::

## 配置凭据

```bash
# 方式 1：环境变量（推荐，支持 CI / 容器）
export ELECREDIT_APP_ID=<你的 App ID>
export ELECREDIT_APP_KEY=<你的 App Key>

# 方式 2：系统钥匙环
elecredit auth login --app-id <App ID> --app-key <App Key>
elecredit auth status --format json     # 只报告来源，不回显值
```

解析优先级：**环境变量 > 系统钥匙环**。全部缺失时输出 `ELECREDIT_AUTH_REQUIRED`，退出码 **3**。

## 命令速查

```bash
elecredit capabilities --format json    # 列出 10 个端点元数据

# 工商
elecredit enterprise fuzzy            --ent-name 贵州茅台 --format json
elecredit enterprise deep             --credit-code 91520300MA6H... --format json
elecredit enterprise scale            --ent-info 贵州茅台 --format json

# 税务 / 招投标
elecredit enterprise tax-credit       --entity-name 贵州茅台 --type satpartyXin --format json
elecredit enterprise bidding          --ent-info 贵州茅台 --format json

# 风险 / 诉讼
elecredit enterprise admin-punishment --ent-info 贵州茅台 --format json
elecredit risk       judicial-fuzzy   --entity-name 贵州茅台 --type ktgg --range 20 --format json
elecredit litigation xgbzxr           --pers-name 许家印 --id-no 110101195804261234 --format json

# 图谱 / 实控人
elecredit enterprise graph            --ent-info 贵州茅台 --level 2 --down --output graph.json
elecredit enterprise actual-controller --ent-info 国家电网有限公司 --format json
```

## 输出信封

CLI 默认输出 JSON。成功：

```json
{ "ok": true, "bizCode": "000", "data": { "...": "..." } }
```

失败：

```json
{ "ok": false, "error": { "message": "...", "category": "authentication" } }
```

::: tip 为什么适合脚本
`ok` 字段与**退出码**共同表达成败，不需要去解析上游的 `code`。
配合 `--output <file>` 可以把大结果直接落盘。
:::

## 退出码

| 退出码 | 含义 |
|---|---|
| `0` | 成功 |
| `3` | 缺少凭据（`ELECREDIT_AUTH_REQUIRED`） |
| 其它非 0 | 请求失败，`error.category` 给出分类 |

## 大结果落盘

`F09 股权图谱`深层穿透的结果可能是几十 MB，直接打印到终端既不实用也容易截断：

```bash
elecredit enterprise graph --ent-info 贵州茅台 --level 4 --output graph.json
```

::: warning 不要把全量 JSON 回显到对话里
尤其是 Agent 场景：落盘后只汇报**路径、行数和摘要**。
:::

## 作为库使用

同一个包也是可嵌入的 TS 库：

```ts
import { createClientFromEnv, query } from '@h1s97x/elecredit-cli';

const client = createClientFromEnv();   // 读 ELECREDIT_APP_ID / ELECREDIT_APP_KEY
const res = await query(client, 'enterprise.fuzzy', { entName: '贵州茅台' });
```

CJS 消费方（Node ≥ 22.12）可直接 `require`，行为一致：

```js
const { createClientFromEnv, query } = require('@h1s97x/elecredit-cli');
```

::: danger 凭据只在服务端读取
不要把凭据注入浏览器端 bundle。完整示例见代码仓库的 `examples/nextjs/`。
:::

## 现有命令覆盖

| 分组 | 端点 ID | 命令 |
|---|---|---|
| enterprise | A07 | `elecredit enterprise fuzzy` |
| enterprise | A03 | `elecredit enterprise deep` |
| enterprise | A04 | `elecredit enterprise scale` |
| enterprise | B06 | `elecredit enterprise tax-credit` |
| enterprise | D07 | `elecredit enterprise admin-punishment` |
| enterprise | B04 | `elecredit enterprise bidding` |
| enterprise | F09 | `elecredit enterprise graph` |
| enterprise | P0020019 | `elecredit enterprise actual-controller` |
| risk | D11 | `elecredit risk judicial-fuzzy` |
| litigation | D14 | `elecredit litigation xgbzxr` |

## 相关

- [错误码](./errors)
- [签名算法](./signature) —— CLI 已内置，手动集成 REST 时才需要
