# 部署与运维

## 升级已有 Redis 数据卷

旧版 Compose 的 `REDIS_ARGS` 没有启用 AOF，旧卷可能只有 `dump.rdb`。**不要直接用新版 `--appendonly yes` 启动旧卷，否则 Redis 可能跳过 RDB，显示空计数。** 在旧 Redis 仍运行、已保留备份时，先执行：

```bash
docker compose exec cache redis-cli CONFIG SET appendonly yes
docker compose exec cache redis-cli INFO persistence
```

开发环境对这两条命令使用 `docker compose -f docker-compose.dev.yml exec ...`。重复检查 `INFO persistence`，直到同时出现 `aof_enabled:1`、`aof_rewrite_in_progress:0`、`aof_rewrite_scheduled:0`、`aof_last_bgrewrite_status:ok`、`aof_last_write_status:ok`；完成前不要停止或重建旧容器。

确认 AOF 已写好后，才停止旧容器并使用新 Compose 配置启动，再核对已知计数。新配置的启动参数会持续启用 AOF；无需执行 `CONFIG REWRITE`，默认镜像没有可重写的配置文件。旧容器已停止时，应先用原镜像和原启动配置加载 RDB，再按上述步骤迁移。[Redis 官方 RDB 转 AOF 指南](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/#how-i-can-switch-to-aof-if-im-currently-using-dumprdb-snapshots)

## Cloudflare Workers

仓库的 `wrangler.jsonc` 用于全新部署，创建 SQLite Durable Objects。修改 Worker 名称后执行：

```bash
pnpm exec wrangler login
pnpm deploy
```

**升级已有 Worker 时，先恢复原部署配置。** 保留原 Worker 名称、`COUNTERS` 绑定、`CloudflareCounter` 类名、命名空间和完整 `migrations` 历史；不要将本仓库的新部署 `exports` 直接覆盖到旧配置。已有 KV namespace 不能直接改为 SQLite。原 `wrangler.toml` 未被纳入版本控制，可显式使用 `pnpm exec wrangler deploy --config wrangler.toml`。[Cloudflare 部署与存储说明](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)

首页使用 React + Base UI，由服务端渲染并在浏览器中激活交互。旧 Wrangler 配置还需添加 `build.command = "pnpm build:client"` 和 `assets.directory = "./dist/public"`，以构建和部署页面的 JavaScript、CSS；开发时可将 `build.watch_dir` 设为 `["src/ui", "esbuild.config.ts"]`。

## Docker + Redis

全新部署可直接启动；已有卷须先完成「升级已有 Redis 数据卷」中的 AOF 迁移，不能跳过旧容器中的 `CONFIG SET` 和重写状态检查。

```bash
docker compose up -d --build --wait
```

访问 `http://localhost:8787`。应用端口仅绑定本机，公开服务应通过反向代理配置 HTTPS；在宿主环境或 `.env` 中设置 `PUBLIC_ORIGIN=https://hits.example.com`，首页就会生成正确的公开 HTTPS 徽章地址。该值只包含协议、主机和可选端口，不带路径；未设置时使用请求地址。Node.js 本地开发同样支持 `.env` 中的 `PUBLIC_ORIGIN`；Workers 可将其配置为 Wrangler `vars`。Redis 不暴露宿主端口。镜像只包含生产依赖，以非 root 用户运行。

Compose 项目名决定实际卷名前缀，不要随意更改已有部署的项目名。Redis 启用 AOF、每秒同步并保留原 `hits_redis_data` 卷名。异常断电仍可能丢失约 1 秒写入，数据卷也不能替代备份。升级 Redis 前先备份，并在副本上验证版本兼容。

### 备份与恢复

冷备份整个 Redis 数据目录（期间服务停止）。以下流程适用于已经完成上述 AOF 迁移的卷；仍仅有 RDB 的旧实例应先完成在线迁移，才能在备份后用新版配置重启：

```bash
mkdir -p backups
docker compose stop app cache
docker compose run --rm --no-deps --entrypoint sh -v "$PWD/backups:/backup" cache -c 'tar -czf /backup/redis-data.tgz -C /data .'
docker compose up -d --wait
```

将归档复制到异机保管。恢复时，在隔离的 Compose 项目和**空数据卷**中解压，再启动并核对已知计数；保留原卷直到确认恢复成功。以下归档必须包含迁移后的完整 AOF；只有 RDB 的旧备份须先用原配置恢复并完成上面的在线迁移，才能使用新版配置启动：

```bash
docker compose -p hits-restore run --rm --no-deps --entrypoint sh -v "$PWD/backups:/backup:ro" cache -c 'tar -xzf /backup/redis-data.tgz -C /data'
```

启动恢复项目前先停止占用 `8787` 端口的实例，再运行 `docker compose -p hits-restore up -d --build --wait`。不要对存量部署执行 `down -v`。
