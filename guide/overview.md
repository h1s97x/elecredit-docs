# 项目总览

Elecredit（元素数智企业风控）是一个**企业风控数据服务**，把工商、税务、司法、诉讼、图谱等数据统一到**一个网关、一套签名**下。

```
                 ┌─────────────────────────────────────────┐
                 │  https://api.elecredit.com              │
                 │  10 个端点 · 全部 POST + JSON body       │
                 │  认证：HTTP Header 签名（App ID + App Key）│
                 └────────────────────┬────────────────────┘
                                      │
        ┌──────────────┬──────────────┼──────────────┬────────────────┐
        ▼              ▼              ▼              ▼                ▼
   Node.js CLI    Python SDK     Agent Skill     REST 直连      你自己的封装
   elecredit-cli  elecredit      skills/         curl/任何语言
```

## 四个接入形态，同一份端点清单

| 形态 | 面向 | 何时选它 |
|---|---|---|
| **Node.js CLI** | 终端、CI 脚本、AI Agent | 要稳定的 JSON 信封与退出码，不想写代码 |
| **Python SDK** | 数据分析、Notebook、服务集成 | 要对象化的返回值和异常分类 |
| **Agent Skill** | LLM Agent | 让模型用自然语言自己选端点、处理凭据 |
| **REST 直连** | 任何语言 | 不想引入依赖，自己实现 MD5 签名 |

四者覆盖的端点**完全相同**，不存在「CLI 能做、SDK 不能做」的差异。

## 10 个端点

| ID | 业务域 | 路径 | 一句话 | 文档 |
|---|---|---|---|---|
| A07 | 工商 | `/mohu/wh` | 按企业名关键字模糊搜索，支持分页 | [A07](../api/fuzzy) |
| A03 | 工商 | `/saic/enterprise/deep/wh` | 工商深度详情（年报/股权出质/司法协助/严重违法），4 选 1 标识 | [A03](../api/deep) |
| A04 | 工商 | `/enterprise/companyLevel/wh` | 大 / 中 / 小 / 微型企业划型 | [A04](../api/scale) |
| B06 | 税务 | `/enterprise/taxInfo` | 纳税信用等级 / 欠税公告 / 涉税处罚 / 非正常户 | [B06](../api/tax) |
| B04 | 招投标 | `/enterprise/biddingYPageWh` | 招标 / 中标记录 | [B04](../api/bidding) |
| D07 | 风险 | `/enterprise/adminPunishment` | 多渠道行政处罚（工商/证监会/食药监/银保监/海关…） | [D07](../api/admin-punishment) |
| D11 | 风险 | `/risk/sifaInfo/wh` | 司法查询，按 `entityName` 聚合 + 单值 `type` 过滤 | [D11](../api/judicial) |
| D14 | 诉讼 | `/litigation/xgbzxrPeople/wh` | 限制高消费人员 | [D14](../api/xgbzxr) |
| F09 | 图谱 | `/saic/equityPenetration` | 股权穿透图谱（递归树，**60s 超时**） | [F09](../api/graph) |
| P0020019 | 实控人 | `/saic/SaicinvWh` | 实际控制人（法人 / 股东穿透） | [P0020019](../api/actual-controller) |

## 通用约定

| 项目 | 契约 |
|---|---|
| Base URL | `https://api.elecredit.com` |
| 方法 | 全部 `POST` + JSON body |
| 认证 | HTTP Header 签名（5 个头，见下） |
| 签名算法 | `MD5(requestSn + timestamp_ms + bodyCompactJson + appKey).hex()` |
| body 序列化 | 紧凑 JSON（`separators=(",", ":")`），中文**不转义** |
| 响应信封 | `{code, msg, orderNo, resultCode, resultData}` |
| 成功判断 | 响应 `code` 为空或 `000`（`001` = 查询成功但无结果） |
| 时区 | 时间戳按 `Asia/Shanghai` 解释 |
| 凭据 | **App ID + App Key 二元组**，从 <https://api.elecredit.com/admin> 获取 |

请求头：

```
Content-Type: application/json
app-id:        <appId>
timestamp:     <ts_ms>
request-sn:    <sn>
signature:     <md5_hex>
sign-type:     MD5
```

## 能力边界

| 擅长 | 有条件 | 超出范围 |
|---|---|---|
| 企业工商模糊 / 深度查询 | 需要企业名称或统一社会信用代码 | 实时征信评分 |
| 股权图谱递归穿透 | 默认 3 层、5% 阈值，可调层数 | 动态图谱可视化渲染 |
| 12 种司法类型查询 | **单值** `type`，多类型需逐类型调用 | 全量司法数据订阅 |
| 限消人员 / 税务 / 行政处罚 / 招投标 | 支持分页 | 批量全市场扫描 |

超出范围时明确说明边界，**不用近似数据冒充真实响应**。
