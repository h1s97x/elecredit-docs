# Python SDK

`elecredit` Python 包，面向**数据分析、Notebook 与服务集成**。10 个端点各有便捷方法。

## 安装

```bash
pip install elecredit
```

或者**零安装**直接用（核心只用标准库）：

```python
import sys; sys.path.insert(0, "sdk")
from elecredit import ElecreditClient, fuzzy, graph
```

::: tip 依赖策略
运行时优先用 `requests`；没装时自动回退标准库 `urllib`。
CLI 部分需要 `typer`，但 **SDK 本身不依赖任何第三方包**。
:::

## 快速开始

```python
from elecredit import ElecreditClient

client = ElecreditClient.from_env()        # 读 ELECREDIT_APP_ID / ELECREDIT_APP_KEY

client.fuzzy(ent_name="贵州茅台")
client.deep(ent_name="贵州茅台")
client.scale(ent_info="贵州茅台")
client.tax(entity_name="贵州茅台", type="satpartyXin")
client.admin_punishment(ent_info="贵州茅台")
client.judicial(entity_name="贵州茅台", type="ktgg", range="20")   # D11：entityName + 单值 type
client.xgbzxr(pers_name="许家印", id_no="110101195804261234")
client.graph(ent_info="贵州茅台", level="2")                        # 60s 超时
client.bidding(ent_info="贵州茅台")
client.actual_controller(ent_info="国家电网有限公司")
```

也可以用模块级便捷函数：

```python
from elecredit import fuzzy, graph

result = fuzzy(ent_name="贵州茅台")     # 自动从环境变量读凭据
```

## 异常分类

把上游错误码映射成语义化异常，避免到处 `if code == ...`：

| 异常 | code | 含义 |
|---|---|---|
| `AuthError` | SYS001 / SYS003 | 签名错或凭据无效 |
| **`BillingError`** | **SYS005** | **签名通过，余额不足（正常业务响应）** |
| `RateLimitError` | SYS008 | 频率限制 |
| `ValidationError` | HTTP 4xx | 参数错误 |
| `UpstreamError` | HTTP 5xx / 网络 | 上游异常或超时 |

```python
from elecredit import ElecreditClient, BillingError, RateLimitError

client = ElecreditClient.from_env()
try:
    data = client.fuzzy(ent_name="贵州茅台")
except BillingError:
    # 签名已通过，只是账户没余额 —— 提示充值，不要重试
    raise
except RateLimitError:
    # 降速后重试
    ...
```

::: warning BillingError 不是认证错误
它继承自一个独立的异常分支。捕获 `AuthError` 抓不到它——这是刻意的设计，
防止把「该充值」误判成「该改签名」。
:::

## 产品码解包

上游把业务体包在 `<产品码>Data` 里，产品码各端点不同：

```python
from elecredit import product_payload, detect_product_code

raw = client.query("judicial", raw=True, entityName="贵州茅台")  # 完整信封
product_payload(raw)              # 自动探测产品码 → 内层业务体
product_payload(raw, "P0030089")  # 精确指定
detect_product_code(raw)          # "P0030089"，可与注册表比对发现上游改码
```

- **不传产品码时按结构探测**（匹配 `^P\d+Data$`），上游换码也不会失效。
- 未命中返回 `{}`，**永不抛异常**；`resultData` 是 JSON 字符串时也照样解。

## 司法数据汇总

`D11` 的 `type` 是**单值**，不支持逗号多选。要按类型取明细只能逐类型扇出（12 次调用）。
`judicial_summary` 是这个扇出的第一步——**1 次调用**拿到「各类型有多少条 / 多少页」：

```python
from elecredit import judicial_summary

s = judicial_summary("恒大地产集团有限公司")
s["totalCount"]            # 52713
s["totalPage"]             # 5272
s["types"]["ktgg"]         # {"count": 16723, "pages": 1673}
s["types"]["pccz"]         # {"count": 0, "pages": 0}
s["meta"]                  # 原始 detailListMeta，未识别字段不丢
```

`types` **恒定包含 12 项**：上游对无数据的类型可能返回空串、也可能整个键缺失，两种都归一为 0；
计数在上游是字符串，这里统一为 `int`。查无司法数据（业务码 `001`）返回全 0 汇总，**不抛异常**。

## 多类型明细扇出

`judicial_all` 把「每个非空类型都有代表记录」的编排包好了：

```python
from elecredit import judicial_all

r = judicial_all("恒大地产集团有限公司")
r["calls"]              # 7 = 1 次汇总 + 6 个「有数据」的类型各 1 页
r["byType"]["ktgg"]     # 该类型取到的记录列表
r["fetched"]            # {"ktgg": 20, ...} 各类型实际取到的条数（已去重）
r["truncated"]          # True = 有类型没取全
r["errors"]             # 单类型失败只记录，不影响其它类型
```

- **省调用**：先读 `detailListMeta`，计数为 0 的类型直接跳过。
- **自动夹紧页数**：按该类型总页数收敛，避免 `pageNo` 超界返回 `999 系统异常`。
- **跨类型按 `entryId` 去重**（实测同类型同页里就会出现重复记录）。
- ⚠️ **计费**：每次分页都是一次计费调用，`max_pages` 会成倍放大（上限 100）。
- `concurrency=1`（默认）串行；>1 用线程池，注意限流 `SYS008` 与计费峰值。

## CLI

SDK 同时安装一个 CLI（命令是**扁平**的，不是 `enterprise xxx`）：

```bash
pip install elecredit

elecredit capabilities                       # 列出 10 个端点元数据
elecredit fuzzy --ent-name 贵州茅台
elecredit bidding --ent-info 贵州茅台
elecredit actual-controller --ent-info 国家电网有限公司
elecredit graph --ent-info 贵州茅台 --level 2 --output graph.json
elecredit xgbzxr --pers-name 许家印 --id-no 110101195804261234
```

## 测试

```bash
cd sdk
pytest tests/ -v                          # 单元测试（纯 mock，不需要凭据）
python -m elecredit.signature             # 签名黄金样本自测
ruff check elecredit/ tests/              # lint
```

## 相关

- [凭据配置](./authentication) —— `.env` 与探测优先级
- [D11 司法查询](../api/judicial) —— 扇出策略的端点侧细节
