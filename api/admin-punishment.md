---
bizId: D07
endpoint: /enterprise/adminPunishment
---

# D07 行政处罚

```text
POST /enterprise/adminPunishment
```

多渠道行政处罚：工商、证监会、食药监、银保监、海关、税务、安监等。
支持按类型和日期范围过滤。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entInfo` | body | string | **是** | 统一社会信用代码 / 注册号 / 企业名称，任一 |
| `type` | body | string | 否 | 处罚渠道，见下表 |
| `pageNo` | body | string | 否 | 页码，从 `1` 开始 |
| `range` | body | string | 否 | 每页数量 |
| `startDate` | body | string | 否 | 处罚日期起始，`YYYY-MM-DD` |
| `endDate` | body | string | 否 | 处罚日期截止，`YYYY-MM-DD` |

### `type` 取值示例

| 值 | 渠道 |
|---|---|
| `buss` | 工商 |
| `zjh` | 证监会 |
| `syj` | 食药监 |
| `yjh` | 银监会 |
| `bjJh` | 保监会 |
| `hg-sx` | 海关失信 |
| `hg-zscq` | 海关知识产权 |

::: tip 日期格式会被客户端校验
Node CLI 对 `--start-date` / `--end-date` 施加 `^\d{4}-\d{2}-\d{2}$` 正则（允许空串），
`pageNo` / `range` 施加 `^\d+$`。写错格式会在本地就被拦下，不会打到网关。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise admin-punishment --ent-info 贵州茅台
elecredit enterprise admin-punishment --ent-info 贵州茅台 --type buss --start-date 2023-01-01 --format json
```

```bash [Python CLI]
elecredit admin-punishment --ent-info 贵州茅台 --start-date 2023-01-01
```

```python [Python SDK]
client.admin_punishment(ent_info="贵州茅台", start_date="2023-01-01")
```

:::

## 响应字段

`resultData`（产品码 `P0030126`）为处罚记录列表，单条包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| `punishNo` | string | 处罚决定书文号 |
| `punishType` | string | 处罚类型 |
| `punishDate` | string | 处罚日期 |
| `reason` | string | 违法事由 |
| `result` | string | 处罚结果 |
| `authority` | string | 处罚机关 |
| `type` | string | 渠道类型（`buss` / `zjh` / …） |

## 相关

- [B06 税务信用](./tax) —— 涉税处罚在税务端点下
- [D11 司法查询](./judicial)
