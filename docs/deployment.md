# 本地运行与部署

## 先理解三个概念

- **GitHub 仓库**：网上保存的项目代码。
- **克隆（Clone）**：把仓库下载成电脑上的项目文件夹。本地运行前必须完成这一步。
- **终端**：输入命令的窗口。下面以 Windows PowerShell 为例。

本项目不需要数据库。不开启 AI 时，也不需要 API Key。

## Windows 新手流程（推荐）

### 1. 安装必要工具

安装以下两个程序：

- [Node.js 20 LTS 或更高版本](https://nodejs.org/)。使用官网的 LTS 安装包，保持默认选项。
- [GitHub Desktop](https://desktop.github.com/)。安装后登录 GitHub 账号。

安装 Node.js 后，打开 PowerShell，输入：

```powershell
node --version
corepack --version
```

两条命令都能显示版本号，就可以继续。若 `corepack` 不可用，请重新安装 Node.js LTS，并勾选安装程序中的默认选项。

### 2. 从 GitHub 克隆项目

打开 [Japanese Lyric Lab 仓库](https://github.com/Domii17/Japanese-lyric-lab)：

1. 点击绿色 **Code** 按钮。
2. 选择 **Open with GitHub Desktop**。
3. GitHub Desktop 打开后，确认 **Local Path** 是你想保存项目的位置。
4. 点击 **Clone**，等待下载完成。
5. 点击 GitHub Desktop 的 **Open in Visual Studio Code** 或 **Open in PowerShell**。

完成后，你电脑上会出现一个名为 `Japanese-lyric-lab` 的文件夹。后续命令都要在这个文件夹中执行。

### 3. 安装依赖并启动

在项目文件夹打开 PowerShell，逐行运行：

```powershell
corepack enable
pnpm install
pnpm dev
```

第一次 `pnpm install` 需要下载依赖，等待它完成即可。看到类似下面的提示，说明网站已经启动：

```text
Ready in ...
Local: http://localhost:3000
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。终端窗口必须保持打开；停止网站时回到终端按 `Ctrl + C`。

### 4. 日常再次启动

项目已经克隆并安装过依赖后，以后只需要：

```powershell
cd "你的项目路径\Japanese-lyric-lab"
pnpm dev
```

然后再次打开 `http://localhost:3000`。

## 命令行克隆（可选）

不使用 GitHub Desktop 时，也可以先安装 Git，再运行：

```powershell
git clone https://github.com/Domii17/Japanese-lyric-lab.git
cd Japanese-lyric-lab
corepack enable
pnpm install
pnpm dev
```

## 开启 AI（可选）

基础分词、假名和罗马音不需要 AI。只有想使用“释义和解析”时，才需要配置服务商 API。请先完成上面的本地启动，再阅读 [AI 配置说明](ai-configuration.md)。API Key 只放在本地 `.env.local` 或部署平台的服务端环境变量中，不要填进网页，也不要提交到 GitHub。

## 运行生产检查

提交代码前，可以在项目文件夹运行：

```powershell
pnpm lint
pnpm build
```

本地模拟生产服务：

```powershell
pnpm start
```

## Vercel

1. Fork `Domii17/Japanese-lyric-lab`。
2. 在 Vercel 选择 **Add New Project**，导入仓库。
3. Framework 选择 Next.js，构建命令和输出目录保持默认。
4. 只使用基础功能时，不配置 AI 环境变量。
5. 启用 DeepSeek 时，在 **Settings → Environment Variables** 添加：

```text
AI_FEATURE_ENABLED=true
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_MODEL=deepseek-chat
```

6. 修改环境变量后重新部署。

部署后检查首页、`/api/analyze`、歌词搜索、AI 解析和 PNG 导出。

## 公开部署建议

- 设置 DeepSeek/OpenAI 的月度消费上限。
- 使用 Redis 或其他共享存储替换进程内限流。
- 在“关于本站”中补充运营者信息和版权投诉联系方式。
- 不要把 `.env.local`、生产日志或 API Key 提交到仓库。
