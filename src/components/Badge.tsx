import type { FC } from "hono/jsx";
import { z } from "zod";

const color = z
	.string()
	.regex(
		/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|black|silver|gray|white|maroon|red|purple|fuchsia|green|lime|olive|yellow|navy|blue|teal|aqua|orange|transparent)$/i,
		"Use a hex color or a basic CSS color name",
	);

export const BadgeStyle = z.object({
	label: z
		.string()
		.max(64)
		.regex(
			/^[^\p{Cc}\p{Cs}\uFFFE\uFFFF]*$/u,
			"Label must contain printable text",
		)
		.optional(),
	color: color.optional(),
	leftBgColor: color.optional(),
	rightBgColor: color.optional(),
	border: z.enum(["square", "rounded"]).optional(),
});

export type BadgeStyle = z.infer<typeof BadgeStyle>;

interface BadgeProps extends BadgeStyle {
	count: number;
}

const Badge: FC<BadgeProps> = ({
	label = "hits",
	count,
	color = "#fff",
	leftBgColor = "#555",
	rightBgColor = "#2f3136",
	border = "rounded",
}) => {
	// ponytail: approximate font metrics; textLength fits the glyphs. Measure fonts if exact typography is needed.
	const labelWidth = [...label].reduce(
		(width, character) => width + (character.charCodeAt(0) < 128 ? 7 : 11),
		0,
	);
	const countWidth = String(count).length * 7;
	const leftWidth = labelWidth + 14;
	const rightWidth = countWidth + 14;
	const width = leftWidth + rightWidth;
	const title = `${label}: ${count}`;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={20}
			viewBox={`0 0 ${width} 20`}
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<linearGradient id="s" x2="0" y2="100%">
				<stop offset="0" stopColor="#bbb" stopOpacity=".1" />
				<stop offset="1" stopOpacity=".1" />
			</linearGradient>
			<clipPath id="r">
				<rect width={width} height={20} rx={border === "square" ? 0 : 3} />
			</clipPath>
			<g clipPath="url(#r)">
				<rect width={leftWidth} height={20} fill={leftBgColor} />
				<rect
					x={leftWidth}
					width={rightWidth}
					height={20}
					fill={rightBgColor}
				/>
				<rect width={width} height={20} fill="url(#s)" />
			</g>
			<g
				fill={color}
				textAnchor="middle"
				fontFamily="Verdana,Geneva,DejaVu Sans,sans-serif"
				fontSize={11}
			>
				<text
					x={leftWidth / 2}
					y={14}
					textLength={labelWidth || undefined}
					lengthAdjust="spacingAndGlyphs"
				>
					{label}
				</text>
				<text
					x={leftWidth + rightWidth / 2}
					y={14}
					textLength={countWidth}
					lengthAdjust="spacingAndGlyphs"
				>
					{count}
				</text>
			</g>
		</svg>
	);
};

export default Badge;
