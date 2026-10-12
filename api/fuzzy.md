---
bizId: A07
endpoint: /mohu/wh
---

# A07 企业工商模糊查询

```text
POST /mohu/wh
```

按企业名称或部分关键字模糊搜索，返回匹配企业列表。支持分页。

**用它的典型场景**：只有模糊的企业名，想先拿到工商登记全称和统一社会信用代码，
再去调 A03 深度查询或其它端点。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entName` | body | string | **是** | 企业名称关键字，建议 2 个字符以上 |
| `type` | body | string | 否 | `0`=工商主体，`1`=非工商主体，`2`=全部（默认） |
| `regionId` | body | string | 否 | 行政区划代码，逗号分隔多个 |
| `pageNo` | body | string | 否 | 页码，从 `1` 开始 |
| `range` | body | string | 否 | 每页数量 |

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise fuzzy --ent-name 贵州茅台
elecredit enterprise fuzzy --ent-name 茅台 --type 0 --format json
```

```bash [Python CLI]
elecredit fuzzy --ent-name 贵州茅台 --page-no 1 --range 10
```

```python [Python SDK]
client.fuzzy(ent_name="贵州茅台", type="0", page_no="1", range="10")
```

```bash [curl]
curl -X POST 'https://api.elecredit.com/mohu/wh' \
  -H 'Content-Type: application/json' \
  -H 'app-id:        <appId>' \
  -H 'timestamp:     <ts_ms>' \
  -H 'request-sn:    <sn>' \
  -H 'signature:     <md5_hex>' \
  -H 'sign-type:     MD5' \
  -d '{"entName":"贵州茅台"}'
```

:::

## 响应

`resultData` 为 `<产品码>Status` + `<产品码>Data` 包裹（产品码 `P0010068`），
内层为匹配企业列表，单条记录包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| `creditCode` | string | 统一社会信用代码 |
| `regNo` | string | 工商注册号 |
| `entName` | string | 企业全称 |
| `entType` | string | 企业类型 |
| `openStatus` | string | 经营状态 |
| `regCap` | string | 注册资本 |
| `estiblishTime` | string | 成立时间（注意上游拼写为 `estiblishTime`） |
| `regCity` | string | 所在行政区 |

::: warning 字段名以上游实际返回为准
`estiblishTime` 这类拼写是上游的原始字段名，不要「顺手改正」。
响应字段因上游版本可能调整，以实际返回为准。
::::

## 相关

- [A03 工商深度查询](./deep) —— 拿到全称/信用代码后取完整工商详情
- [API 参考总览](/api/) —— 通用约定与产品码
