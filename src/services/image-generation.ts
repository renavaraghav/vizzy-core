import type {
  ImageVersion,
  PageAspectRatio,
  VisualReferenceMetadata,
  VisualStyleBible,
} from "@/types/domain";

export interface GeneratePageImagesRequest {
  projectId: string;
  pageId: string;
  prompt: string;
  aspectRatio: PageAspectRatio;
  optionCount: number;
  styleBible: VisualStyleBible;
  references: VisualReferenceMetadata[];
}

export interface RefinePageImageRequest {
  projectId: string;
  pageId: string;
  parentVersionId: string;
  prompt: string;
  refinementInstructions: string;
  aspectRatio: PageAspectRatio;
  styleBible: VisualStyleBible;
  references: VisualReferenceMetadata[];
}

export interface ImageGenerationResult {
  generationBatchId: string;
  versions: ImageVersion[];
}

/** Provider boundary for initial, multi-option, reference-aware, and refinement workflows. */
export interface ImageGenerationService {
  generate(request: GeneratePageImagesRequest): Promise<ImageGenerationResult>;
  refine(request: RefinePageImageRequest): Promise<ImageGenerationResult>;
}
