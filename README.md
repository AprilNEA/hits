# Hits Badge

一个轻量级的访问计数徽章服务，可以轻松地为你的项目添加访问统计。基于 Cloudflare Workers 构建，使用 Hono 框架开发。

## 使用方法

在你的 README.md 或任何支持 Markdown 的地方添加以下代码：

```markdown
![hits](https://your-worker-url.workers.dev/hits?url=https://github.com/your-username/your-repo)
```

将 `your-worker-url.workers.dev` 替换为你部署的 Workers 地址，`url` 参数替换为你想要统计的页面 URL。

## 特性

- 🚀 基于 Cloudflare Workers，超快的响应速度
- 🔒 使用 Durable Objects 确保计数准确性
- 🎨 简洁美观的徽章设计
- 🔄 实时更新，无缓存
- 🛠 使用 TypeScript 开发，类型安全

## 部署

1. 克隆仓库：
```bash
git clone https://github.com/your-username/hits.git
cd hits
```

2. 安装依赖：
```bash
bun i
```

3. 开发环境运行：
```bash
bun dev
```

4. 部署到 Cloudflare Workers：
```bash
bun run deploy
```

## 技术栈

- [Hono](https://hono.dev/) - 轻量级的 Web 框架
- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/) - 分布式存储
- [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) - 请求验证
- [unstorage](https://github.com/unjs/unstorage) - 统一存储接口

## 许可证
MIT

## 示例

![hits](https://hits.yunyoujun.cn/hits?url=https://github.com/yunyoujun/hits)

