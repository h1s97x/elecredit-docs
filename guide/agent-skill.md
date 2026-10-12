# Agent Skill

`elecredit` Agent Skill 让 LLM Agent 用**自然语言**发起企业风控查询，不需要先理解命令名和参数。

## 它解决什么问题

用户说「查一下贵州茅台的完整工商信息」，Agent 需要自己判断：

- 该打哪个端点？（A03 深度查询）
- 要传什么参数？（`--ent-name`）
- 凭据从哪来？（环境变量 → 钥匙环）
- 结果是 `SYS005` 还是真数据？（`SYS005` = 成功，不重试）
- 结果太大怎么办？（落盘，只报摘要）

Skill 就是把这些判断写成了可执行的契约。

## 触发场景

当用户提出下列意图时启用：

- 「查一下 XX 公司的工商信息」
- 「XX 有没有被行政处罚过」
- 「许家印现在是失信被执行人吗」
- 「这家公司的股权穿透图谱」
- 「全国欠税公告有哪些公司」

## 意图 → 端点路由

| 用户意图 | 端点 | CLI 命令 | 核心参数 |
|---|---|---|---|
| 按名称/代码模糊搜企业 | A07 | `enterprise fuzzy` | `--ent-name`（必填） |
| 企业工商深度详情 | A03 | `enterprise deep` | `--ent-name` / `--credit-code` / `--reg-no` / `--org-code`（4 选 1） |
| 企业大中小微划型 | A04 | `enterprise scale` | `--ent-info` |
| 税务信用 / 欠税 / 涉税处罚 / 非正常户 | B06 | `enterprise tax-credit` | `--entity-name` + 可选 `--type` |
| 招投标信息 | B04 | `enterprise bidding` | `--ent-info` |
| 多渠道行政处罚 | D07 | `enterprise admin-punishment` | `--ent-info` + 可选日期区间 |
| 司法模糊查询（12 种类型） | D11 | `risk judicial-fuzzy` | `--entity-name` + 单值 `--type` |
| 限制高消费人员 | D14 | `litigation xgbzxr` | `--pers-name` + `--id-no` |
| 企业全貌图谱 | F09 | `enterprise graph` | `--ent-info` + `--level` / `--down` / `--up` |
| 实际控制人 | P0020019 | `enterprise actual-controller` | `--ent-info` |

## 执行契约

Skill 要求 Agent 遵守：

1. **优先用 CLI**：`elecredit … --format json`，CLI 自动处理签名、重试与错误分类。
2. **没有 CLI 时用 REST**：POST 到 `https://api.elecredit.com/<path>`，按[签名算法](./signature)手动签名。
3. **失败时报告三件事**：错误码 + 消息 + 建议动作。不要只丢一段原始 JSON 给用户。
4. **成功条件**：CLI 退出码 `0` 且 JSON 信封 `ok=true`。
5. **大结果落盘**：`--output <file>`，只汇报路径、行数和摘要。
6. **不使用模拟数据**、静态示例或近似结果冒充真实响应。

## 凭据纪律

Skill 的探测顺序（**只报告来源和存在状态，不显示值**）：

1. 环境变量 `ELECREDIT_APP_ID` + `ELECREDIT_APP_KEY`（必须同时存在）
2. `elecredit auth status --format json` 检查钥匙环 `profile.default`
3. 全部缺失时引导用户去 <https://api.elecredit.com/admin> 获取，并给出配置命令

::: danger Agent 的凭据红线
不得把 Key 复述给用户、写入命令参数、日志、代码或产物。
用户主动提供凭据时，接受并完成配置，**不复述**。
:::

## 故障路由

| 情况 | 动作 |
|---|---|
| CLI 不存在 | 改用 REST 手动签名，或提示安装 |
| `SYS001` / `SYS003` | 重新检查凭据与签名，**不重试** |
| `SYS005` | 提示充值，**不重试**（签名已通过） |
| `SYS008` | 降低频率后有界退避重试 |
| 4xx | 修正参数 |
| 5xx / 网络 | 有界退避（最多 3 次） |
| F09 长时间无响应 | 该端点超时是 **60s**，不要过早判定失败 |

## 能力边界

| 擅长 | 有条件 | 超出范围 |
|---|---|---|
| 企业工商模糊 / 深度查询 | 需要企业名称或代码 | 实时征信评分 |
| 股权图谱递归穿透 | 默认 3 层 5%，可配层数 | 动态图谱可视化 |
| 12 种司法类型查询 | **按类型逐次调用**，单次拿不到分组 | 全量司法数据订阅 |
| 限消人员 / 税务 / 行政处罚 | 支持分页 | 批量全市场扫描 |

超出范围时明确说明边界，不用近似数据冒充。

## 相关

- [错误码](./errors) —— 分类的完整定义
- [Node.js CLI](./node-cli) —— Skill 的默认执行路径
