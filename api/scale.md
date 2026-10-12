---
bizId: A04
endpoint: /enterprise/companyLevel/wh
---

# A04 企业大中小微划型

```text
POST /enterprise/companyLevel/wh
```

返回企业划型结果（大型 / 中型 / 小型 / 微型），基于**从业人员数、营业收入、资产总额**
三个指标综合判定。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entInfo` | body | string | **是** | 统一社会信用代码、注册号或企业名称，任一 |

::: tip entInfo 是「任一即可」的宽容字段
不像 A03 要求四个字段至少填一个，这里一个 `entInfo` 就够，内部会自动识别类型。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise scale --ent-info 贵州茅台
```

```bash [Python CLI]
elecredit scale --ent-info 贵州茅台
```

```python [Python SDK]
client.scale(ent_info="贵州茅台")
```

:::

## 响应字段

`resultData`（产品码 `P0010070`）字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `entName` | string | 匹配到的企业名称 |
| `scale` | string | `大型` / `中型` / `小型` / `微型` |
| `scaleDetail` | object | 判定依据（从业人员、营业收入、资产总额） |

::: tip 划型标准随行业不同
判定依据在 `scaleDetail` 里，建议连同它一起返回给业务方，
避免只给一个「小型」却无法解释依据。
::::

## 相关

- [A07 模糊查询](./fuzzy)
- [API 参考总览](/api/)
