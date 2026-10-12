---
bizId: D14
endpoint: /litigation/xgbzxrPeople/wh
---

# D14 限制高消费人员查询

```text
POST /litigation/xgbzxrPeople/wh
```

按姓名 + 身份证号查询某人是否为限制高消费人员（限消令）。
限消对象包括自然人、法定代表人、主要负责人等。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `persName` | body | string | **是** | 姓名 |
| `idNo` | body | string | **是** | 身份证号（18 位，**精确匹配**） |

:::: warning 两个参数都是必填且要精确
这是**按人**而非按企业的端点：姓名与身份证号必须同时给，
且身份证号需要**完整 18 位**（返回时会脱敏展示，但查询时不能省）。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit litigation xgbzxr --pers-name 许家印 --id-no 110101195804261234 --format json
```

```bash [Python CLI]
elecredit xgbzxr --pers-name 许家印 --id-no 110101195804261234
```

```python [Python SDK]
client.xgbzxr(pers_name="许家印", id_no="110101195804261234")
```

:::

## 响应字段

`resultData`（产品码 `P1020054`）为限消记录列表，单条包含：

| 字段 | 类型 | 说明 |
|---|---|---|
| `persName` | string | 被限消人姓名 |
| `idNo` | string | 身份证号（**脱敏展示**，中间 8 位隐藏） |
| `execCourtName` | string | 执行法院 |
| `execCaseNum` | string | 执行案号 |
| `createTime` | string | 限消令发布时间 |
| `publishStatus` | string | 发布状态 |
| `businessEntity` | string | 关联企业（如法定代表人被限消） |

::: danger 身份证号属于个人信息
返回体里是脱敏的，但你传入的是完整号码。
不要在日志、对话或前端 bundle 里留存完整身份证号与查询结果。
::::

## 相关

- [D11 司法查询](./judicial) —— 按企业查司法数据
- [API 参考总览](/api/)
