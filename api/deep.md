---
bizId: A03
endpoint: /saic/enterprise/deep/wh
---

# A03 企业工商深度查询

```text
POST /saic/enterprise/deep/wh
```

企业工商详情 + 10+ 年报子列表 + 股权出质 + 司法协助 + 严重违法。

四个标识字段**至少填一个**，可混用。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entName` | body | string | 4 选 1 | 企业全称 |
| `creditCode` | body | string | 4 选 1 | 统一社会信用代码（18 位） |
| `regNo` | body | string | 4 选 1 | 工商注册号（15 位） |
| `orgCode` | body | string | 4 选 1 | 组织机构代码（9 位） |

::: warning 四个字段必须至少填一个
Node CLI 用 schema 校验（报 `entName / creditCode / regNo / orgCode 至少填一个`），
Python SDK 在全空时抛 `ValueError`。不要发一个空 body。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise deep --ent-name 贵州茅台
elecredit enterprise deep --credit-code 91520300MA6DJXXXX
```

```bash [Python CLI]
elecredit deep --ent-name 贵州茅台
```

```python [Python SDK]
client.deep(ent_name="贵州茅台")
client.deep(credit_code="91520300MA6DJXXXX")
```

:::

## 响应结构

`resultData` 为企业详情对象（产品码 `P0010058`），包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| `creditCode` | string | 统一社会信用代码 |
| `entName` | string | 企业全称 |
| `openStatus` | string | 经营状态 |
| `entType` | string | 企业类型 |
| `regCap` | string | 注册资本 |
| `estiblishTime` | string | 成立时间 |
| `regAddress` | string | 注册地址 |

以及若干子列表：

| 字段 | 类型 | 说明 |
|---|---|---|
| `annualReportList` | array | 年报信息列表 |
| `equityPledgeList` | array | 股权出质登记 |
| `judicialAssistanceList` | array | 司法协助信息 |
| `seriousIllegalList` | array | 严重违法失信企业 |

## 大结果处理

::: warning 深度查询数据量大，建议落盘
响应可能包含 10+ 个子列表，直接打印会被终端截断。
用 `--output <file>` 落盘后再分析：

```bash
elecredit enterprise deep --ent-name 贵州茅台 --output deep.json
```
::::

## 相关

- [A07 模糊查询](./fuzzy) —— 只有模糊名称时先用它拿到全称
- [F09 企业股权图谱](./graph) —— 需要股东链穿透时用图谱端点
