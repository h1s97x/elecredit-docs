---
layout: home

hero:
  name: Elecredit
  text: 企业风控数据
  tagline: 10 个端点，一套签名，四种接入形态
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: API 参考
      link: /api/
    - theme: alt
      text: Node.js CLI
      link: /guide/node-cli
    - theme: alt
      text: Python SDK
      link: /guide/python-sdk

features:
  - title: 一个网关，10 个端点
    details: 工商模糊/深度查询、大中小微划型、税务信用、行政处罚、司法（12 种 type）、限消人员、招投标、股权图谱、实控人。全部 POST + JSON body，签名走 HTTP Header。
  - title: App ID + App Key 签名
    details: 不是单一 API Key。signature = MD5(requestSn + timestamp + 紧凑JSON + appKey)，放 Header 不放 body；中文不转义是成败关键。
  - title: 四种接入形态
    details: Node.js CLI、Python SDK、Agent Skill、以及任意语言的 REST 直连。10 个端点在三处一一对应，由跨端一致性测试守着。
  - title: 为 Agent 而设
    details: CLI 输出稳定 JSON 信封与退出码，Skill 负责自然语言到端点的路由，大结果落盘只报路径与摘要。
---

## 这套文档面向谁

给**要接入 Elecredit 企业风控数据的开发者**：怎么配凭据、怎么签名、每个端点收什么参数、返回什么、出错怎么办。

架构决策、内部运行手册与发布治理属于代码仓库文档，不在本站——本站只保留「接、签、调、排」四件事，并且每条结论都对应一段可复制执行的代码。

## 先记住三条，能省掉 90% 的无效排错

:::: warning SYS005 余额不足是**成功**响应
`SYS005` 意味着签名算法正确、`App ID`/`App Key` 有效、API 可达——只是账户没钱。
**提示充值，不要重试、不要去改签名**。把它当认证失败处理会白折腾一圈。
::::

:::: warning body 必须是紧凑 JSON，且中文**不转义**
`json.dumps(obj, ensure_ascii=False, separators=(",", ":"))`。
多一个空格、`\u` 转义、键顺序改了都会导致 `SYS001 签名校验失败`——因为签名是对**原始字节**算的。
::::

:::: warning 大结果必须落盘
`F09 股权图谱`深层穿透、分页全集动辄几十 MB。用 `--output <file>` 落盘，只汇报路径、行数与摘要，
不要把全量 JSON 回显到终端或对话里。
::::

## 30 秒跑通

```bash
# 1. 配凭据（从 https://api.elecredit.com/admin 获取 App ID + App Key）
export ELECREDIT_APP_ID=<你的 App ID>
export ELECREDIT_APP_KEY=<你的 App Key>

# 2. Node.js CLI
elecredit enterprise fuzzy --ent-name 贵州茅台 --format json

# 3. 或 Python SDK
python3 -c "
from elecredit import ElecreditClient
print(ElecreditClient.from_env().fuzzy(ent_name='贵州茅台'))
"
```

看到 `SYS005` 说明**你已经接通了**，只是账户余额不足。详见[快速开始](./guide/quick-start)。

## 下一步

| 我想…… | 去哪 |
|---|---|
| 五分钟内发出第一个请求 | [快速开始](./guide/quick-start) |
| 搞懂签名为什么老报 SYS001 | [签名算法](./guide/signature) |
| 查某个端点收什么参数 | [API 参考](./api/) |
| 在 CI / 脚本里用 | [Node.js CLI](./guide/node-cli) |
| 在数据分析里用 | [Python SDK](./guide/python-sdk) |
| 让 Agent 自己选端点 | [Agent Skill](./guide/agent-skill) |
| 排查一个错误码 | [错误码](./guide/errors) |
