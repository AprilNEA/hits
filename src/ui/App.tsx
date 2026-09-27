/** @jsxImportSource react */
import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./components/card";
import { Input } from "./components/input";
import { Label } from "./components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/select";
import { Textarea } from "./components/textarea";

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
const maxUnits = [
	{ value: "auto", label: "自动 · 1M" },
	{ value: "k", label: "只用 k · 1000k" },
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
		<div className="grid min-w-0 gap-2">
			<Label htmlFor={name}>{label}</Label>
			<Select name={name} defaultValue={value} items={items}>
				<SelectTrigger id={name} className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent align="start" alignItemWithTrigger={false}>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
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
		<div className="mx-auto max-w-4xl px-4 sm:px-6">
			<header className="flex h-16 items-center justify-between border-b">
				<a className="text-lg font-semibold tracking-tight" href="/">
					Hits
				</a>
				<a
					className="text-sm text-muted-foreground hover:text-foreground"
					href="https://github.com/AprilNEA/hits"
				>
					GitHub
				</a>
			</header>
			<main className="py-8 sm:py-10">
				<div className="mb-6 space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">计数徽章</h1>
					<p className="text-sm text-muted-foreground">
						设置样式，生成可直接嵌入 GitHub README 的徽章。
					</p>
				</div>
				<div className="grid items-start gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>
								<h2>设置</h2>
							</CardTitle>
							<CardDescription>填写页面地址并选择徽章样式。</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-5" method="get" action="/">
								<div className="grid gap-2">
									<Label htmlFor="url">页面 URL</Label>
									<Input
										id="url"
										name="url"
										type="url"
										required
										maxLength={2048}
										placeholder="https://github.com/you/project"
										defaultValue={values.url ?? ""}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<Label htmlFor="label">徽章文字</Label>
										<Input
											id="label"
											name="label"
											maxLength={64}
											defaultValue={values.label ?? "hits"}
										/>
									</div>
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
								<div className="space-y-2">
									<Choice
										name="maxUnit"
										label="最高单位"
										value={values.maxUnit === "k" ? "k" : "auto"}
										items={maxUnits}
									/>
									<p className="text-xs text-muted-foreground">
										仅紧凑格式生效；只用 k 时，1000000 显示为 1000k。
									</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-3">
									{colors.map(({ name, label, defaultValue }) => (
										<div className="grid min-w-0 gap-2" key={name}>
											<Label htmlFor={name}>{label}</Label>
											<Input
												id={name}
												name={name}
												className="font-mono"
												defaultValue={values[name] ?? defaultValue}
												spellCheck={false}
											/>
										</div>
									))}
								</div>
								{error ? (
									<p
										className="text-sm text-destructive wrap-anywhere"
										role="alert"
									>
										{error}
									</p>
								) : null}
								<Button className="w-full" type="submit">
									生成徽章
								</Button>
							</form>
						</CardContent>
					</Card>
					<Card role="region" aria-label="生成结果">
						<CardHeader>
							<CardTitle>
								<h2>预览</h2>
							</CardTitle>
							<CardDescription>预览不增加计数。</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="flex min-h-32 items-center overflow-x-auto rounded-lg border bg-muted/40 p-6">
								{previewUrl ? (
									<img
										src={previewUrl}
										alt="计数徽章预览"
										className="mx-auto max-w-none shrink-0"
									/>
								) : (
									<p className="mx-auto text-center text-sm text-muted-foreground">
										生成徽章后在这里预览。
									</p>
								)}
							</div>
							{badgeUrl && previewUrl ? (
								<div className="space-y-3">
									<Label htmlFor="markdown">Markdown</Label>
									<Textarea
										id="markdown"
										className="min-h-32 resize-y font-mono text-xs"
										readOnly
										value={markdown}
										spellCheck={false}
									/>
									<Button
										className="w-full"
										variant="outline"
										onClick={copyMarkdown}
									>
										<Copy aria-hidden="true" />
										复制 Markdown
									</Button>
									<p
										className="min-h-4 text-xs text-muted-foreground"
										role="status"
									>
										{copyStatus}
									</p>
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>
				<aside
					className="mt-6 space-y-2 text-xs leading-relaxed text-muted-foreground"
					aria-label="计数说明"
				>
					<p>
						计数代表徽章请求次数。GitHub{" "}
						会代理和缓存图片，因此不等于精确浏览量或独立访客数。
					</p>
					<p>
						新徽章使用 v2，保留路径大小写和查询参数。已有链接保持原计数；切换到{" "}
						v2 会从独立计数开始。
					</p>
				</aside>
			</main>
		</div>
	);
}
