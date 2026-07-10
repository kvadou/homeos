import { sendMessage, type ChatMessage } from "./claude";

export interface MarketingContentResult {
  title: string;
  content: string;
}

export interface AdCopyResult {
  headlines: string[];
  descriptions: string[];
  callToAction: string;
}

export interface CompetitorAnalysisResult {
  analysis: string;
  positioning: string;
  recommendations: string[];
}

export async function generateMarketingContent(
  type: "blog" | "social" | "email" | "ad_copy",
  platform: string | undefined,
  topic: string,
  tone?: string,
  audience?: string
): Promise<MarketingContentResult> {
  const typeInstructions: Record<string, string> = {
    blog: "Write an SEO-optimized blog post with a compelling title, introduction, body sections with subheadings, and a conclusion with a call to action.",
    social: `Write a social media post${platform ? ` optimized for ${platform}` : ""}. Include appropriate hashtags and a call to action. Keep it concise and engaging.`,
    email: "Write a marketing email with a compelling subject line as the title, a personalized greeting, persuasive body copy, and a clear call to action.",
    ad_copy: `Write advertising copy${platform ? ` for ${platform}` : ""}. Include a headline and persuasive body text with a strong call to action.`,
  };

  const systemPrompt = `You are an expert marketing content creator for HomeOS, a home management platform.
You create compelling, professional marketing content that drives engagement and conversions.

${typeInstructions[type] || typeInstructions.blog}

${tone ? `Tone: ${tone}` : "Tone: Professional and approachable"}
${audience ? `Target audience: ${audience}` : "Target audience: Homeowners"}

IMPORTANT: Respond with valid JSON only, no markdown code fences. Use this exact format:
{"title": "Your Title Here", "content": "Your content here with \\n for newlines"}`;

  const messages: ChatMessage[] = [
    { role: "user", content: `Create ${type} content about: ${topic}` },
  ];

  const response = await sendMessage(messages, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    return { title: parsed.title, content: parsed.content };
  } catch {
    const lines = response.split("\n").filter((l) => l.trim());
    return {
      title: lines[0]?.replace(/^#*\s*/, "") || `${type} content: ${topic}`,
      content: response,
    };
  }
}

export async function generateAdCopy(
  platform: string,
  product: string,
  audience: string,
  objective: string
): Promise<AdCopyResult> {
  const systemPrompt = `You are an expert digital advertising copywriter. Create ad copy for ${platform}.

Guidelines:
- Headlines should be punchy and under 30 characters each
- Descriptions should be compelling and under 90 characters each
- Include a strong call to action

IMPORTANT: Respond with valid JSON only, no markdown code fences. Use this exact format:
{"headlines": ["Headline 1", "Headline 2", "Headline 3"], "descriptions": ["Description 1", "Description 2"], "callToAction": "Your CTA"}`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Product: ${product}\nTarget audience: ${audience}\nObjective: ${objective}`,
    },
  ];

  const response = await sendMessage(messages, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    return {
      headlines: parsed.headlines || [],
      descriptions: parsed.descriptions || [],
      callToAction: parsed.callToAction || "Learn More",
    };
  } catch {
    return {
      headlines: ["HomeOS - Smart Home Management"],
      descriptions: [response.slice(0, 90)],
      callToAction: "Get Started",
    };
  }
}

export async function generateCompetitorAnalysis(
  competitors: string[]
): Promise<CompetitorAnalysisResult> {
  const systemPrompt = `You are a strategic marketing analyst for HomeOS, a home management platform that uses AI to help homeowners manage maintenance, track items, and maintain their homes.

Analyze the competitive landscape and provide strategic recommendations.

IMPORTANT: Respond with valid JSON only, no markdown code fences. Use this exact format:
{"analysis": "Detailed competitive analysis text", "positioning": "Recommended positioning strategy", "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]}`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Analyze these competitors and provide strategic insights: ${competitors.join(", ")}`,
    },
  ];

  const response = await sendMessage(messages, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    return {
      analysis: parsed.analysis || "",
      positioning: parsed.positioning || "",
      recommendations: parsed.recommendations || [],
    };
  } catch {
    return {
      analysis: response,
      positioning: "Differentiate through AI-powered home management",
      recommendations: [
        "Focus on AI capabilities as key differentiator",
        "Emphasize ease of use and time savings",
        "Build community through content marketing",
      ],
    };
  }
}
