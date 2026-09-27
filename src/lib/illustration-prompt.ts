import type { PageBeat, Project, VisualOutputType } from "@/types/domain";

const FORMAT_LABELS: Record<VisualOutputType, string> = {
  graphic_novel: "Graphic novel",
  storyboard: "Storyboard",
  visual_book: "Visual book",
};

function clean(value: string | undefined | null) {
  return value?.trim() ?? "";
}

/** Builds a provider-independent prompt from explicit saved project and page data only. */
export function buildIllustrationPrompt(project: Project, page: PageBeat) {
  const sections: string[] = [];
  const usedValues = new Set<string>();

  function section(title: string, fields: Array<[string, string | undefined | null]>) {
    const lines = fields.flatMap(([label, rawValue]) => {
      const value = clean(rawValue);
      const fingerprint = value.toLocaleLowerCase();
      if (!value || usedValues.has(fingerprint)) return [];
      usedValues.add(fingerprint);
      return [`${label}: ${value}`];
    });
    if (lines.length) sections.push(`${title}\n${lines.join("\n")}`);
  }

  section("PROJECT", [
    ["Title", project.title],
    ["Premise", project.description],
    ["Format", project.outputType ? FORMAT_LABELS[project.outputType] : ""],
  ]);
  section("SHARED VISUAL DIRECTION", [
    ["Art style", project.styleBible.artStyle],
    ["Mood", project.styleBible.mood],
    ["Palette", project.styleBible.palette],
    ["Character continuity", project.styleBible.characterDescriptions],
    ["Project visual references", project.styleBible.visualReferences],
    ["Project instructions", project.styleBible.additionalInstructions],
  ]);
  const savedStyleValues = [
    project.styleBible.artStyle,
    project.styleBible.mood,
    project.styleBible.palette,
    project.styleBible.characterDescriptions,
  ]
    .map(clean)
    .filter(Boolean);
  const normalizedPageDirection = clean(page.visualDirection).toLocaleLowerCase();
  const visualDirectionRepeatsStyleBible =
    savedStyleValues.length > 0 &&
    savedStyleValues.every((value) =>
      normalizedPageDirection.includes(value.toLocaleLowerCase()),
    );
  section(`PAGE ${page.order}`, [
    ["Title", page.title],
    ["Scene", page.description],
    ["Visual direction", visualDirectionRepeatsStyleBible ? "" : page.visualDirection],
    ["Narration", page.narration],
    ["Dialogue", page.dialogue],
    ["Story section", page.optionalActLabel],
  ]);
  section("PAGE CREATIVE SETTINGS", [
    ["Camera angle", page.creation.settings.cameraAngle],
    ["Shot type", page.creation.settings.shotType],
    ["Lighting", page.creation.settings.lighting],
    ["Composition", page.creation.settings.composition],
    ["Emotional tone", page.creation.settings.emotionalTone],
    ["Additional page instructions", page.creation.settings.additionalInstructions],
    ["Aspect ratio", page.creation.settings.aspectRatio],
  ]);

  if (page.creation.references.length) {
    sections.push(
      `PAGE VISUAL REFERENCES\n${page.creation.references
        .map((reference) => {
          const details = [
            `${reference.title} (${reference.purpose})`,
            clean(reference.description),
            clean(reference.url),
          ].filter(Boolean);
          return `- ${details.join(" — ")}`;
        })
        .join("\n")}`,
    );
  }

  sections.push(
    "BOUNDARY\nUse only the supplied story and visual details. Do not invent new characters, events, text, or continuity.",
  );
  return sections.join("\n\n");
}
