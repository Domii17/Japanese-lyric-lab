# AI 配置

AI 是可选功能。基础分词、假名、罗马音和歌词搜索不需要 API Key。

## DeepSeek

### 1. 创建配置文件

```powershell
Copy-Item .env.example .env.local
```

### 2. 填写配置

```env
AI_FEATURE_ENABLED=true
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
```

### 3. 重启服务

```bash
pnpm dev
```

页面出现“释义和解析”开关后，点击句子下方的“全句解析”即可调用 AI。

## OpenAI

```env
AI_FEATURE_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-5-mini
```

## 安全边界

- API Key 只由服务端读取，不使用 `NEXT_PUBLIC_` 前缀。
- 用户不会在网页中填写 API Key。
- 只有用户主动解析的句子会发送到所选 AI 服务。
- 项目内置每个进程每分钟 12 次 AI 请求的简单限流，公开部署建议增加 Redis 限流和供应商消费上限。
- API Key 泄露后应立即在供应商后台撤销并重新生成。
