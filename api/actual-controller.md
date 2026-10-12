---
bizId: P0020019
endpoint: /saic/SaicinvWh
---

# P0020019 实控人（法人 / 股东穿透）

```text
POST /saic/SaicinvWh
```

返回企业实际控制人及其穿透链路。比 [F09 股权图谱](./graph) 轻——**只要结论不要全图**时用它。

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entInfo` | body | string | **是** | 企业名称 / 统一社会信用代码 |

:::: danger 路径大小写敏感：必须是小写 w
- ✅ `/saic/SaicinvWh`
- ❌ `/saic/SaicInvWh`（大写 `W`）

写成大写 `W` 会返回 **`SYS044 资源不存在`**——与「路径真的不存在」**同码**，极易误判成路由问题。

历史上曾有提交把大小写「修」反，端点因此长期打不通。
::::

:::: warning 参数名必须是 `entInfo`
传 `entName` 会返回 `400 企业信息不能为空`。
当年正是被这个 400 误导，才以为是大小写问题。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
elecredit enterprise actual-controller --ent-info 国家电网有限公司 --format json
```

```bash [Python CLI]
elecredit actual-controller --ent-info 国家电网有限公司
```

```python [Python SDK]
client.actual_controller(ent_info="国家电网有限公司")
```

:::

## 响应

`resultData` 顶层键为 `<产品码>Data` / `<产品码>Status`（产品码 `P0020019`）。

参考实测：

| 请求 body | 返回 |
|---|---|
| `{"entInfo":"国家电网有限公司"}` | `code=000` 查询成功 |
| `{"entInfo":"贵州茅台"}` | `code=001` 查询成功无结果 |

::: warning 内部字段结构尚未细化
`resultData` 顶层键已实测，内部字段当前**按原样透传**，待补字段级契约。
解析时只依赖 `P0020019Data` 这一层，不要假想更深的结构。
::::

## 排错速查

| 现象 | 根因 |
|---|---|
| `SYS044 资源不存在` | 路径写成了 `SaicInvWh`（大写 W） |
| `400 企业信息不能为空` | 参数名写成了 `entName` |
| `001 查询成功无结果` | 正常业务响应，该企业无实控人穿透结果 |

## 相关

- [F09 企业股权图谱](./graph) —— 需要完整穿透树时用它
- [B04 招投标信息](./bidding) —— 同样必须用 `entInfo` 的端点
