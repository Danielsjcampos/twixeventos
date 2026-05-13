'use client'

interface Props {
  count: number
  label?: string
}

export function AlertBadge({ count, label }: Props) {
  if (count === 0) return null

  return (
    <span
      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold leading-none"
      title={label ?? `${count} alerta${count !== 1 ? 's' : ''}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
