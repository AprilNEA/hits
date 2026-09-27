/** @jsxImportSource react */
import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { useState } from "react";

export interface AppProps {
	values: Record<string, string>;
	badgeUrl?: string;
	previewUrl?: string;
	error?: string;
}

const formats = [
	{ value: "full", label: "完整数字 · 1200" },
	{ value: "compact", label: "紧凑格式 · 1.2k" },
];
const borders = [
	{ value: "rounded", label: "圆角" },
	{ value: "square", label: "直角" },
];
const colors = [
	{ name: "color", label: "文字颜色", defaultValue: "#fff" },
	{ name: "leftBgColor", label: "左侧背景", defaultValue: "#555" },
	{ name: "rightBgColor", label: "右侧背景", defaultValue: "#2f3136" },
];

function Choice({
	name,
	label,
	value,
	items,
}: {
	name: string;
	label: string;
	value: string;
	items: { value: string; label: string }[];
}) {
	return (
		<Field.Root className="field">
			<Field.Label className="field-label">{label}</Field.Label>
			<Select.Root name={name} defaultValue={value} items={items}>
				<Select.Trigger className="select-trigger">
					<Select.Value />
					<Select.Icon aria-hidden="true">⌄</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Positioner sideOffset={6} alignItemWithTrigger={false}>
						<Select.Popup className="select-popup">
							<Select.List>
								{items.map((item) => (
									<Select.Item
										className="select-item"
										key={item.value}
										value={item.value}
									>
										<Select.ItemText>{item.label}</Select.ItemText>
										<Select.ItemIndicator aria-hidden="true">
											✓
										</Select.ItemIndicator>
									</Select.Item>
								))}
							</Select.List>
						</Select.Popup>
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>
		</Field.Root>
	);
}

export function App({ values, badgeUrl, previewUrl, error }: AppProps) {
	const [copyStatus, setCopyStatus] = useState("");
	const markdown = badgeUrl ? `![hits](${badgeUrl})` : "";

	async function copyMarkdown() {
		try {
			await navigator.clipboard.writeText(markdown);
			setCopyStatus("已复制，可以粘贴到 README。");
		} catch {
			setCopyStatus("复制失败，请选中下方 Markdown 手动复制。");
		}
	}

	return (
		<>
			<header className="site-header">
				<a className="wordmark" href="/" aria-label="Hits 首页">
					<span className="brand-mark" aria-hidden="true">
						↗
					</span>
					Hits<span className="wordmark-dot">.</span>
				</a>
				<a className="source-link" href="https://github.com/AprilNEA/hits">
					GitHub <span aria-hidden="true">↗</span>
				</a>
			</header>
			<main>
				<div className="intro">
					<p className="eyebrow">SIMPLE COUNTS. SMALL BADGES.</p>
					<h1>给你的 README，加一个计数徽章。</h1>
					<p>为你的 GitHub README 生成一个轻量、可定制的计数徽章。</p>
				</div>
				<div className="workspace">
					<form className="editor panel" method="get" action="/">
						<div className="panel-heading">
							<span className="step">01</span>
							<h2>设置徽章</h2>
						</div>
						<Field.Root className="field">
							<Field.Label className="field-label">页面 URL</Field.Label>
							<Input
								className="input"
								id="url"
								name="url"
								type="url"
								required
								maxLength={2048}
								placeholder="https://github.com/you/project"
								defaultValue={values.url ?? ""}
							/>
							<Field.Description className="field-hint">
								填写要计数的仓库、个人主页或网站地址。
							</Field.Description>
						</Field.Root>
						<div className="field-row">
							<Field.Root className="field">
								<Field.Label className="field-label">徽章文字</Field.Label>
								<Input
									className="input"
									id="label"
									name="label"
									maxLength={64}
									defaultValue={values.label ?? "hits"}
								/>
							</Field.Root>
							<Choice
								name="border"
								label="边角"
								value={values.border === "square" ? "square" : "rounded"}
								items={borders}
							/>
						</div>
						<Choice
							name="format"
							label="数字格式"
							value={values.format === "compact" ? "compact" : "full"}
							items={formats}
						/>
						<div className="colors">
							{colors.map(({ name, label, defaultValue }) => (
								<Field.Root className="field" key={name}>
									<Field.Label className="field-label">{label}</Field.Label>
									<Input
										className="input color-input"
										id={name}
										name={name}
										defaultValue={values[name] ?? defaultValue}
										spellCheck={false}
									/>
								</Field.Root>
							))}
						</div>
						{error ? (
							<p className="error" role="alert">
								{error}
							</p>
						) : null}
						<Button className="button primary-button" type="submit">
							生成徽章 <span aria-hidden="true">→</span>
						</Button>
					</form>
					<section className="result panel" aria-label="生成结果">
						<div className="panel-heading">
							<span className="step">02</span>
							<h2>预览与使用</h2>
							<span className="read-only-tag">只读预览</span>
						</div>
						<div className="preview">
							{previewUrl ? (
								<img src={previewUrl} alt="计数徽章预览" />
							) : (
								<div
									className="sample-badge"
									role="img"
									aria-label="示例徽章：hits 0"
								>
									<span>hits</span>
									<span>0</span>
								</div>
							)}
						</div>
						{badgeUrl && previewUrl ? (
							<div className="result-content">
								<p className="result-description">
									预览不增加计数。将下方 Markdown 粘贴到 README 即可使用。
								</p>
								<label className="field-label" htmlFor="markdown">
									Markdown
								</label>
								<textarea
									id="markdown"
									className="markdown"
									readOnly
									value={markdown}
									spellCheck={false}
								/>
								<Button className="button copy-button" onClick={copyMarkdown}>
									复制 Markdown <span aria-hidden="true">↗</span>
								</Button>
								<p className="copy-status" role="status">
									{copyStatus}
								</p>
							</div>
						) : (
							<div className="empty-state">
								<h3>你的下一个小徽章</h3>
								<p>
									填写页面 URL 并生成徽章，
									<br />
									即可获得可直接使用的 Markdown。
								</p>
							</div>
						)}
						<div className="format-note">
							<span>紧凑格式</span>
							<code>1200 → 1.2k</code>
							<code>1000000 → 1M</code>
						</div>
					</section>
				</div>
				<aside className="counting-note" aria-label="计数说明">
					<p>
						计数代表服务收到的徽章请求。GitHub{" "}
						会代理和缓存图片，因此不等于精确的页面浏览量或独立访客数。
					</p>
					<p>
						新徽章使用{" "}
						v2：保留路径大小写与查询参数，忽略片段。已有链接保持原计数；切换到{" "}
						v2 会从独立计数开始。
					</p>
				</aside>
			</main>
			<footer className="site-footer">
				<span>一个徽章，记录来访。</span>
				<a href="https://github.com/AprilNEA/hits">
					源码与使用说明 <span aria-hidden="true">↗</span>
				</a>
			</footer>
		</>
	);
}
