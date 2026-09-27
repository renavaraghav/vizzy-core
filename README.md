# Vizzy

Vizzy is a conversational creative studio for making graphic novels, storyboards, visual books, and illustrated stories one page at a time.

## Current status

Vizzy is a complete visual storytelling and graphic novel creation studio. It supports:

- Multiple local projects with instant switching and deduplication safety
- Left sidebar story/project search with live filtering and clear button
- Collapsible left sidebar and collapsible right Creative Director chat panel
- Full-bleed auto-running graphic novel slideshow with top-right close button
- Dedicated User Profile workspace with avatar initials, tier badge, and account controls
- Dedicated Studio Settings workspace with 8 canvas background presets, creative defaults (including 4:3 and 9:16 ratios), AI provider preferences, and storage management
- Deterministic chat-based creative onboarding
- Editable Visual Style Bibles and character notes
- Deterministic draft story-plan generation with reapproval tracking
- Editable, ordered page beats with drag/move controls
- An approved Pages workspace and dedicated visual-development workspace for every page
- Page-specific camera, shot, lighting, composition, tone, instruction, and aspect-ratio controls
- Deterministic automatic illustration prompts with explicit edit, save, and reset states
- Page-scoped visual-reference metadata and conversational visual notes
- Phase 2.0B AI Job Architecture: deterministic state machine, unique job IDs, in-memory job registry, request revision tracking, stale response protection, cancellation via `AbortController`, retries with limits, idempotency deduplication, project/page isolation, navigation safety, approval safety, refinement lineage (`parentVersionId`), and configurable mock latency
- Free local procedural preview artwork when no model provider is configured
- Optional prompt-based Hugging Face image generation using FLUX.1-dev
- Versioned browser-local persistence (Envelope v3) with zero data loss on migration

Vizzy never calls OpenAI or another paid provider automatically. Without credentials, it creates a basic local procedural preview; that preview is not AI-generated and does not interpret the full prompt. For detailed prompt-based images, the app can use Hugging Face Inference Providers with FLUX.1-dev and the account's limited monthly free credit. The prototype has no backend database, cloud sync, or external authentication.

## Stack

- Next.js 16 with the App Router
- React 19
- TypeScript in strict mode
- Tailwind CSS 4
- ESLint 9 with Next.js Core Web Vitals and TypeScript rules
- npm

## Local setup

Requirements: Node.js 20.9 or newer and npm. Local procedural previews need no account or API key. Prompt-based model generation requires a Hugging Face token with Inference Providers permission.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
To enable prompt-based generation, create a Hugging Face fine-grained token with **Make calls to Inference Providers** permission, copy `.env.example` to `.env.local`, replace the placeholder with your token, and restart the dev server. The token stays server-side and is never sent to the browser. Hugging Face currently documents $0.10 in monthly credits for free accounts; this amount can change, and the allowance is limited. If the model is unavailable or out of free quota, Vizzy uses its clearly labeled local procedural preview instead. Generated image files are stored locally in `.vizzy-images/`; this prototype does not sync them to another device or cloud storage.

On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`.

## Commands

```bash
npm run dev       # Start the local development server
npm test          # Run onboarding, planner, operations, and migration tests
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
npm run build     # Create a production build
npm run start     # Run the production build
```

## Source structure

```text
src/
├── app/                  # App Router entry points and global theme
├── components/
│   ├── chat/             # Conversational onboarding and planning guidance
│   ├── layout/           # Project and workspace navigation
│   ├── storyboard/       # Planning, approved pages, and page visual development
│   ├── studio/           # Interactive application boundary
│   └── ui/               # Small reusable primitives
├── hooks/                # Centralized project state and persistence boundary
├── lib/                  # Onboarding, planning, prompts, and migration logic
├── services/             # Provider-independent future service contracts
└── types/                # Vizzy prototype domain models
```

The App Router page remains a Server Component. `StudioShell` is the explicit client boundary because project interactions and browser storage require client APIs. Business rules remain in framework-independent modules.

## Prototype workflow

1. Create a project.
2. Complete creative onboarding through chat.
3. Review or edit the Visual Style Bible.
4. Continue to story planning.
5. Choose a common page count or enter a custom value from 1 to 30.
6. Generate a clearly labelled suggested draft.
7. Select page cards to edit titles, descriptions, visual direction, narration, dialogue, and section labels.
8. Add, remove, or move pages using explicit controls.
9. Approve the complete sequence.
10. Open any approved beat in the Pages workspace.
11. Tune page-specific visual settings and review the prepared illustration prompt.
12. Save a deliberate prompt edit, add visual-reference metadata, or leave page notes through chat.

Editing, adding, deleting, or reordering an approved plan returns it to draft and requires reapproval.

## Story-planning architecture

`src/lib/story-planner.ts` is a deterministic, replaceable planning engine. It receives the saved project concept, output format, Style Bible, character notes, and requested page count. Structured numbered or bulleted notes retain their sequence. Sparse concepts receive editable structural placeholders instead of invented plot events.

The planner does not call or imitate an LLM. A future production planner can replace this module while preserving the project store and editorial UI contracts.

### StoryPlan

A `StoryPlan` belongs to one project and contains:

- Stable ID and project ID
- Saved synopsis
- Current target page count
- Draft or approved status
- Ordered `PageBeat` collection
- Created and updated timestamps

### PageBeat

One `PageBeat` represents one future illustrated page and contains:

- Stable ID and story-plan ID
- Normalized one-based order
- Title and scene description
- Visual direction
- Narration and dialogue
- Optional act or section label
- Draft or approved status
- Page-specific creative settings and illustration status
- Automatic and user-edited prompt state
- Visual-reference metadata and a dedicated page conversation
- Empty future image-version history

Nested comic-panel modeling remains intentionally out of scope.

## Local persistence

The complete prototype state is stored in browser `localStorage` under `vizzy:studio-state`. `useProjectStore` is the only browser-storage boundary. It persists projects, selection, workspace view, onboarding, Style Bible, chat histories, story plans, page edits and ordering, approval state, selected page, page creative settings, prepared prompts, reference metadata, and page conversations.

The storage envelope is now version 3. `src/lib/project-storage.ts` accepts version-1 and version-2 snapshots, adds missing planning or page-creation fields, and preserves existing story, style, character, selection, chat, plan, and page data. Migrated state is written as version 3 on the next state change.

`useSyncExternalStore` supplies a server-safe snapshot, so browser APIs are not read during server rendering.

Data remains local to the current browser profile and device. Clearing site data removes prototype projects.

## Phase 2.0B AI Job Architecture

Vizzy implements a client-side AI Job lifecycle architecture (`src/lib/job-manager.ts`) ensuring production-grade safety, resilience, and determinism across page generation and conversational refinement:

- **State Machine & Lifecycle**: Explicit transitions (`queued` -> `running` -> `completed` | `failed` | `cancelled`). Terminal states cannot transition or corrupt state.
- **Unique Job IDs**: Every task receives a cryptographically unique identifier (`job-${uuid}`).
- **In-Memory Registry**: Central registry tracks active and completed jobs, listeners, and execution contexts.
- **Request Revision Tracking**: Every page carries a `revision` counter that automatically bumps whenever prompt, settings, or references change.
- **Stale Response Protection**: When generation completes, incoming revisions are validated against current page revisions (`isResponseStale`). Outdated responses are safely discarded.
- **Cancellation via AbortController**: Active network requests are wired to native `AbortController` signals. Users can cancel at any time, immediately freeing resources.
- **Retry with Limits**: Failed jobs can be retried up to `maxRetries` (enforcing max 2 retries) with full error telemetry.
- **Provider Error Handling**: Structured error extraction captures upstream 429 rate limits, 503 unavailability, and network timeouts.
- **Idempotency & Deduplication**: Duplicate deliveries or identical version IDs are filtered via `deduplicateVersions`.
- **Project & Page Isolation**: Strict multi-project checks guarantee that responses for Page X in Project Y never touch Page Z or Project W.
- **Navigation Safety**: Navigating away from a page workspace automatically cancels pending jobs via `cancelActiveJobsForPage`.
- **Approval Safety**: Approved page artwork is strictly protected; newly generated options append with `selected: false` and `status: "generated"` without unseating approved images.
- **Refinement Lineage**: Iterative edits pass `parentVersionId` linked to the selected artwork, creating an unbroken lineage graph.
- **Configurable Mock Latency**: Deterministic mock latency controls for async simulation and end-to-end testing.

## Current limitations

- Planning is structural and deterministic, not generative AI.
- The planner recognizes structured sequences through numbered or bulleted lines; it does not deeply interpret scripts.
- Plans are limited to 30 pages for prototype usability.
- Page cards represent full illustrated pages, not nested comic panels.
- Local procedural previews are stylized compositions, not detailed prompt-generated artwork.
- Reference entries store metadata and external links only, not binaries or base64 payloads.
- Page chat preserves instructions verbatim and does not attempt semantic interpretation.
- There is no cloud sync, collaboration, authentication, or database.

## Planned architecture

`src/services/image-generation.ts` defines the future provider boundary for initial generation, multiple options, references, Style Bible context, and parent-version refinement. Sprint 1.3A intentionally provides no implementation, SDK, route, or generated image. Sprint 1.3B can implement that contract while consuming only approved page beats.

## Environment

Only `HF_TOKEN` is optional for prompt-based generation. Copy `.env.example` to `.env.local` to configure it; never commit secrets.
