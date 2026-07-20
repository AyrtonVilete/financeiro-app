import type { AllocationSlice } from "@/lib/investments/recommend";

const SLOT_VARS = ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5"];

export function AllocationChart({ allocation }: { allocation: AllocationSlice[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {allocation.map((slice, i) => (
          <div
            key={slice.label}
            style={{
              width: `${slice.percentage}%`,
              backgroundColor: `var(${SLOT_VARS[i % SLOT_VARS.length]})`,
            }}
            className="flex items-center justify-center border-r-2 border-[var(--surface)] last:border-r-0"
          >
            {slice.percentage >= 12 && (
              <span className="text-[11px] font-medium text-white">{slice.percentage}%</span>
            )}
          </div>
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {allocation.map((slice, i) => (
          <li key={slice.label} className="flex items-start gap-2.5">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: `var(${SLOT_VARS[i % SLOT_VARS.length]})` }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {slice.label} <span className="text-muted-foreground">· {slice.percentage}%</span>
              </p>
              <p className="text-xs text-muted-foreground">{slice.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
