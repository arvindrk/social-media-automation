/**
 * @core-types - Shared TypeScript types for the monorepo
 * These types mirror Prisma models but are framework-agnostic
 */

// =============================================================================
// Branded Types
// =============================================================================

/** Branded ID type for type-safe identifiers */
export type BrandId = string & { __brand: 'Id' };

/** Helper to create a branded ID */
export function createBrandId(id: string): BrandId {
  return id as BrandId;
}

// =============================================================================
// Theme Sub-Configs
// =============================================================================

/** Color palette for visual styling */
export interface ColorPalette {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

/** Visual styling configuration */
export interface VisualConfig {
  // Core visual identity
  colorPalette?: ColorPalette;
  fontStyle?: 'modern' | 'classic' | 'playful' | 'minimalist' | 'bold';
  
  // Content appearance
  avatarStyle?: string;
  backgroundStyle?: string;
  thumbnailStyle?: string;
  
  // Effects (all optional)
  visualEffects?: {
    transitions?: string[];
    overlays?: string[];
    filters?: string[];
  };
  
  // Branding (all optional)
  brandAssets?: {
    logoUrl?: string;
    watermarkUrl?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    watermarkOpacity?: number;
  };
}

/** Voice and personality configuration */
export interface VoiceConfig {
  // Required: Core voice identity
  tone: 'formal' | 'casual' | 'humorous' | 'inspirational' | 'educational' | 'edgy';
  language: string; // e.g., 'en-US', 'es-MX'
  
  // Optional: Personality tuning
  personality?: string[]; // e.g., ['witty', 'empathetic', 'bold']
  humorLevel?: number; // 0-10
  formalityLevel?: number; // 0-10 (0=very casual, 10=very formal)
  writingStyle?: 'concise' | 'storytelling' | 'listicle' | 'conversational' | 'poetic';
  emojiUsage?: 'none' | 'minimal' | 'moderate' | 'heavy';
  slangAllowed?: boolean;
}

/** CTA (Call-to-Action) preferences */
export interface CtaPreferences {
  style?: 'subtle' | 'direct' | 'urgent';
  templates?: string[];
}

/** Video length constraints */
export interface VideoLengthRange {
  minSeconds?: number;
  maxSeconds?: number;
  idealSeconds?: number;
}

/** Hashtag strategy configuration */
export interface HashtagStrategy {
  count?: number;
  mixRatio?: { niche?: number; broad?: number; branded?: number };
  banned?: string[];
  required?: string[];
}

/** Content structure configuration */
export interface ContentConfig {
  // Required: What formats to create
  postingFormats: ('reel' | 'story' | 'carousel' | 'single-image')[];
  
  // Optional: Content preferences
  hookStyles?: ('question' | 'bold-claim' | 'story' | 'statistic' | 'controversy' | 'relatable')[];
  ctaPreferences?: CtaPreferences;
  videoLengthRange?: VideoLengthRange;
  hashtagStrategy?: HashtagStrategy;
  captionLength?: 'short' | 'medium' | 'long';
}

/** Target demographic configuration */
export interface TargetDemographic {
  ageRange?: { min?: number; max?: number };
  interests?: string[];
  painPoints?: string[];
  gender?: 'all' | 'male' | 'female';
}

/** Cultural context configuration */
export interface CulturalContext {
  region?: string;
  referencesAllowed?: string[];
  sensitiveTopics?: string[];
}

/** Audience targeting configuration */
export interface AudienceConfig {
  // All optional - can be refined over time
  targetDemographic?: TargetDemographic;
  nicheTopics?: string[];
  avoidTopics?: string[];
  culturalContext?: CulturalContext;
  contentMaturity?: 'family-friendly' | 'teen' | 'adult' | 'edgy';
}

/** Audio configuration */
export interface AudioConfig {
  // All optional - audio preferences
  musicGenres?: string[];
  musicMood?: 'energetic' | 'calm' | 'dramatic' | 'uplifting' | 'neutral';
  voiceoverStyle?: 'energetic' | 'calm' | 'conversational' | 'dramatic' | 'whisper';
  voiceoverGender?: 'male' | 'female' | 'neutral';
  soundEffectsEnabled?: boolean;
  soundEffectStyle?: 'subtle' | 'prominent' | 'comedic';
}

/** Prompt templates and AI configuration */
export interface PromptConfig {
  // Required: Core AI instruction
  systemPrompt: string;
  
  // Optional: Custom prompts for different stages
  ideaGenerationPrompt?: string;
  scriptWritingPrompt?: string;
  captionWritingPrompt?: string;
  
  // Optional: Reference and constraints
  exampleContentUrls?: string[];
  brandVoiceGuidelines?: string;
  doNotMention?: string[];
  alwaysInclude?: string[];
}

// =============================================================================
// Theme
// =============================================================================

/** Complete theme configuration */
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  visualConfig: VisualConfig;
  voiceConfig: VoiceConfig;
  contentConfig: ContentConfig;
  audienceConfig: AudienceConfig;
  audioConfig: AudioConfig;
  promptConfig: PromptConfig;
}

/** Input for creating a new theme */
export interface CreateThemeInput {
  name: string;
  description?: string;
  visualConfig?: VisualConfig;
  voiceConfig: Pick<VoiceConfig, 'tone' | 'language'> & Partial<VoiceConfig>;
  contentConfig: Pick<ContentConfig, 'postingFormats'> & Partial<ContentConfig>;
  audienceConfig?: AudienceConfig;
  audioConfig?: AudioConfig;
  promptConfig: Pick<PromptConfig, 'systemPrompt'> & Partial<PromptConfig>;
}

// =============================================================================
// Account
// =============================================================================

/** Account configuration for a managed Instagram account */
export interface AccountConfig {
  id: string;
  name: string;
  instagramBusinessId: string;
  facebookPageId: string;
  timezone: string;
  postingWindowStart: string; // "HH:mm"
  postingWindowEnd: string;   // "HH:mm"
  minPostsPerDay: number;
  maxPostsPerDay: number;
  themeId: string;
}

/** Account with theme included */
export interface AccountWithTheme extends AccountConfig {
  theme: ThemeConfig;
}

// =============================================================================
// Job
// =============================================================================

/** Job status union type */
export type JobStatus = 'PENDING' | 'RUNNING' | 'FAILED' | 'POSTED';

/** Idea JSON structure */
export interface JobIdea {
  topic: string;
  hook: string;
  angle?: string;
  outline?: string[];
  targetEmotion?: string;
  keyMessage?: string;
}

/** Scripts JSON structure */
export interface JobScripts {
  voiceover?: string;
  captions?: string[];
  onScreenText?: string[];
  caption: string; // Instagram caption - required
  hashtags?: string[];
}

/** Assets JSON structure */
export interface JobAssets {
  images?: string[];
  videoClips?: string[];
  audioUrl?: string;
  musicUrl?: string;
  thumbnailUrl?: string;
}

/** Analytics JSON structure */
export interface JobAnalytics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
  fetchedAt?: string;
}

/** Job record - minimal view of a content creation job */
export interface JobRecord {
  id: string;
  accountId: string;
  scheduledFor: Date;
  status: JobStatus;
  idea?: JobIdea | null;
  scripts?: JobScripts | null;
  assets?: JobAssets | null;
  finalVideoUrl?: string | null;
  igMediaId?: string | null;
  error?: string | null;
  analytics?: JobAnalytics | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Input for creating a new job */
export interface CreateJobInput {
  accountId: string;
  scheduledFor: Date;
}

/** Input for updating a job */
export interface UpdateJobInput {
  status?: JobStatus;
  idea?: JobIdea;
  scripts?: JobScripts;
  assets?: JobAssets;
  finalVideoUrl?: string;
  igMediaId?: string;
  error?: string;
  analytics?: JobAnalytics;
}

// =============================================================================
// Defaults / Factories
// =============================================================================

/** Creates a default VisualConfig */
export function createDefaultVisualConfig(): VisualConfig {
  return {
    colorPalette: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      background: '#0f172a',
      text: '#f8fafc',
    },
    fontStyle: 'modern',
    avatarStyle: 'realistic',
    backgroundStyle: 'gradient',
    visualEffects: {
      transitions: ['fade', 'slide'],
      overlays: [],
      filters: [],
    },
    thumbnailStyle: 'bold-text',
  };
}

/** Creates a default VoiceConfig */
export function createDefaultVoiceConfig(): VoiceConfig {
  return {
    tone: 'casual',
    language: 'en-US',
    personality: ['friendly', 'knowledgeable'],
    humorLevel: 5,
    formalityLevel: 3,
    writingStyle: 'conversational',
    emojiUsage: 'moderate',
    slangAllowed: true,
  };
}

/** Creates a default ContentConfig */
export function createDefaultContentConfig(): ContentConfig {
  return {
    postingFormats: ['reel'],
    hookStyles: ['question', 'bold-claim'],
    ctaPreferences: {
      style: 'subtle',
      templates: ['Follow for more!', 'Save this for later!'],
    },
    videoLengthRange: {
      minSeconds: 15,
      maxSeconds: 60,
      idealSeconds: 30,
    },
    hashtagStrategy: {
      count: 10,
      mixRatio: { niche: 0.5, broad: 0.3, branded: 0.2 },
      banned: [],
      required: [],
    },
    captionLength: 'medium',
  };
}

/** Creates a default AudienceConfig */
export function createDefaultAudienceConfig(): AudienceConfig {
  return {
    targetDemographic: {
      ageRange: { min: 18, max: 35 },
      interests: [],
      painPoints: [],
    },
    nicheTopics: [],
    avoidTopics: [],
    culturalContext: {
      region: 'US',
      referencesAllowed: [],
      sensitiveTopics: [],
    },
    contentMaturity: 'teen',
  };
}

/** Creates a default AudioConfig */
export function createDefaultAudioConfig(): AudioConfig {
  return {
    musicGenres: ['pop', 'electronic'],
    musicMood: 'energetic',
    voiceoverStyle: 'conversational',
    soundEffectsEnabled: true,
    soundEffectStyle: 'subtle',
  };
}

/** Creates a default PromptConfig */
export function createDefaultPromptConfig(): PromptConfig {
  return {
    systemPrompt: 'You are a creative content creator for Instagram.',
    doNotMention: [],
    alwaysInclude: [],
  };
}

/** Creates a complete default ThemeConfig (without id) */
export function createDefaultThemeConfig(name: string): Omit<ThemeConfig, 'id'> {
  return {
    name,
    visualConfig: createDefaultVisualConfig(),
    voiceConfig: createDefaultVoiceConfig(),
    contentConfig: createDefaultContentConfig(),
    audienceConfig: createDefaultAudienceConfig(),
    audioConfig: createDefaultAudioConfig(),
    promptConfig: createDefaultPromptConfig(),
  };
}
