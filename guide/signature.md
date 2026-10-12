# 签名算法

Elecredit 的签名**放 HTTP Header，不放请求体**。算法本身只有一行，但**序列化细节**决定成败。

## 算法

```
sn        = uuid4().hex                              # 32 位随机，无连字符
ts        = str(int(time.time() * 1000))             # 毫秒时间戳，字符串
body      = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
signStr   = sn + ts + body + appKey                  # 字符串直接拼接
signature = MD5(signStr.encode("utf-8")).hexdigest() # 小写 32 位 hex
```

请求头：

```
Content-Type: application/json
app-id:        <appId>
timestamp:     <ts>
request-sn:    <sn>
signature:     <md5_hex>
sign-type:     MD5
```

## 三个必须对齐的细节

:::: warning 一、body 必须是**紧凑 JSON**
`separators=(",", ":")`——即 `{"entName":"贵州茅台"}`，不是 `{"entName": "贵州茅台"}`。

**多一个空格就签名失败**，因为签名是对**原始字节**算的，序列化结果不一样，哈希就不一样。
::::

:::: warning 二、中文**不转义**
必须用 `ensure_ascii=False`。默认的 `ensure_ascii=True` 会把 `贵州茅台` 变成 `\u8d35\u5dde...`，
签出来必然对不上。
::::

:::: warning 三、时间戳是**毫秒**
`str(int(time.time() * 1000))`，13 位数字字符串。用秒级时间戳会触发 `SYS002 请求过期`。
::::

## 黄金样本（生产环境已验证）

用下面这组值做自测，是验证「你的签名实现是否正确」的最快方式：

```
body      = {"entName":"贵州茅台"}
signStr   = sn + ts + body + appKey
signature = MD5(signStr).hex()

# 凭据正确时，生产返回 SYS005 余额不足 → 说明签名正确
```

::: tip 为什么 SYS005 能证明签名对
网关是**先验签、后扣费**。`SYS005` 意味着请求已经通过了签名校验，
只是账户余额不足。所以拿到 `SYS005` 就说明签名算法、凭据、序列化**全部正确**。
:::

## 参考实现

::: code-group

```python [Python]
import hashlib, json, time, uuid

def build_headers(payload: dict, app_id: str, app_key: str) -> dict:
    sn = uuid.uuid4().hex
    ts = str(int(time.time() * 1000))
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    sign_str = sn + ts + body + app_key
    signature = hashlib.md5(sign_str.encode("utf-8")).hexdigest()
    return {
        "Content-Type": "application/json",
        "app-id": app_id,
        "timestamp": ts,
        "request-sn": sn,
        "signature": signature,
        "sign-type": "MD5",
    }, body
```

```ts [TypeScript / Node.js]
import { createHash, randomUUID } from 'node:crypto';

export function buildSignedRequest(payload: unknown, appId: string, appKey: string) {
  const sn = randomUUID().replace(/-/g, '');
  const ts = String(Date.now());
  // JSON.stringify 默认就是紧凑 JSON，且不会转义中文
  const body = JSON.stringify(payload);
  const signature = createHash('md5').update(sn + ts + body + appKey, 'utf8').digest('hex');
  return {
    body,
    headers: {
      'Content-Type': 'application/json',
      'app-id': appId,
      timestamp: ts,
      'request-sn': sn,
      signature,
      'sign-type': 'MD5',
    },
  };
}
```

```bash [curl]
# 需要先用上面的算法算出 SN / TS / SIGN
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

## 自测

Python SDK 内置签名黄金样本自测试：

```bash
cd sdk
python -m elecredit.signature    # 退出码 0 = 通过
```

或用 SDK API 直接验证：

```python
from elecredit.signature import verify_golden_sample
print(verify_golden_sample())   # True
```

## 常见签名失败对照

| 现象 | 原因 | 修法 |
|---|---|---|
| `SYS001` 签名校验失败 | body 序列化不一致（多了空格 / 中文被转义 / 键顺序变了） | 用 `separators=(",", ":")` + `ensure_ascii=False`，并确保签名与发送的是**同一个** body 字符串 |
| `SYS002` 请求过期 | 时间戳不是毫秒，或本机时钟漂移 | 用 `int(time.time() * 1000)`；同步本机 NTP |
| `SYS003` 应用 ID 不存在 | `app-id` 与后台不一致 | 核对 App ID 拼写 |
| `SYS004` 签名算法不支持 | `sign-type` 不是 MD5 | Header 固定 `sign-type: MD5` |
| `SYS006` IP 受限 | 出口 IP 不在白名单 | 联系服务商加白 |

::: danger 一个隐蔽的坑：签名与发送用了不同的 body
很多语言里 `json.dumps(obj)` 被调用两次，若中间改动过对象或用了不同参数，
就会「签名对、发送的不对」。正确做法是：**先序列化一次，拿到 `body` 字符串，
既用它算签名，也原样发送它**。
:::

## 相关

- [凭据配置](./authentication) —— App ID / App Key 从哪来、怎么存
- [错误码](./errors) —— `SYS001`~`SYS008` 的完整分类与处置
