# API 参考总览

10 个企业风控端点，覆盖工商、税务、招投标、风险、诉讼、图谱与实控人。

- **Base URL**：`https://api.elecredit.com`
- **方法**：全部 `POST` + JSON body
- **认证**：HTTP Header 签名（`MD5(requestSn + timestamp_ms + bodyCompactJson + appKey)`）
- **签名位置**：**HTTP Header**，不是 body

## 本页目录

[[toc]]

## 端点分组

| 分组 | 路径 | 端点 |
|---|---|---|
| 工商域（A 系列） | `/mohu/wh`、`/saic/enterprise/deep/wh`、`/enterprise/companyLevel/wh` | [A07 模糊查询](./fuzzy)、[A03 深度查询](./deep)、[A04 大中小微划型](./scale) |
| 税务域（B 系列） | `/enterprise/taxInfo` | [B06 税务信用](./tax) |
| 招投标域（B 系列） | `/enterprise/biddingYPageWh` | [B04 招投标信息](./bidding) |
| 风险域（D 系列） | `/enterprise/adminPunishment`、`/risk/sifaInfo/wh` | [D07 行政处罚](./admin-punishment)、[D11 司法查询](./judicial) |
| 诉讼域（D 系列） | `/litigation/xgbzxrPeople/wh` | [D14 限制高消费人员](./xgbzxr) |
| 图谱域（F 系列） | `/saic/equityPenetration` | [F09 企业股权图谱](./graph) |
| 实控人（P 系列） | `/saic/SaicinvWh` | [P0020019 实控人](./actual-controller) |

## 通用约定

| 项目 | 契约 |
|---|---|
| Base URL | `https://api.elecredit.com` |
| 方法 | 全部 `POST` |
| Content-Type | `application/json` |
| 认证头 | `app-id`、`timestamp`、`request-sn`、`signature`、`sign-type` |
| 签名算法 | `MD5(requestSn + timestamp_ms + bodyCompactJson + appKey).hex()` |
| body 序列化 | 紧凑 JSON（`separators=(",", ":")`），中文**不转义** |
| 成功判断 | `code` 为空或 `000`；`001` = 查询成功无结果 |
| 时区 | 时间戳按 `Asia/Shanghai` 解释 |
| 凭据 | App ID + App Key，从 <https://api.elecredit.com/admin> 获取 |

请求头示例：

```
Content-Type: application/json
app-id:        <appId>
timestamp:     <ts_ms>
request-sn:    <sn>
signature:     <md5_hex>
sign-type:     MD5
```

::: warning 签名是对**原始字节**算的
body 多一个空格、中文被 `\u` 转义、序列化两次结果不一致，都会导致 `SYS001`。
先序列化一次拿到字符串，既用它签名也原样发送。详见[签名算法](../guide/signature)。
::::

## 调用频率与限流

| 项目 | 说明 |
|---|---|
| 限流错误码 | `SYS008` |
| 建议退避 | 指数退避 + 抖动，3 次上限（两个客户端均已内置） |
| 计费 | **每次分页都是一次计费调用**；扇出与深层穿透会成倍放大次数 |

::: tip 扇出前先看计数
`D11` 要拿多类型明细时，先读 `detailListMeta` 的计数，**跳过为 0 的类型**，
可显著减少调用次数。Python SDK 的 `judicial_all()` 已封装这套编排。
::::

## 响应信封

所有端点返回统一外层信封：

```json
{
  "code": "000",
  "msg": "查询成功",
  "orderNo": "a14eb808e0c245f4b15c1123b0e2265b",
  "resultData": { }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | string | `000` 成功 / `001` 成功无结果 / `SYS***` 见错误码 |
| `msg` | string | 人类可读的消息 |
| `orderNo` | string | 本次请求的流水号，排障时可提供给服务商 |
| `resultCode` | string | 部分端点返回的上游结果码 |
| `resultData` | object | 业务数据，见下方包裹结构 |

## `resultData` 包裹结构与产品码

上游会把业务体再包一层：`resultData = { "<产品码>Status", "<产品码>Data" }`，**产品码各端点不同**。

| 端点 | 短码 | 产品码 |
|---|---|---|
| `/mohu/wh` | A07 | `P0010068` |
| `/saic/enterprise/deep/wh` | A03 | `P0010058` |
| `/enterprise/companyLevel/wh` | A04 | `P0010070` |
| `/enterprise/taxInfo` | B06 | `P0030125` |
| `/enterprise/adminPunishment` | D07 | `P0030126` |
| `/risk/sifaInfo/wh` | D11 | `P0030089` |
| `/litigation/xgbzxrPeople/wh` | D14 | `P1020054` |
| `/saic/equityPenetration` | F09 | `P0020023` |
| `/enterprise/biddingYPageWh` | B04 | `P0010034` |
| `/saic/SaicinvWh` | P0020019 | `P0020019` |

取内层业务体：

::: code-group

```python [Python SDK]
from elecredit import product_payload

product_payload(raw)              # 自动按结构探测产品码（上游换码也不失效）
product_payload(raw, "P0030089")  # 精确指定
```

```ts [其它语言]
const productCode = "P0030089";
const payload = resultData[`${productCode}Data`];
```

:::

::: warning 别硬编码兜底链
`result_data.get("P0030089Data") or result_data.get("P0030090Data")` 这类写法会在上游改码时静默失效。
Python SDK 的 `product_payload()` 按 `^P\d+Data$` 结构探测，未命中返回 `{}` 且**永不抛异常**。
::::

## 分页约定

支持分页的端点（A07 / B06 / B04 / D07 / D11）使用同名参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `pageNo` | string | 页码，**从 1 开始** |
| `range` | string | 每页数量 |

::: danger D11 的 range 上限是 20
`/risk/sifaInfo/wh` 的 `range` 超过 20 会返回 `999 系统异常`（硬失败）。
`pageNo` 超出总页数同样返回 `999`。
::::

## 错误码

| code | 分类 | 含义 | 处理 |
|---|---|---|---|
| `SYS001` | 认证 | 签名校验失败 | 检查序列化与签名算法 |
| `SYS002` | 认证 | 请求过期 | 时间戳用毫秒；同步时钟 |
| `SYS003` | 认证 | 应用 ID 不存在 | 核对 `app-id` |
| `SYS004` | 认证 | 签名算法不支持 | 固定 `sign-type: MD5` |
| **`SYS005`** | **业务** | **余额不足** | **提示充值，不重试（签名已通过）** |
| `SYS006` | 认证 | IP 受限 | 加白名单 |
| `SYS008` | 限流 | 频率限制 | 降速后重试 |
| `SYS044` | 参数 | 资源不存在（含**路径大小写**错误） | 核对路径大小写 |
| HTTP `400` | 参数 | 请求体校验失败 | 修正字段 |
| HTTP `5xx` | 上游 | 服务异常 | 有界退避 |

完整分类与处置见[错误码](../guide/errors)。

## 再往下

| 我想…… | 去哪 |
|---|---|
| 先跑通一个请求 | [快速开始](../guide/quick-start) |
| 自己实现签名 | [签名算法](../guide/signature) |
| 看具体端点 | 左侧选一个端点 |
