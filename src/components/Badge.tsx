import { z } from 'zod';
import type { FC } from 'hono/jsx'

export const BadgeStyle = z.object({
  label: z.string(),
  color: z.string(),
  leftBgColor: z.string(),
  rightBgColor: z.string(),
  border: z.enum(['square', 'rounded']),
}).partial()

export type BadgeStyle = z.infer<typeof BadgeStyle>;

export interface BadgeProps extends BadgeStyle {
  count: number;
}

const Badge: FC<BadgeProps> = ({
  label = 'hits',
  count,
  color = '#fff',
  leftBgColor = '#555',
  rightBgColor = '#2f3136',
  border = 'rounded',
  ...props
}) => {
  const rectWidth = 150;
  const borderRadius = border === 'square' ? 0 : 3;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width={rectWidth}
      height={20}
      role="img"
      aria-label={`${label}: ${count} hits`}
      {...props}
    >
      <title>{`${label}: ${count} hits`}</title>
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stopColor="#bbb" stopOpacity=".1" />
        <stop offset="1" stopOpacity=".1" />
      </linearGradient>
      <clipPath id="r">
        <rect width={100} height={20} rx={borderRadius} fill="#fff" />
      </clipPath>
      <g clipPath="url(#r)">
        <rect width={38} height={20} fill={leftBgColor} />
        <rect x={38} width={62} height={20} fill={rightBgColor} />
        <rect width={rectWidth} height={20} fill="url(#s)" />
      </g>
      <g fill="#fff" textAnchor="middle" fontFamily="Verdana,Geneva,DejaVu Sans,sans-serif" fontSize={110}>
        <text x={195} y={140} transform="scale(.1)" fill={color}>{label}</text>
        <text x={695} y={140} transform="scale(.1)" fill={color}>{count}</text>
      </g>
    </svg>
  )
}

export default Badge;