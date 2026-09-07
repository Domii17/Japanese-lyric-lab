# 歌词拆解 Japanese Lyric Lab

面向日语初学者的开源歌词学习工具。输入日语歌词或普通文本后，可获得逐词切分、平假名和罗马音对照；AI 释义与语法解析仅在自行部署并配置 API Key 后启用。

## 功能

- Kuromoji 日语形态分析与词性识别
- Kuroshiro 平假名和 Hepburn 罗马音转换
- 助词 `は / へ / を` 的实际发音修正
- 数字读音、常见旧字形和不可见字符兼容
- TXT 文件导入
- LRCLIB 歌词搜索与导入
- 多句选择并导出高清 PNG
- 可选 DeepSeek 或 OpenAI 释义与语法解析
- 不设置用户数据库，不保存输入文本和解析结果

## 两种部署方式

| 模式 | 基础拆解 | AI 解析 | API 费用 |
| --- | --- | --- | --- |
| 公共基础站 | 可用 | 不配置 | 无 |
| 自行部署 | 可用 | 配置后可用 | 由部署者自己的 API 账户承担 |

未配置服务端 API Key 时，页面不会显示“释义和解析”开关。项目不要求访问者在网页中填写任何密钥。

## 本地运行

需要 Node.js 20 或更高版本，以及 pnpm。

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。不创建 `.env.local` 也可以使用全部基础功能。

## 自行配置 AI

复制环境变量示例：

```powershell
Copy-Item .env.example .env.local
```

DeepSeek 配置：

```text
AI_PROVIDER=deepseek
AI_FEATURE_ENABLED=true
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
```

OpenAI 配置：

```text
AI_PROVIDER=openai
AI_FEATURE_ENABLED=true
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-5-mini
```

修改环境变量后需重新启动开发服务器。API Key 只由服务端路由读取；请勿使用 `NEXT_PUBLIC_` 前缀，也不要提交 `.env.local`。

## 部署到 Vercel

1. Fork 或导入此 GitHub 仓库。
2. 在 Vercel 中选择 **Add New Project** 并导入仓库。
3. 保持框架为 Next.js，使用仓库中的默认构建设置。
4. 仅部署公共基础站时，不添加任何 AI 环境变量；也可设置 `AI_FEATURE_ENABLED=false` 强制关闭 AI。
5. 部署个人 AI 版本时，在 Vercel 项目的 **Settings → Environment Variables** 中添加上面的服务端变量。
6. 可选添加 `REPOSITORY_URL=https://github.com/你的用户名/仓库名`，在未启用 AI 的站点顶部显示源码入口。
7. 部署后测试 `/api/analyze`、歌词搜索、图片导出和移动端布局。

真实密钥不应写入 `vercel.json`、README、截图或 Git 提交。Vercel 环境变量修改后需要重新部署才会生效。

## AI 与隐私边界

- 基础拆解会把输入文本发送到当前部署的 `/api/analyze`，由服务器内的 Kuromoji 处理，不调用大模型。
- 歌词搜索会把歌名或歌手发送给 iTunes Search API 和 LRCLIB。
- 只有部署者配置了 AI，并且用户主动点击“全句解析”时，对应单句和词元才会发送给所选 AI 服务。
- 项目不包含用户 API Key 输入界面，不会把服务端密钥发送到浏览器。
- 项目当前使用进程内限流，适合个人部署和低流量使用；公开高流量实例应改用 Redis 等共享限流，并设置供应商消费上限。

## 歌词与版权

本项目不附带完整的受版权保护歌词，也不建立歌词数据库。歌词由用户输入或从第三方 LRCLIB 临时获取，相关文字、歌曲和录音的权利归各自权利人所有。部署者应提供版权投诉、纠错和下架渠道，并遵守所在地法律及第三方服务条款。

## 技术栈与数据来源

- Next.js、React、TypeScript
- Kuromoji、Kuroshiro
- LRCLIB：歌词结果
- iTunes Search API：模糊歌曲名称发现
- DeepSeek 或 OpenAI：自行部署后的可选增强

## 贡献与安全

提交改动前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。发现安全问题请参考 [SECURITY.md](SECURITY.md)，不要在公开 Issue 中提交密钥或用户数据。

## 许可证

代码采用 [MIT License](LICENSE)。歌词、歌曲名称、第三方数据和商标不因本项目的代码许可证而改变其原有权利归属。
