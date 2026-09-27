import { Icon } from "@/components/ui/icon";
import type { Project } from "@/types/domain";

interface PagesWorkspaceProps {
  project: Project;
  onOpenPlanning: () => void;
  onSelectPage: (pageBeatId: string) => void;
}

export function PagesWorkspace({ project, onOpenPlanning, onSelectPage }: PagesWorkspaceProps) {
  const plan = project.storyPlan;

  if (!plan || plan.status !== "approved") {
    return (
      <div
        className="relative z-10 w-full min-w-0 max-w-[430px] rounded-2xl border px-7 py-8 text-center shadow-[0_18px_50px_rgba(75,67,58,.13)] backdrop-blur-md sm:px-9"
        style={{
          backgroundColor: "var(--canvas-card-bg)",
          borderColor: "var(--canvas-card-border)",
          color: "var(--canvas-ink)",
        }}
      >
        <div
          className="mx-auto grid h-10 w-10 place-items-center rounded-xl"
          style={{
            backgroundColor: "var(--canvas-button-bg)",
            color: "var(--canvas-button-text)",
          }}
        >
          <Icon name="pages" size={18} />
        </div>
        <h2 className="mt-5 font-serif text-[25px] tracking-[-0.035em]">Approve a story plan first</h2>
        <p className="mt-3 text-[11px] leading-[1.65]" style={{ color: "var(--canvas-muted)" }}>
          Approved page beats will appear here in sequence and become the foundation for future visual creation.
        </p>
        <button
          type="button"
          onClick={onOpenPlanning}
          className="mt-5 rounded-xl px-4 py-2.5 text-[10px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--canvas-order-bg)" }}
        >
          Open story planning
        </button>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[780px] py-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: "var(--canvas-badge-bg)",
                color: "var(--canvas-badge-text)",
              }}
            >
              ✓
            </span>
            <span
              className="text-[8px] font-bold uppercase tracking-[0.15em]"
              style={{ color: "var(--canvas-badge-text)" }}
            >
              Approved sequence
            </span>
          </div>
          <h2 className="mt-2 font-serif text-[27px] tracking-[-0.035em]" style={{ color: "var(--canvas-ink)" }}>
            Planned pages
          </h2>
          <p className="mt-1.5 text-[10px]" style={{ color: "var(--canvas-muted)" }}>
            {plan.pageBeats.length} pages ready for the next production stage.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPlanning}
          className="rounded-lg border px-3 py-2 text-[9px] font-semibold transition-colors hover:opacity-85"
          style={{
            backgroundColor: "var(--canvas-card-bg)",
            borderColor: "var(--canvas-card-border)",
            color: "var(--canvas-muted)",
          }}
        >
          Revise story plan
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {plan.pageBeats.map((page) => {
          const isSelected = project.selectedPageBeatId === page.id;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className="min-w-0 rounded-2xl border p-4 text-left shadow-[0_8px_24px_rgba(0,0,0,.06)] backdrop-blur-sm transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: isSelected ? "var(--canvas-card-selected-bg)" : "var(--canvas-card-bg)",
                borderColor: isSelected ? "var(--canvas-card-selected-border)" : "var(--canvas-card-border)",
                boxShadow: isSelected ? "0 0 0 2px var(--canvas-card-selected-border)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold shadow-sm"
                  style={{
                    backgroundColor: "var(--canvas-order-bg)",
                    color: "var(--canvas-order-text)",
                  }}
                >
                  {String(page.order).padStart(2, "0")}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: "var(--canvas-badge-bg)",
                    color: "var(--canvas-badge-text)",
                  }}
                >
                  {page.creation.illustrationStatus === "not_started" ? "Ready for visuals" : "Prompt ready"}
                </span>
              </div>
              <h3 className="mt-3 truncate text-[12px] font-semibold" style={{ color: "var(--canvas-ink)" }}>
                {page.title}
              </h3>
              <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed" style={{ color: "var(--canvas-muted)" }}>
                {page.description}
              </p>
              <span
                className="mt-4 inline-flex rounded-lg px-3 py-1.5 text-[9px] font-semibold transition-colors"
                style={{
                  backgroundColor: "var(--canvas-button-bg)",
                  color: "var(--canvas-button-text)",
                }}
              >
                Open visual workspace
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
