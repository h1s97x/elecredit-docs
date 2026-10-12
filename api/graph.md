---
bizId: F09
endpoint: /saic/equityPenetration
---

# F09 企业股权图谱

```text
POST /saic/equityPenetration
```

企业全貌图谱：**向下穿透对外投资 + 向上穿透股东链**，递归展开。默认 3 层、5% 持股阈值。

:::: danger 这个端点默认 60 秒超时
深层穿透数据量大，响应可能是几十 MB。
- Node CLI：固定 `timeoutMs: 60_000`
- Python SDK：`graph_timeout` 默认 60s
- REST 直连：客户端超时需设置 ≥ 60s

**不要过早判定请求失败。**
::::

## 请求参数

| 参数 | 位置 | 类型 | 必需 | 说明 |
|---|---|---|---|---|
| `entInfo` | body | string | **是** | 统一社会信用代码 / 注册号 / 企业名称，任一 |
| `level` | body | string | 否 | 递归层数，默认 `3`（Node CLI 限 `^[1-5]$`） |
| `down` | body | boolean | 否 | `true` = 向下穿透对外投资 |
| `up` | body | boolean | 否 | `true` = 向上穿透股东链 |

::: tip 省略 down / up 时默认双向穿透
只想看对外投资就传 `down: true`，只想看股东链就传 `up: true`。
::::

## 调用示例

::: code-group

```bash [Node.js CLI]
# 默认双向 3 层
elecredit enterprise graph --ent-info 贵州茅台

# 只向下穿透对外投资 2 层
elecredit enterprise graph --ent-info 贵州茅台 --level 2 --down

# 大结果落盘
elecredit enterprise graph --ent-info 贵州茅台 --level 4 --output graph.json
```

```bash [Python CLI]
elecredit graph --ent-info 贵州茅台 --level 2 --output graph.json
```

```python [Python SDK]
client.graph(ent_info="贵州茅台", level="2", down=True, up=True)
```

:::

## 响应结构（递归树）

`resultData`（产品码 `P0020023`）为嵌套 JSON 对象：

```json
{
  "entName": "贵州茅台酒股份有限公司",
  "creditCode": "91520300MA6DJXXXX",
  "equityRatio": "100%",
  "downList": [
    { "entName": "XX 销售公司", "equityRatio": "60%", "downList": [] }
  ],
  "upList": [
    { "entName": "中国贵州茅台酒厂（集团）有限责任公司", "equityRatio": "54%", "upList": [] }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `entName` | string | 节点企业名称 |
| `creditCode` | string | 统一社会信用代码 |
| `equityRatio` | string | 持股比例（**字符串**，如 `"54%"`） |
| `downList` | array | 向下穿透的对外投资子树 |
| `upList` | array | 向上穿透的股东链子树 |

## 落盘与后处理

:::: warning 必须落盘
不要把全量 JSON 打印到终端或回显到对话：

```bash
elecredit enterprise graph --ent-info 贵州茅台 --level 4 --output graph.json
```

落盘后只汇报**路径、行数和摘要**。
::::

拿到文件后可自行：

1. 展开成表格：`jq '.. | objects | .entName? // empty' graph.json`
2. 导出 Gephi / Pajek 格式做网络可视化
3. 只取第一层看直接对外投资：`jq '.downList' graph.json`

## 相关

- [A03 工商深度查询](./deep) —— 需要股权出质、司法协助等工商侧信息时用它
- [P0020019 实控人](./actual-controller) —— 只要结论（实控人）而非完整图谱
