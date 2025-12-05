/**
 * Database Seed Script
 * Creates realistic test data for Theme and Account
 * 
 * Run with: bun prisma/seed.ts
 */

import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '../generated/prisma';

// Load environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Prisma client
const adapter = new PrismaNeonHttp(DATABASE_URL, { fullResults: true });
const db = new PrismaClient({ adapter });

// =============================================================================
// Theme: AI & Tech Insights
// =============================================================================

const techTheme = {
  name: 'AI & Tech Insights',
  description: 'Tech-focused educational content for Instagram Reels. Makes complex AI and tech topics accessible and engaging.',

  visualConfig: {
    colorPalette: {
      primary: '#6366f1',      // Indigo (tech/modern feel)
      secondary: '#0ea5e9',    // Sky blue (trust/innovation)
      accent: '#f59e0b',       // Amber (highlights/CTAs)
      background: '#0f172a',   // Slate 900 (dark mode)
      text: '#f1f5f9',         // Slate 100
    },
    fontStyle: 'modern',
    avatarStyle: '3d-cartoon-male-tech-enthusiast',
    backgroundStyle: 'gradient-mesh-dark',
    thumbnailStyle: 'bold-text-with-emoji',
    visualEffects: {
      transitions: ['zoom-in', 'slide-left', 'fade'],
      overlays: ['subtle-grain', 'vignette'],
      filters: ['high-contrast'],
    },
    brandAssets: {
      watermarkPosition: 'bottom-right',
      watermarkOpacity: 0.3,
    },
  },

  voiceConfig: {
    tone: 'educational',
    language: 'en-US',
    personality: ['curious', 'enthusiastic', 'approachable', 'knowledgeable'],
    humorLevel: 4,
    formalityLevel: 3,
    writingStyle: 'conversational',
    emojiUsage: 'moderate',
    slangAllowed: true,
  },

  contentConfig: {
    postingFormats: ['reel'],
    hookStyles: ['bold-claim', 'question', 'statistic'],
    ctaPreferences: {
      style: 'subtle',
      templates: [
        'Follow for daily AI insights 🤖',
        'Save this for later!',
        'Share with a friend who needs to see this',
        'Comment your thoughts below 👇',
      ],
    },
    videoLengthRange: {
      minSeconds: 30,
      maxSeconds: 90,
      idealSeconds: 45,
    },
    hashtagStrategy: {
      count: 12,
      mixRatio: { niche: 0.5, broad: 0.3, branded: 0.2 },
      required: ['#AI', '#Tech', '#FutureTech'],
      banned: ['#followforfollow', '#f4f', '#spam'],
    },
    captionLength: 'medium',
  },

  audienceConfig: {
    targetDemographic: {
      ageRange: { min: 22, max: 45 },
      gender: 'all',
      interests: [
        'artificial intelligence',
        'startups',
        'productivity',
        'tech news',
        'programming',
        'gadgets',
        'future tech',
      ],
      painPoints: [
        'overwhelmed by AI news',
        'want to stay ahead of tech trends',
        'need simple explanations of complex topics',
      ],
    },
    nicheTopics: [
      'AI tools',
      'ChatGPT tips',
      'automation',
      'tech productivity',
      'AI news explained',
      'future of work',
    ],
    avoidTopics: [
      'politics',
      'religion',
      'controversial opinions',
      'get-rich-quick schemes',
      'crypto shilling',
    ],
    culturalContext: {
      region: 'US',
      referencesAllowed: ['Silicon Valley', 'tech companies', 'pop culture'],
      sensitiveTopics: ['job displacement', 'privacy concerns'],
    },
    contentMaturity: 'teen',
  },

  audioConfig: {
    musicGenres: ['electronic', 'lo-fi', 'ambient'],
    musicMood: 'uplifting',
    voiceoverStyle: 'energetic',
    voiceoverGender: 'male',
    soundEffectsEnabled: true,
    soundEffectStyle: 'subtle',
  },

  promptConfig: {
    systemPrompt: `You are an AI and tech content creator for Instagram Reels. Your goal is to make complex tech topics accessible and engaging for a general audience.

Your style:
- Explain like you're talking to a smart friend who isn't a tech expert
- Use analogies and real-world examples
- Keep energy high but not over-the-top
- Always provide actionable takeaways
- Be genuinely curious and excited about tech

Format for scripts:
- Hook (first 2 seconds must grab attention)
- Quick context (why this matters)
- Main content (2-3 key points max)
- CTA (subtle, value-focused)`,

    ideaGenerationPrompt:
      'Generate viral-worthy content ideas about recent AI developments, useful tech tools, or productivity hacks. Focus on topics that would make someone stop scrolling.',

    scriptWritingPrompt:
      'Write a punchy, fast-paced script optimized for 45-second Reels. Use pattern interrupts every 5-7 seconds. Start with a controversial or surprising hook.',

    captionWritingPrompt:
      'Write an engaging caption that adds value beyond the video. Include a question to drive comments.',

    brandVoiceGuidelines:
      'Sound like a tech-savvy friend sharing discoveries, not a corporate account or influencer trying too hard.',

    doNotMention: ['competitor products by name', 'unverified claims', 'financial advice'],
    alwaysInclude: ['practical takeaway', 'reason why this matters now'],
  },
};

// =============================================================================
// Account: TechPulse Daily
// =============================================================================

const techPulseAccount = {
  name: 'TechPulse Daily',
  instagramBusinessId: '17841400123456789',
  facebookPageId: '100123456789012',
  accessTokenEncrypted: 'encrypted_placeholder_token_replace_in_production',
  timezone: 'America/Los_Angeles',
  postingWindowStart: '11:00',
  postingWindowEnd: '20:00',
  minPostsPerDay: 2,
  maxPostsPerDay: 4,
};

// =============================================================================
// Seed Function
// =============================================================================

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // Check if theme already exists
  const existingTheme = await db.theme.findFirst({
    where: { name: techTheme.name },
  });

  let theme;
  if (existingTheme) {
    console.log(`⚠️  Theme "${techTheme.name}" already exists, skipping...`);
    theme = existingTheme;
  } else {
    // Create Theme
    theme = await db.theme.create({
      data: {
        name: techTheme.name,
        description: techTheme.description,
        visualConfig: techTheme.visualConfig,
        voiceConfig: techTheme.voiceConfig,
        contentConfig: techTheme.contentConfig,
        audienceConfig: techTheme.audienceConfig,
        audioConfig: techTheme.audioConfig,
        promptConfig: techTheme.promptConfig,
      },
    });
    console.log(`✅ Created Theme: "${theme.name}" (${theme.id})`);
  }

  // Check if account already exists
  const existingAccount = await db.account.findFirst({
    where: { name: techPulseAccount.name },
  });

  if (existingAccount) {
    console.log(`⚠️  Account "${techPulseAccount.name}" already exists, skipping...`);
  } else {
    // Create Account linked to Theme
    const account = await db.account.create({
      data: {
        ...techPulseAccount,
        themeId: theme.id,
      },
    });
    console.log(`✅ Created Account: "${account.name}" (${account.id})`);
    console.log(`   - Timezone: ${account.timezone}`);
    console.log(`   - Posting Window: ${account.postingWindowStart} - ${account.postingWindowEnd}`);
    console.log(`   - Posts/Day: ${account.minPostsPerDay} - ${account.maxPostsPerDay}`);
  }

  console.log('\n🎉 Seed complete!');
}

// Run seed
seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

