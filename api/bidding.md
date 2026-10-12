---
bizId: B04
endpoint: /enterprise/biddingYPageWh
---

# B04 招投标信息

```text
POST /enterprise/biddingYPageWh
```

返回企业的招标 / 中标记录列表。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entInfo` | body | string | **是** | 企业名称 / 统一社会信用代码 |
| `pageNo` | body | string | 否 | 页码，从 `1` 开始 |
| `range` | body | string | 否 | 每页数量 |
| `position` | body | string | 否 | 地区 / 位置过滤 |
| `startDate` / `endDate` | body | string | 否 | 日期区间 `YYYY-MM-DD` |

:::: danger 参数名必须是 `entInfo`，不是 `entName`
传 `entName` 会直接返回 **`400 企业信息不能为空`**——看起来像「参数没传」，
实际是「参数名写错」。这是本仓库历史上踩过的坑之一。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise bidding --ent-info 贵州茅台
elecredit enterprise bidding --ent-info 贵州茅台 --start-date 2024-01-01 --format json
```

```bash [Python CLI]
elecredit bidding --ent-info 贵州茅台
```

```python [Python SDK]
client.bidding(ent_info="贵州茅台", page_no="1", range="10")
```

:::

## 响应

`resultData` 采用 `<产品码>Status` + `<产品码>Data` 包裹（产品码 `P0010034`），
列表位于内层 `resultList`：

```json
{
  "code": "001",
  "msg": "查询成功无结果",
  "orderNo": "a14eb808e0c245f4b15c1123b0e2265b",
  "resultData": {
    "P0010034Status": "1",
    "P0010034Data": { "resultList": [] }
  }
}
```

::: warning 字段级契约待补
上述样本取自真实凭据实测（`entInfo=贵州茅台`，恰无中标记录）。
`resultList` 有数据时的字段细节待有样本后补齐，当前按**原样透传**处理。
::::

## 相关

- [P0020019 实控人](./actual-controller) —— 同样必须用 `entInfo` 的端点
- [API 参考总览](/api/)
