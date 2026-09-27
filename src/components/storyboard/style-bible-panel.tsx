import { Icon } from "@/components/ui/icon";
import type { Project, VisualStyleBible } from "@/types/domain";

interface StyleBiblePanelProps {
  project: Project;
  onChange: (updates: Partial<Omit<VisualStyleBible, "projectId">>) => void;
}

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  rows?: number;
}

function Field({ label, value, placeholder, onChange, rows = 3 }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-[#7e796f]">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="studio-scrollbar block w-full resize-none rounded-xl border border-[#726b61]/12 bg-white/45 px-3.5 py-3 text-[11px] leading-[1.6] text-[#34342f] outline-none transition-colors placeholder:text-[#a6a096] focus:border-[#777fd7]/40 focus:bg-white/60 focus:ring-2 focus:ring-[#777fd7]/10"
      />
    </label>
  );
}

export function StyleBiblePanel({ project, onChange }: StyleBiblePanelProps) {
  return (
    <div className="relative mx-auto w-full max-w-[760px] py-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#777fd7]">
            <Icon name="palette" size={16} />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Living document</span>
          </div>
          <h2 className="mt-2 font-serif text-[27px] tracking-[-0.035em] text-[#292a27]">
            Visual Style Bible
          </h2>
          <p className="mt-1.5 max-w-[540px] text-[10px] leading-relaxed text-[#7c776e]">
            Keep the visual language of {project.title} consistent. Changes save automatically on this device.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/45 px-3 py-1.5 text-[9px] font-medium text-[#6f6b63]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6da47e]" />
          Saved locally
        </span>
      </div>

      <div className="artboard-shadow rounded-2xl bg-[#f5f0e8]/95 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Artistic style"
            value={project.styleBible.artStyle}
            placeholder="e.g. Painterly cinematic realism with expressive linework"
            onChange={(artStyle) => onChange({ artStyle })}
          />
          <Field
            label="Mood"
            value={project.styleBible.mood}
            placeholder="e.g. Quietly mysterious, intimate, and hopeful"
            onChange={(mood) => onChange({ mood })}
          />
          <Field
            label="Colour palette"
            value={project.styleBible.palette}
            placeholder="e.g. Midnight blue, oxidized copper, warm candlelight"
            onChange={(palette) => onChange({ palette })}
          />
          <Field
            label="Visual references"
            value={project.styleBible.visualReferences}
            placeholder="Artists, films, photography, eras, or reference notes"
            onChange={(visualReferences) => onChange({ visualReferences })}
          />
          <div className="sm:col-span-2">
            <Field
              label="Character descriptions"
              value={project.styleBible.characterDescriptions}
              placeholder="Appearance, clothing, silhouette, expressions, and traits to keep consistent"
              onChange={(characterDescriptions) => onChange({ characterDescriptions })}
              rows={4}
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Additional creative instructions"
              value={project.styleBible.additionalInstructions}
              placeholder="Composition rules, visual boundaries, motifs, or must-have details"
              onChange={(additionalInstructions) => onChange({ additionalInstructions })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
