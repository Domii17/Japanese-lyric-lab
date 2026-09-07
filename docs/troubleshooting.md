# 常见问题

## `pnpm` 或 `corepack` 找不到

请确认终端当前路径是项目文件夹，并先运行：

```powershell
corepack enable
```

如果仍提示找不到 `corepack`，可以直接安装 pnpm：

```powershell
npm install --global pnpm
pnpm --version
```

看到版本号后，再运行 `pnpm install` 和 `pnpm dev`。安装 Node.js 时建议使用官网的 LTS 版本。

## 页面没有出现“释义和解析”

检查：

1. `AI_FEATURE_ENABLED=true`
2. `AI_PROVIDER=deepseek` 或 `openai`
3. 对应 API Key 没有留空
4. 修改 `.env.local` 后已重启服务

## AI 请求失败

常见原因：

- API Key 无效或已撤销
- 供应商账户余额不足
- 模型名称填写错误
- 触发了本地限流
- 部署平台没有重新部署最新环境变量

浏览器不会显示 API Key。请查看部署平台的服务端日志，但不要把密钥粘贴到 Issue 或聊天中。

## 歌词搜索没有结果

歌名和歌手支持模糊匹配，但 LRCLIB 不一定收录所有歌曲。可以直接粘贴歌词，或只填写歌名/歌手中的一个字段。

## 罗马音或切分不理想

日语歌词常有省略、口语、旧字形和专有名词。点击词卡查看原形与词性；遇到可复现的问题，请在 Issue 中提供最小文本和预期读音，不要上传完整受版权保护歌词。
