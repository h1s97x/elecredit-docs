# 快速开始

目标：**五分钟内发出第一个请求，并正确理解它的返回值**。

## 第 1 步：拿到凭据

前往 <https://api.elecredit.com/admin> 获取一对凭据：

- **App ID**
- **App Key**

::: warning 不是单一 API Key
Elecredit 用的是 **App ID + App Key 二元组**。只配一个是不生效的。
:::

## 第 2 步：配置到环境变量

```bash
export ELECREDIT_APP_ID=<你的 App ID>
export ELECREDIT_APP_KEY=<你的 App Key>
```

两个变量**同时存在**才视为已配置。Node CLI 与 Python SDK 都读这两个变量。

::: danger 凭据安全纪律
不要把 App Key 写进代码、命令参数、日志、公开配置或 Git 提交。
需要持久化时用 `.env` 文件（并确保它已被 `.gitignore` 忽略），或用 Node CLI 的 `elecredit auth login` 写入系统钥匙环。
:::

## 第 3 步：发第一个请求

::: code-group

```bash [Node.js CLI]
# 查一下贵州茅台的工商信息
elecredit enterprise fuzzy --ent-name 贵州茅台 --format json
```

```python [Python SDK]
# 零安装即可跑（纯标准库模式）
import sys; sys.path.insert(0, "sdk")
from elecredit import ElecreditClient

client = ElecreditClient.from_env()
print(client.fuzzy(ent_name="贵州茅台"))
```

```bash [curl / REST]
# 需要自己算签名，见下节
```

:::

## 第 4 步：看懂第一个响应

如果你账户还没充值，最可能看到的是：

```json
{ "code": "SYS005", "msg": "余额不足" }
```

**这不是失败。** 它证明了三件事：

1. 你的 `App ID` 存在且被识别；
2. 你的**签名算法完全正确**；
3. 网关可达、请求格式合法。

充值后同一段代码直接返回真实数据。把 `SYS005` 当成认证错误去反复改签名，是新人最常见的无效排错。

反过来，如果你看到的是 `SYS001 签名校验失败`，那才需要去查[签名算法](./signature)。

充值后成功响应长这样：

```json
{
  "code": "000",
  "msg": "查询成功",
  "orderNo": "a14eb808e0c245f4b15c1123b0e2265b",
  "resultData": {
    "P0010068Status": "1",
    "P0010068Data": { "resultList": [] }
  }
}
```

其中 `code` 为 `001` 时表示**查询成功但无结果**——也是正常业务响应，不是错误。

## 第 5 步：取到内层业务数据

上游会把业务体再包一层：`resultData = { "<产品码>Status", "<产品码>Data" }`，**产品码每个端点都不同**。

Python SDK 提供自动探测，上游换码也不会失效：

```python
from elecredit import product_payload

raw = client.query("fuzzy", raw=True, entName="贵州茅台")  # 完整信封
product_payload(raw)              # 自动探测产品码 → 内层业务体
product_payload(raw, "P0010068")  # 也可精确指定
```

别的语言按 `resultData["<产品码>Data"]` 自行取，产品码对照表见 [API 参考总览](../api/#resultdata-包裹结构与产品码)。

## 下一步

| 我想…… | 去哪 |
|---|---|
| 搞懂签名为什么报 SYS001 | [签名算法](./signature) |
| 换一种凭据来源（钥匙环 / .env） | [凭据配置](./authentication) |
| 查某个端点的参数 | [API 参考](../api/) |
| 拿一份可用的 CLI 配置 | [Node.js CLI](./node-cli) |
| 处理各种错误码 | [错误码](./errors) |
