# 部署

## 本地开发

```bash
pnpm install
pnpm dev
```

生产检查：

```bash
pnpm lint
pnpm build
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
