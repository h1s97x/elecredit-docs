---
bizId: B06
endpoint: /enterprise/taxInfo
---

# B06 企业税务信用查询

```text
POST /enterprise/taxInfo
```

企业税务 4 类信息：纳税信用等级、欠税公告、涉税处罚、非正常户公告。可按 `type` 过滤。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entityName` | body | string | **是** | 企业名称 |
| `type` | body | string | 否 | 见下表。省略时返回全部 |
| `pageNo` | body | string | 否 | 页码，从 `1` 开始 |
| `range` | body | string | 否 | 每页数量 |

### `type` 的 4 个合法值

| 值 | 含义 |
|---|---|
| `satpartyXin` | 纳税信用等级（默认） |
| `satpartyQs` | 欠税公告 |
| `satpartyChufa` | 涉税处罚 |
| `satpartyFzc` | 非正常户 |

::: warning 标识字段是 `entityName`，不是 `entName`
税务域统一用 `entityName`。写成 `entName` 会得到 `400`。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise tax-credit --entity-name 贵州茅台
elecredit enterprise tax-credit --entity-name 贵州茅台 --type satpartyXin --format json
```

```bash [Python CLI]
elecredit tax --entity-name 贵州茅台 --type satpartyXin
```

```python [Python SDK]
client.tax(entity_name="贵州茅台", type="satpartyXin")
```

:::

## 响应结构

`type` 不同时 `resultData`（产品码 `P0030125`）的结构也不同：

| `type` | 返回内容 |
|---|---|
| `satpartyXin` | 纳税信用等级列表（年度、等级、评价机关） |
| `satpartyQs` | 欠税公告列表（欠税税种、金额、所属期） |
| `satpartyChufa` | 涉税处罚列表（处罚决定书、事由、结果） |
| `satpartyFzc` | 非正常户列表（认定日期、认定机关） |

::: tip 想要「4 类全看一遍」
省略 `type` 一次拿到全部；或按业务需要逐类型调用，便于分别控制分页。
::::

## 相关

- [D07 行政处罚](./admin-punishment) —— 更广的多渠道处罚（含税务外的工商/证监会/海关等）
- [API 参考总览](/api/) —— 分页与产品码约定
