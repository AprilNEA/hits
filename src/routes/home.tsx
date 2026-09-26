import { Hono } from "hono";
import { html } from "hono/html";
import { BadgeQuery } from "./hits";

export default function createHome(publicOrigin?: string) {
	return new Hono().get("/", (c) => {
		const values = c.req.query();
		const submitted = values.url !== undefined;
		const query = BadgeQuery.safeParse({ ...values, v: "2" });
		let badgeUrl: URL | undefined;
		let previewUrl: URL | undefined;
		if (submitted && query.success) {
			badgeUrl = new URL("/hits", publicOrigin ?? c.req.url);
			badgeUrl.search = new URLSearchParams({
				url: query.data.id.url,
				v: "2",
				...query.data.style,
			}).toString();
			previewUrl = new URL(badgeUrl);
			previewUrl.searchParams.set("preview", "true");
		}
		c.header("Cache-Control", "no-store");
		return c.html(
			html`<!doctype html>${(
				<html lang="zh-CN">
					<head>
						<meta charset="utf-8" />
						<meta
							name="viewport"
							content="width=device-width, initial-scale=1"
						/>
						<title>Hits · GitHub 计数徽章</title>
						<style>{`
          :root { color-scheme: light dark; font: 16px/1.6 system-ui, sans-serif; }
          body { max-width: 640px; margin: 5vh auto; padding: 24px; }
          h1 { font-size: 3rem; line-height: 1; margin-bottom: 16px; }
          p { opacity: .8; }
          form, section { margin-top: 28px; padding: 24px; border: 1px solid #8886; border-radius: 12px; }
          label { display: block; margin: 14px 0 6px; font-weight: 600; }
          input, select, textarea, button { box-sizing: border-box; width: 100%; padding: 10px; font: inherit; border: 1px solid #8888; border-radius: 6px; }
          button { margin-top: 24px; cursor: pointer; font-weight: 600; }
          textarea { min-height: 110px; overflow-wrap: anywhere; }
          .colors { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
          .preview { overflow-x: auto; padding: 12px 0; }
          .preview img { display: block; }
          a { color: inherit; }
          footer { margin-top: 24px; }
          @media (max-width: 480px) { body { padding: 16px; } .colors { grid-template-columns: 1fr; gap: 0; } }
        `}</style>
					</head>
					<body>
						<main>
							<h1>Hits</h1>
							<p>给 GitHub README 加一个轻量的计数徽章。</p>
							<form method="get" action="/">
								<label for="url">要计数的页面 URL</label>
								<input
									id="url"
									name="url"
									type="url"
									required
									maxlength={2048}
									placeholder="https://github.com/you/project"
									value={values.url ?? ""}
								/>
								<label for="label">徽章文字</label>
								<input
									id="label"
									name="label"
									maxlength={64}
									value={values.label ?? "hits"}
								/>
								<div class="colors">
									<div>
										<label for="color">文字颜色</label>
										<input
											id="color"
											name="color"
											value={values.color ?? "#fff"}
										/>
									</div>
									<div>
										<label for="leftBgColor">左侧背景</label>
										<input
											id="leftBgColor"
											name="leftBgColor"
											value={values.leftBgColor ?? "#555"}
										/>
									</div>
									<div>
										<label for="rightBgColor">右侧背景</label>
										<input
											id="rightBgColor"
											name="rightBgColor"
											value={values.rightBgColor ?? "#2f3136"}
										/>
									</div>
								</div>
								<label for="border">边角</label>
								<select id="border" name="border">
									<option value="rounded" selected={values.border !== "square"}>
										圆角
									</option>
									<option value="square" selected={values.border === "square"}>
										直角
									</option>
								</select>
								<button type="submit">生成徽章</button>
							</form>
							{submitted && !query.success && (
								<p role="alert">
									参数有误：
									{query.error.issues
										.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
										.join("；")}
								</p>
							)}
							{badgeUrl && previewUrl && (
								<section aria-label="生成结果">
									<div class="preview">
										<img src={previewUrl.href} alt="计数徽章预览" />
									</div>
									<p>预览不增加计数。复制下方 Markdown 到 README 即可使用。</p>
									<label for="markdown">Markdown</label>
									<textarea
										id="markdown"
										readonly
									>{`![hits](${badgeUrl.href})`}</textarea>
								</section>
							)}
							<p>
								计数代表服务收到的徽章请求。GitHub
								会代理和缓存图片，因此不等于精确的页面浏览量或独立访客数。
							</p>
							<p>
								新徽章使用
								v2：保留路径大小写与查询参数，忽略片段。已有链接继续使用原计数；切换到
								v2 会从独立计数开始。
							</p>
						</main>
						<footer>
							<a href="https://github.com/AprilNEA/hits">
								GitHub · 源码与使用说明
							</a>
						</footer>
					</body>
				</html>
			)}`,
			submitted && !query.success ? 400 : 200,
		);
	});
}
