import type {
  ChatMessage,
  OnboardingStep,
  Project,
  VisualOutputType,
} from "@/types/domain";
import { DEFAULT_PROJECT_TITLE } from "@/lib/constants";

export const OPTIONAL_ONBOARDING_STEPS = new Set<OnboardingStep>([
  "art_style",
  "palette",
  "mood",
  "characters",
  "references",
  "instructions",
]);

export const ONBOARDING_QUESTIONS: Record<OnboardingStep, string> = {
  title:
    "Let’s give this world a name. What would you like to call your project? You can always change it later.",
  story:
    "Great. Tell me about the story you want to create — a premise, rough notes, a script, or even one vivid scene is enough.",
  format:
    "How should we shape it visually: a graphic novel, a storyboard, or a visual book?",
  art_style:
    "What artistic style feels right for this world? Think cinematic realism, ink wash, ligne claire, collage, or anything else you imagine.",
  palette:
    "What colours should define the world? Describe a palette, a few key colours, or skip this for now.",
  mood:
    "And what should the story feel like visually — intimate, dreamlike, tense, playful, melancholic, or something else?",
  characters:
    "Who are the main characters? Share any visual traits, clothing, age, energy, or other details worth keeping consistent.",
  references:
    "Are there any visual references or reference notes you want the creative direction to remember?",
  instructions:
    "Last question: any additional creative instructions, boundaries, or must-have details?",
  complete:
    "Your story world is ready. Here’s the creative direction we’ve established.",
};

export const ONBOARDING_STEP_ORDER: OnboardingStep[] = [
  "title",
  "story",
  "format",
  "art_style",
  "palette",
  "mood",
  "characters",
  "references",
  "instructions",
  "complete",
];

const FORMAT_LABELS: Record<VisualOutputType, string> = {
  graphic_novel: "Graphic novel",
  storyboard: "Storyboard",
  visual_book: "Visual book",
};

function createId(prefix: string) {
  const uniquePart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${uniquePart}`;
}

function message(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: createId("message"),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function createProject(): Project {
  const now = new Date().toISOString();
  const id = createId("project");

  return {
    id,
    title: DEFAULT_PROJECT_TITLE,
    description: "",
    createdAt: now,
    updatedAt: now,
    outputType: null,
    styleBible: {
      projectId: id,
      artStyle: "",
      mood: "",
      palette: "",
      characterDescriptions: "",
      visualReferences: "",
      additionalInstructions: "",
    },
    characters: [],
    onboarding: {
      currentStep: "title",
      completedSteps: [],
      status: "in_progress",
    },
    chatHistory: [
      message(
        "assistant",
        "Welcome to your new studio. I’ll help you shape the story and its visual language, one thoughtful question at a time.",
      ),
      message("assistant", ONBOARDING_QUESTIONS.title),
    ],
    storyPlan: null,
    selectedPageBeatId: null,
    planningChatHistory: [],
  };
}

function parseOutputType(input: string): VisualOutputType | null {
  const normalized = input.toLowerCase().replace(/[-_]/g, " ").trim();

  if (normalized.includes("graphic") || normalized.includes("comic")) return "graphic_novel";
  if (normalized.includes("storyboard")) return "storyboard";
  if (normalized.includes("visual book") || normalized.includes("illustrated book")) {
    return "visual_book";
  }

  return null;
}

function isSkip(input: string) {
  return ["skip", "skip for now", "none", "not sure", "no"].includes(input.toLowerCase().trim());
}

function getNextStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEP_ORDER.indexOf(step);
  return ONBOARDING_STEP_ORDER[Math.min(index + 1, ONBOARDING_STEP_ORDER.length - 1)];
}

export function getOutputTypeLabel(outputType: VisualOutputType | null) {
  return outputType ? FORMAT_LABELS[outputType] : "Not selected";
}

export function answerOnboardingQuestion(project: Project, rawAnswer: string): Project {
  const answer = rawAnswer.trim();
  const step = project.onboarding.currentStep;

  if (!answer || step === "complete") return project;

  if (isSkip(answer) && !OPTIONAL_ONBOARDING_STEPS.has(step)) {
    return {
      ...project,
      chatHistory: [
        ...project.chatHistory,
        message("user", answer),
        message(
          "assistant",
          step === "format"
            ? "I need one format to guide the project. Choose graphic novel, storyboard, or visual book."
            : "This detail gives the project its foundation, so I’ll need an answer before we continue.",
        ),
      ],
    };
  }

  const nextProject: Project = {
    ...project,
    styleBible: { ...project.styleBible },
    characters: [...project.characters],
    onboarding: {
      ...project.onboarding,
      completedSteps: [...project.onboarding.completedSteps],
    },
    chatHistory: [...project.chatHistory, message("user", answer)],
    updatedAt: new Date().toISOString(),
  };

  const skipped = isSkip(answer);

  switch (step) {
    case "title":
      nextProject.title = answer;
      break;
    case "story":
      nextProject.description = answer;
      break;
    case "format": {
      const outputType = parseOutputType(answer);
      if (!outputType) {
        nextProject.chatHistory.push(
          message(
            "assistant",
            "I didn’t recognize that format. Please choose graphic novel, storyboard, or visual book.",
          ),
        );
        return nextProject;
      }
      nextProject.outputType = outputType;
      break;
    }
    case "art_style":
      if (!skipped) nextProject.styleBible.artStyle = answer;
      break;
    case "palette":
      if (!skipped) nextProject.styleBible.palette = answer;
      break;
    case "mood":
      if (!skipped) nextProject.styleBible.mood = answer;
      break;
    case "characters":
      if (!skipped) {
        nextProject.styleBible.characterDescriptions = answer;
        nextProject.characters = [
          {
            id: createId("character"),
            projectId: project.id,
            name: "Main character notes",
            description: answer,
          },
        ];
      }
      break;
    case "references":
      if (!skipped) nextProject.styleBible.visualReferences = answer;
      break;
    case "instructions":
      if (!skipped) nextProject.styleBible.additionalInstructions = answer;
      break;
  }

  if (!nextProject.onboarding.completedSteps.includes(step)) {
    nextProject.onboarding.completedSteps.push(step);
  }

  const nextStep = getNextStep(step);
  nextProject.onboarding.currentStep = nextStep;

  if (nextStep === "complete") {
    nextProject.onboarding.status = "complete";
    nextProject.chatHistory.push(message("assistant", ONBOARDING_QUESTIONS.complete));
  } else {
    nextProject.chatHistory.push(message("assistant", ONBOARDING_QUESTIONS[nextStep]));
  }

  return nextProject;
}
