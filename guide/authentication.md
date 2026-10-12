# 凭据配置

Elecredit 的凭据是 **App ID + App Key 二元组**，从 <https://api.elecredit.com/admin> 获取。

唯一要求：**两个值必须同时存在**才算已配置。只配其一视同未配置。

## 各客户端的探测顺序

::: code-group

```text [Python SDK]
1. ElecreditClient(app_id=..., app_key=...)   显式传参，优先级最高
2. 环境变量 ELECREDIT_APP_ID + ELECREDIT_APP_KEY
3. .env 文件：./.env 或 ~/.elecredit/.env（需 python-dotenv，自动加载）
```

```text [Node.js CLI]
1. 环境变量 ELECREDIT_APP_ID + ELECREDIT_APP_KEY
2. 系统钥匙环（Keychain / Credential Manager / Secret Service）
```

:::

Node CLI 中**环境变量优先于钥匙环**。全部缺失时 CLI 输出 `ELECREDIT_AUTH_REQUIRED` 并以**退出码 3**结束。

## 方式一：环境变量（推荐）

适用于 CI、容器、以及任何需要显式注入凭据的场景。

```bash
export ELECREDIT_APP_ID=<你的 App ID>
export ELECREDIT_APP_KEY=<你的 App Key>
```

## 方式二：`.env` 文件（仅 Python SDK）

Python SDK 会自动加载 `./.env` 或 `~/.elecredit/.env`：

```bash
# .env
ELECREDIT_APP_ID=<你的 App ID>
ELECREDIT_APP_KEY=<你的 App Key>
```

::: danger 必须加入 .gitignore
`.env` 一旦被提交就是生产凭据泄漏。请在 `.gitignore` 中加入 `.env`，并在提交前用 `git status` 确认它没有被暂存。
:::

## 方式三：系统钥匙环（仅 Node CLI）

把凭据写进操作系统凭据库，不进环境变量、不进磁盘明文：

```bash
# 写入（不回显值）
elecredit auth login --app-id <App ID> --app-key <App Key>

# 查看凭据来源（只报告是否已配置，不显示值）
elecredit auth status --format json

# 删除
elecredit auth logout
```

::: warning 容器里可能不可用
无 Secret Service 的 Linux 容器中，`auth status` 会带 `keyringError` 字段提示。
此时请改用环境变量。
:::

## 各语言最小配置示例

::: code-group

```bash [Node.js CLI]
export ELECREDIT_APP_ID=<App ID>
export ELECREDIT_APP_KEY=<App Key>
elecredit auth status --format json   # 确认来源
```

```python [Python SDK]
# 显式传参（不读环境，适合多租户服务）
from elecredit import ElecreditClient
client = ElecreditClient(app_id="...", app_key="...")

# 或从环境变量
client = ElecreditClient.from_env()
```

```bash [REST 直连]
# 凭据不进 URL、不进 body，只用于本地算签名（见「签名算法」）
export ELECREDIT_APP_ID=<App ID>
export ELECREDIT_APP_KEY=<App Key>
```

:::

## 仓库根目录的 `.env.example`

代码仓库根目录提供了一份 `.env.example` 作为变量名的事实源；复制为 `.env` 后填入真实值即可：

```bash
cp .env.example .env
```

## 安全纪律

- **不得复述** `App Key`：不打印、不写日志、不进报错信息。
- **不得写入**命令参数、代码、公开配置或 Git 提交。
- 需要展示凭据状态时，只报告**来源**（环境变量 / 钥匙环）与**是否存在**，不报告值。
- 用户主动提供凭据时，直接使用，不复述。
