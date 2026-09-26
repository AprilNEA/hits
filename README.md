# Hits Badge

为 GitHub README 和网站提供 SVG 请求计数徽章，支持 Cloudflare Workers + Durable Objects 或 Node.js + Redis。

计数表示服务收到的有效徽章 GET 请求数。GitHub 的 [Camo 图片代理与缓存](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)可能合并请求；这不是精确的页面 PV 或独立访客 UV，重复请求也会计数。

## 使用

打开部署后的首页生成徽章、预览并复制 Markdown，或直接使用：

```markdown
![hits](https://hits.aprilnea.com/hits?url=https%3A%2F%2Fgithub.com%2FAprilNEA%2Fhits&v=2)
```

自托管时替换服务地址。目标 `url` 必须完整编码，尤其是包含 `?`、`&`、`#` 时；可使用 `URLSearchParams` 生成查询字符串。

| 参数 | 含义 |
| --- | --- |
| `url` | 要计数的 URL，最长 2048 字符；`v=2` 只接受不含用户名密码的 HTTP(S) URL；不抓取该页面 |
| `v` | `1`（默认）保留旧计数规则；`2` 使用独立的新计数器 |
| `label` | 徽章左侧文字，默认 `hits`，最长 64 个 UTF-16 编码单元，不接受控制字符 |
| `color` | 文字颜色，默认 `#fff` |
| `leftBgColor` / `rightBgColor` | 左右背景色，默认 `#555` / `#2f3136` |
| `border` | `rounded`（默认）或 `square` |
| `preview=true` | 只读当前计数，不增加次数 |

颜色支持带 `#` 的 3、4、6、8 位十六进制值和基本 CSS 颜色名，查询字符串中的 `#` 需编码为 `%23`。`HEAD /hits` 和首页预览不增加计数。`GET /healthz` 检查进程存活，不检查存储。无效参数返回 `400`，存储失败返回 `503`，不以 `0` 冒充成功。

### 旧链接与数据

不带 `v` 的旧链接保持历史行为：URL 转小写、忽略 query、保留 fragment；Redis 还保留旧 key 规范化导致的碰撞。已有计数不会清零，但这些历史规则也无法区分部分页面。

新链接推荐 `v=2`：按标准 URL 解析，保留路径大小写、query 顺序与值，去掉 fragment；不同样式共享同一计数。`v=2` 从零开始，不自动复制或合并 `v=1` 数据，避免将历史碰撞产生的总数重复分配。两种部署后端的数据各自独立。

计数数据默认长期保留。应用不记录访客 IP、Cookie 或访客画像；URL 及计数会进入存储，服务商和反向代理可能保留请求日志。不要在 URL 中包含令牌或个人信息。公开服务仍需在入口配置限流和告警。

## 本地开发与检查

需要 Node.js 24、pnpm 10.33.4：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` 使用本地 Workers + Durable Objects，访问终端输出的地址；不需要 Cloudflare 登录。

使用 Node.js + Redis 时需要运行中的 Docker Compose。**已有 Redis 卷必须先按[升级指南](docs/deployment.md#升级已有-redis-数据卷)完成 RDB → AOF 迁移，再执行启动命令：**

```bash
docker compose -f docker-compose.dev.yml up -d --wait
cp .env.example .env
pnpm dev:node
```

首页地址为 `http://localhost:8787`，Redis 仅绑定 `127.0.0.1:8786`。

```bash
pnpm check
pnpm check:worker
TEST_REDIS_URL=redis://127.0.0.1:8786 pnpm test:redis
```

`check` 执行格式、lint、类型、单元测试和 Node.js 构建；`check:worker` 只打包，不发布；`test:redis` 验证真实 Redis 并发和旧数据兼容。

部署、反向代理、旧版本升级及备份恢复见[运维指南](docs/deployment.md)。

## 许可证

MIT
