---
bizId: D11
endpoint: /risk/sifaInfo/wh
---

# D11 企业司法模糊查询

```text
POST /risk/sifaInfo/wh
```

按**企业名称**聚合返回该企业的司法类数据，并给出各类型的分页元数据 `detailListMeta`。

::: tip 它是本项目里坑最多的端点
字段名、`type` 取值、被静默忽略的字段都有历史误解。本文已按真实凭据逐字段核对。
::::

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entityName` | body | string | **是** | 企业名称。见下方警告 |
| `type` | body | string | 否 | **单值**类型过滤，取值见下。**大小写敏感、不支持逗号多选** |
| `pageNo` | body | string | 否 | 页码，从 1 开始。**超出总页数报 `999 系统异常`** |
| `range` | body | string | 否 | 每页数量，**上限 20**（默认 10）：`21` 及以上报 `999 系统异常` |

:::: danger 标识字段是 `entityName`
传 `entName` 或 `entInfo` 一律返回 `400 请求参数错误`。
这是与工商域（用 `entName`）最容易混的一个差异。
::::

### type 的 12 个合法值

| 值 | 含义 | 值 | 含义 |
|---|---|---|---|
| `shixin` | 失信 | `bgt` | 公告（其他） |
| `zxgg` | 执行公告 | `pccz` | 破产重整 |
| `cpws` | 裁判文书 | `sdgg` | 送达公告 |
| `fygg` | 法院公告 | `zbaj` | 中标案件 |
| `ktgg` | 开庭公告 | `lian` | 关联 |
| `xzgxf` | 限制高消费 | `pmgg` | 拍卖公告 |

这 12 个值就是响应 `detailListMeta` 里 `{值}Count` / `{值}PageNum` 的前缀，与请求侧一一对应。
非法值返回 `400 参数错误：type值不在允许范围内`。

:::: warning 不要传这些字段（上游**静默忽略**）
`types`（复数）、`startDate`、`endDate` 传了**不会报错，但完全不起作用**——
实测带与不带，`totalCount` 与返回条数完全一致。

静默忽略比报错更危险：调用方会以为过滤生效，实际拿到的是全量。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
# 按单值 type 过滤
elecredit risk judicial-fuzzy --entity-name 恒大地产集团有限公司 --type ktgg --range 20

# 不带 type：返回全类型聚合的首页
elecredit risk judicial-fuzzy --entity-name 恒大地产集团有限公司
```

```bash [Python CLI]
elecredit judicial --entity-name 恒大地产集团有限公司 --type ktgg --range 20
```

```python [Python SDK]
client.judicial(entity_name="恒大地产集团有限公司", type="ktgg", range="20")
client.judicial(entity_name="恒大地产集团有限公司")          # 全类型聚合
```

:::

## 响应

`resultData` = `{ P0030089Status, P0030089Data }`；
`P0030089Data` = `{ detailListMeta, detailList }`。

```json
{
  "code": "000",
  "msg": "查询成功",
  "resultData": {
    "P0030089Status": "1",
    "P0030089Data": {
      "detailListMeta": {
        "totalCount": "16723", "totalPage": "837", "pageNo": "1", "range": "20", "actualNo": 20,
        "ktggCount": "16723", "ktggPageNum": "837",
        "shixinCount": "598", "zxggCount": "9731", "cpwsCount": "2776", "fyggCount": "2420",
        "bgtCount": "3607", "pcczCount": "0", "sdggCount": "0", "zbajCount": "0",
        "lianCount": "0", "xzgxfCount": "0", "pmggCount": "0"
      },
      "detailList": [{ "……": "单条记录，字段随类型不同" }]
    }
  }
}
```

（示例取自 `entityName=恒大地产集团有限公司`、`type=ktgg`、`range=20`。）

### 解析要点

- **计数是字符串**（`"16723"`），而 `actualNo` 是数字，`range` / `pageNo` 也是字符串
  —— 类型不统一，别直接做数值比较。
- 某类型无数据时，`{值}Count` 可能**整个键缺失**，也可能返回**空字符串**（两种都实测到）。
- `detailList` 每条记录的 `annoType` 实测为**空字符串**，因此「按 `annoType` 区分类型」不成立；
  类型归属只能靠 `type` 分别查询。

## 多类型明细：扇出策略

因为 `type` 是单值，想覆盖多个类型只能逐类型调用。两种做法：

:::: tip 方式一：只要计数（1 次调用）
```python
from elecredit import judicial_summary
judicial_summary("恒大地产集团有限公司")["types"]["ktgg"]   # {"count": 16723, "pages": 1673}
```
先读 `detailListMeta` 就知道各类型有多少条、多少页，不必逐类型试探。
::::

:::: tip 方式二：每个非空类型都要代表记录（扇出）
```python
from elecredit import judicial_all
r = judicial_all("恒大地产集团有限公司")   # calls = 1 次汇总 + 6 个有数据的类型各 1 页
r["byType"]["ktgg"]                       # 该类型的记录列表（12 个键恒定）
r["truncated"]                            # True = 有类型没取全
r["errors"]                               # 单类型失败只记录，不影响其它类型
```
`judicial_all` 会自动**跳过计数为 0 的类型**、按总页数**夹紧页数**、跨类型按 `entryId` **去重**。
::::

:::: danger 扇出会成倍放大计费
每次分页都是一次计费调用。`max_pages` 上限 100，放大倍数很高；
并发（`concurrency` > 1）还会同时推高限流风险（`SYS008`）。
::::

::: tip 一个实用捷径
聚合调用（不传 `type`）返回的记录**自带 `type` 字段**（只有 `annoType` 是空串）。
所以「只想要第一屏混合明细」时不必扇出——1 次调用后按记录的 `type` 自行分桶即可。
扇出的价值在于「每个类型都要有代表记录」（例如 `fygg` 共 2420 条，聚合首页只出现 1 条）。
::::

## 相关

- [D14 限制高消费人员](./xgbzxr)
- [Python SDK](../guide/python-sdk) —— `judicial_summary` / `judicial_all`
- [API 参考总览](/api/) —— 分页约定
