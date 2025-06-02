import { type LucideIcon } from 'lucide-react';
// Import icons you'll use, similar to your iconMap in ConnectPageClient
import { Bot, BarChart3, Mail, BrainCircuit, Newspaper, Rss, FileText } from 'lucide-react';

// If you want to use your existing iconMap approach:
export const agentIconMap = {
  Bot,
  BarChart3,
  Mail,
  BrainCircuit,
  Newspaper,
  Rss,
  FileText,
  // Add other icons agents might use
};

export interface Agent {
  id: string; // Unique identifier for the agent, e.g., "js-text-summarizer"
  name: string;
  iconName: keyof typeof agentIconMap; // Referencing your iconMap
  description: string; // Short description for the card
  longDescription: string; // Detailed description for the modal
  inputsExpected: string[]; // User-friendly description of inputs, e.g., ["Email body text", "Tone (formal/casual)"]
  outputsProvided: string[]; // User-friendly description of outputs, e.g., ["Summarized email content"]
  category: string; // e.g., "Text Generation", "Data Processing"
  // (Optional) Placeholder for where the actual JS agent function/module lives
  // jsFunctionPath?: string; // e.g., '@/lib/ai-agents/summarizer'
}

export const availableAgents: Agent[] = [
  {
    id: "deep-research-marketing-agent",
    name: "Deep Research Marketing Agent",
    iconName: "BrainCircuit", // Or another suitable icon
    description: "Conducts deep research and generates social media posts.",
    longDescription: "This agent leverages Perplexity AI for in-depth research and OpenAI (GPT-4o) to craft engaging social media posts based on the research findings. It can tailor content to specific audiences, tones, and messaging angles.",
    inputsExpected: [
      "userQuery (string, required): The main topic or question for research.",
      "targetAudience (string, optional, default: 'general audience'): The intended audience for the social media post.",
      "toneStyle (string, optional, default: 'informative and engaging'): The desired tone and style of the post.",
      "keyMessageAngle (string, optional): Specific angle or focus for the research and post.",
      "callToAction (string, optional): Any call to action to include in the post.",
      "useCitations (boolean, optional, default: false): Whether to attempt to include citations in the post generation process.",
      "perplexityMaxOutputTokens (number, optional, default: 5000): Max tokens for Perplexity API output."
    ],
    outputsProvided: [
      "research_results (string): The raw research content from Perplexity.",
      "social_media_post_text (string): The generated social media post.",
      "suggested_hashtags (string): Space-separated suggested hashtags.",
      "citations_used_in_generation (array): List of citations passed to the post generator if useCitations was true."
    ],
    category: "Content Generation & Research",
  },
  {
    id: "hacker-news-summary-agent",
    name: "AI Hacker News Summarizer",
    iconName: "Newspaper",
    description: "Fetches top Hacker News stories and summarizes them using AI.",
    longDescription: "This agent retrieves the latest top stories from Hacker News, fetches their content (and optionally comments), and uses an AI model (OpenAI GPT) to provide concise summaries of articles and discussions. Helps you stay updated with tech trends and insights quickly.",
    inputsExpected: [
      "maxStories (number, optional, default: 10): Number of top stories to process.",
      "timeout (number, optional, default: 30000): Timeout in milliseconds for fetching article content.",
      "rateLimitDelay (number, optional, default: 300): Delay in ms between HN API calls.",
      "summarizeComments (boolean, optional, default: true): Whether to summarize comments using AI.",
      "maxComments (number, optional, default: 8): Maximum comments to fetch per story if summarizing.",
      "minCommentsForSummary (number, optional, default: 2): Minimum comments needed to trigger comment summary.",
      "maxConcurrentStories (number, optional, default: 3): Number of stories to process in parallel.",
      "maxConcurrentOpenAICalls (number, optional, default: 5): Max concurrent calls to OpenAI API."
    ],
    outputsProvided: [
      "markdownReport (string): A formatted Markdown string summarizing the Hacker News stories."
    ],
    category: "Content & News",
  },
]; 