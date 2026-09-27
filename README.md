# Hits Badge

English | [简体中文](README.zh-CN.md)

SVG request-count badges for GitHub READMEs and websites, powered by Cloudflare Workers + Durable Objects or Node.js + Redis.

The count represents valid badge GET requests received by the service. GitHub's [Camo image proxy and cache](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls) may combine requests. This is not an exact page-view or unique-visitor count; repeated requests also count.

## Usage

Open your deployment's home page to generate a badge, preview it, and copy the Markdown, or use:

```markdown
![hits](https://hits.aprilnea.com/hits?url=https%3A%2F%2Fgithub.com%2FAprilNEA%2Fhits&v=2)
```

Replace the service address when self-hosting. Encode the entire target `url`, especially when it contains `?`, `&`, or `#`; `URLSearchParams` can build the query string.

| Parameter | Description |
| --- | --- |
| `url` | URL to count, up to 2048 characters; `v=2` accepts only HTTP(S) URLs without credentials; the target page is not fetched |
| `v` | `1` (default) preserves legacy counting rules; `2` uses a separate counter |
| `label` | Left-hand badge text, default `hits`; up to 64 UTF-16 code units, with no control characters |
| `color` | Text color, default `#fff` |
| `leftBgColor` / `rightBgColor` | Left/right background colors, default `#555` / `#2f3136` |
| `border` | `rounded` (default) or `square` |
| `format` | `full` (default) displays the full number; `compact` abbreviates it as `1.2k`, `1M`, etc. |
| `maxUnit` | `auto` (default) selects the unit automatically; `k` caps the unit at thousands; applies only to `format=compact` |
| `preview=true` | Reads the current count without incrementing it |

`format=compact` rounds to at most one decimal place, for example `1200` → `1.2k` and `1000000` → `1M`. Formatting affects only the display; stored counts, SVG titles, and accessibility labels retain the exact value.

To keep large numbers in thousands, add `format=compact&maxUnit=k`: `1000000` → `1000k`, `1234567` → `1234.6k`. Values below `1000` remain unchanged.

Colors accept 3-, 4-, 6-, or 8-digit hexadecimal values prefixed with `#`, and basic CSS color names. Encode `#` as `%23` in query strings. `HEAD /hits` and home-page previews do not increment the count. `GET /healthz` checks process liveness, not storage health. Invalid parameters return `400`; storage failures return `503` rather than a misleading count of `0`.

### Legacy links and data

Links without `v` retain the historical behavior: URLs are lowercased, queries are ignored, and fragments are preserved. Redis also retains collisions caused by legacy key normalization. Existing counts are preserved, but these rules cannot distinguish some pages.

Use `v=2` for new links: standard URL parsing preserves path case and query order and values, while removing fragments. Different badge styles share the same counter. `v=2` starts from zero and does not automatically copy or merge `v=1` data, avoiding duplicate allocation of totals caused by historical collisions. The two deployment backends store their data independently.

Counts are retained indefinitely by default. The application does not record visitor IPs, cookies, or visitor profiles. URLs and counts are stored, and hosting providers or reverse proxies may retain request logs. Do not include tokens or personal information in URLs. Public deployments still need rate limiting and alerts at the ingress.

## Local development and checks

Requires Node.js 24 and pnpm 10.33.4:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` runs local Workers + Durable Objects. Open the address printed in the terminal; no Cloudflare login is required.

Node.js + Redis requires a running Docker service with Compose. **For an existing Redis volume, complete the RDB → AOF migration in the [upgrade guide (Chinese)](docs/deployment.md#升级已有-redis-数据卷) before running the startup commands:**

```bash
docker compose -f docker-compose.dev.yml up -d --wait
cp .env.example .env
pnpm dev:node
```

The home page is at `http://localhost:8787`. Redis binds only to `127.0.0.1:8786`.

```bash
pnpm check
pnpm check:worker
TEST_REDIS_URL=redis://127.0.0.1:8786 pnpm test:redis
```

`check` runs formatting checks, linting, type checking, unit tests, and the Node.js build. `check:worker` bundles without deploying. `test:redis` verifies concurrency and legacy data compatibility against real Redis.

See the [operations guide (Chinese)](docs/deployment.md) for deployment, reverse proxies, upgrades, and backup and recovery.

## License

MIT
