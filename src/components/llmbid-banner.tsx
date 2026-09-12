import { ArrowUpRight } from "lucide-react";

export default function LlmbidBanner() {
  return (
    <a
      href="https://llmbid.lol"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit llmbid.lol, a $1 LLM popularity leaderboard"
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="llmbid-banner-border rounded-xl p-px">
        <div className="relative z-10 flex items-center justify-between gap-4 rounded-[11px] bg-background/95 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                llmbid.lol
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                New project
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground sm:text-[15px]">
              A $1 LLM popularity leaderboard
            </p>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-colors duration-200 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 group-hover:text-amber-700 dark:group-hover:text-amber-300">
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </a>
  );
}
