import type { Project, PageBeat, ImageVersion } from "@/types/domain";

export function createDDaySampleProject(customId?: string): Project {
  const uniqueId = Math.random().toString(36).slice(2, 8);
  const projectId = customId || `project-dday-${uniqueId}`;
  const planId = `plan-dday-${uniqueId}`;
  const now = new Date().toISOString();

  const makeImageVersion = (pageId: string, imageId: string, prompt: string): ImageVersion => ({
    id: `ver-${imageId}`,
    pageId,
    imageUrl: `/api/page-images/${imageId}`,
    prompt,
    createdAt: now,
    selected: true,
    parentVersionId: null,
    generationBatchId: "batch-dday-1",
    status: "approved",
  });

  const pageBeats: PageBeat[] = [
    {
      id: "dday-p1",
      storyPlanId: planId,
      order: 1,
      title: "Approaching Omaha Beach",
      description: "Inside a Higgins landing craft cutting through turbulent grey waves at dawn.",
      visualDirection: "Low-angle framing from inside the landing boat looking past tense soldiers in olive M1 helmets toward the foggy Normandy coastline.",
      narration: "Dawn, June 6. Diesel fumes and sea spray filled the icy morning air as the bluffs of Normandy rose from the mist.",
      dialogue: "Capt. Miller: 'Thirty seconds! Keep your heads down until that ramp hits water!'",
      optionalActLabel: "Act I · The Crossing",
      status: "approved",
      creation: {
        illustrationStatus: "approved",
        settings: {
          cameraAngle: "Low angle",
          shotType: "Medium shot",
          lighting: "Dramatic contrast dawn",
          composition: "Inside landing craft framed by steel bulkhead",
          emotionalTone: "Claustrophobic, breathless dread",
          additionalInstructions: "Wet spray reflections, dark ocean waves",
          aspectRatio: "16:9",
        },
        prompt: {
          automaticPrompt: "WWII D-Day soldiers in Higgins landing craft approaching Omaha beach, dawn fog and stormy sea spray, graphic novel comic art style.",
          editedPrompt: null,
          mode: "automatic",
          updatedAt: now,
        },
        references: [],
        chatHistory: [],
        imageVersions: [
          makeImageVersion(
            "dday-p1",
            "3384379a-abea-45cb-ad37-644b3115e117",
            "WWII D-Day soldiers in Higgins landing craft approaching Omaha beach, dawn fog and stormy sea spray",
          ),
        ],
      },
    },
    {
      id: "dday-p2",
      storyPlanId: planId,
      order: 2,
      title: "The Ramp Drops",
      description: "The steel ramp drops with a violent splash into waist-deep surf under heavy machine gun fire.",
      visualDirection: "High-action wide angle. Water erupting from bullets, soldiers plunging into waves, smoke swirling across grey sand.",
      narration: "The ramp crashed into the surf. In a heartbeat, the silence shattered into machine gun thunder and churning saltwater.",
      dialogue: "Sgt. Horvath: 'Ramp down! Move, move, move! Don't bunch up in the surf!'",
      optionalActLabel: "Act I · The Landing",
      status: "approved",
      creation: {
        illustrationStatus: "approved",
        settings: {
          cameraAngle: "Eye level",
          shotType: "Wide shot",
          lighting: "Overcast storm light with muzzle flashes",
          composition: "Soldiers surging forward through crashing surf",
          emotionalTone: "Chaotic kinetic intensity",
          additionalInstructions: "High contrast silhouettes, water splashes",
          aspectRatio: "16:9",
        },
        prompt: {
          automaticPrompt: "Landing craft ramp dropping in surf, soldiers storming Omaha beach under gunfire, artillery smoke, comic book art.",
          editedPrompt: null,
          mode: "automatic",
          updatedAt: now,
        },
        references: [],
        chatHistory: [],
        imageVersions: [
          makeImageVersion(
            "dday-p2",
            "897048ef-d243-40b3-babf-28aad3caab01",
            "Landing craft ramp dropping in surf, soldiers storming Omaha beach under gunfire",
          ),
        ],
      },
    },
    {
      id: "dday-p3",
      storyPlanId: planId,
      order: 3,
      title: "Pinned at the Shingle",
      description: "Soldiers take cover behind steel hedgehogs and gravel shingle as mortar explosions throw dark earth into the sky.",
      visualDirection: "Tight low-angle composition close to wet gravel. Smoke blankets the cliffs as soldiers desperately coordinate their squad.",
      narration: "Every yard of open sand was paid for in blood. The sea wall stood fifty yards ahead through an unbroken sheet of fire.",
      dialogue: "Pvt. Ryan: 'Captain! We can't stay pinned here, they've got this sector zeroed in!'",
      optionalActLabel: "Act II · The Gauntlet",
      status: "approved",
      creation: {
        illustrationStatus: "approved",
        settings: {
          cameraAngle: "Dutch angle",
          shotType: "Close-up",
          lighting: "Dark smoke with fiery orange blasts",
          composition: "Foreground soldier silhouette with background bunker fire",
          emotionalTone: "Gritty desperation",
          additionalInstructions: "Czech hedgehogs, dark smoke plumes",
          aspectRatio: "16:9",
        },
        prompt: {
          automaticPrompt: "Soldiers taking cover behind beach obstacles at Omaha Beach, mortar explosions, dark stormy sky, graphic novel style.",
          editedPrompt: null,
          mode: "automatic",
          updatedAt: now,
        },
        references: [],
        chatHistory: [],
        imageVersions: [
          makeImageVersion(
            "dday-p3",
            "828d6a48-dda0-491c-8e1b-fe73810db338",
            "Soldiers taking cover behind beach obstacles at Omaha Beach, mortar explosions",
          ),
        ],
      },
    },
    {
      id: "dday-p4",
      storyPlanId: planId,
      order: 4,
      title: "Securing the Ridge",
      description: "Allied soldiers reach the bluffs at sunset, gazing down at the armada stretching to the horizon.",
      visualDirection: "Epic wide panorama. Silhouetted weary soldiers standing on grassy cliffs, golden sunset breaking through clouds over a massive naval fleet.",
      narration: "By twilight, the guns fell silent along the ridge. Below, the greatest armada in human history stretched to the curve of the earth.",
      dialogue: "Capt. Miller: 'We hold the high ground. Send word back to the flagship.'",
      optionalActLabel: "Act III · Victory on the Bluffs",
      status: "approved",
      creation: {
        illustrationStatus: "approved",
        settings: {
          cameraAngle: "High angle",
          shotType: "Wide shot",
          lighting: "Golden hour sunset piercing storm clouds",
          composition: "Soldiers on ridge overlooking endless naval fleet",
          emotionalTone: "Monumental, somber triumph",
          additionalInstructions: "Armada on sea horizon, dramatic cloud break",
          aspectRatio: "16:9",
        },
        prompt: {
          automaticPrompt: "Soldiers on grassy cliffs overlooking Normandy beach and massive naval fleet at sunset, cinematic graphic novel.",
          editedPrompt: null,
          mode: "automatic",
          updatedAt: now,
        },
        references: [],
        chatHistory: [],
        imageVersions: [
          makeImageVersion(
            "dday-p4",
            "65524ab0-45e6-4ea4-89c7-64187776f698",
            "Soldiers on grassy cliffs overlooking Normandy beach and massive naval fleet at sunset",
          ),
        ],
      },
    },
  ];

  return {
    id: projectId,
    title: "D-Day: The Longest Hour",
    description: "June 6, 1944. Allied soldiers undertake the perilous landing on Omaha Beach, facing relentless gunfire to secure the Normandy cliffs.",
    createdAt: now,
    updatedAt: now,
    outputType: "graphic_novel",
    styleBible: {
      projectId,
      artStyle: "Gritty cinematic graphic novel, expressive ink wash, high contrast shadows",
      mood: "Visceral, tense, heroic, breathless claustrophobia",
      palette: "Muted gunmetal grey skies, stormy Atlantic blue-black waters, olive drab uniforms, burning orange artillery bursts",
      characterDescriptions: "Captain John Miller (weary, decisive squad leader with scarred M1 helmet), Sergeant Horvath (rugged veteran carrying BAR), Private Ryan (young recruit)",
      visualReferences: "Saving Private Ryan opening sequence, classic war graphic novels",
      additionalInstructions: "Maintain authentic 1944 military uniforms, steel helmets, Higgins landing craft, and dramatic panel framing.",
    },
    characters: [
      { id: "char-1", projectId, name: "Captain John Miller", description: "Squad leader, calm under fire" },
      { id: "char-2", projectId, name: "Sergeant Horvath", description: "Rugged right-hand veteran" },
      { id: "char-3", projectId, name: "Private Ryan", description: "Young, wide-eyed recruit" },
    ],
    onboarding: {
      currentStep: "complete",
      completedSteps: ["title", "story", "format", "art_style", "palette", "mood", "characters", "references", "instructions", "complete"],
      status: "complete",
    },
    chatHistory: [
      { id: "m-1", role: "assistant", content: "Welcome to Vizzy! Let's bring your graphic novel to life.", createdAt: now },
      { id: "m-2", role: "user", content: "I want to create a graphic novel about D-Day in World War II.", createdAt: now },
      { id: "m-3", role: "assistant", content: "Creative direction established for 'D-Day: The Longest Hour'. All 4 page beats are ready in the storyboard!", createdAt: now },
    ],
    storyPlan: {
      id: planId,
      projectId,
      synopsis: "Allied soldiers cross the English Channel, land on Omaha Beach under blistering artillery fire, and battle up the bluffs to secure the high ground.",
      targetPageCount: 4,
      status: "approved",
      pageBeats,
      createdAt: now,
      updatedAt: now,
    },
    selectedPageBeatId: "dday-p1",
    planningChatHistory: [],
  };
}
