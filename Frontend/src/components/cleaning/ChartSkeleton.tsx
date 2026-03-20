type ChartSkeletonProps = {
    title?: string
}

export const ChartSkeleton = ({ title = "Preparing chart..." }: ChartSkeletonProps) => {
    return (
        <div className="h-[400px] w-full animate-pulse rounded-xl border border-[#222222] bg-[#111111] p-4">
            <div className="mb-4 h-4 w-40 rounded bg-[#222222]" />
            <div className="mb-3 h-3 w-28 rounded bg-[#1A1A1A]" />
            <div className="grid h-[300px] grid-cols-12 items-end gap-2 rounded-lg border border-[#222222] bg-[#0A0A0A] p-3">
                {Array.from({ length: 12 }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-t-md bg-[#8884d8]"
                        style={{ height: `${22 + ((index * 17) % 62)}%`, opacity: 0.3 }}
                    />
                ))}
            </div>
            <p className="mt-3 text-xs text-[#A1A1AA]">{title}</p>
        </div>
    )
}
