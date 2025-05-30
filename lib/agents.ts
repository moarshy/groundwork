import { type LucideIcon } from 'lucide-react';
// Import icons you'll use, similar to your iconMap in ConnectPageClient
import { Bot, MessageSquare, TextCursorInput, BarChart3, Mail, BrainCircuit } from 'lucide-react';

// If you want to use your existing iconMap approach:
export const agentIconMap = {
  Bot,
  MessageSquare,
  TextCursorInput,
  BarChart3,
  Mail,
  BrainCircuit,
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
    id: "js-text-summarizer",
    name: "JavaScript Text Summarizer",
    iconName: "TextCursorInput",
    description: "Condenses long texts into brief summaries using JS.",
    longDescription: "This agent uses a JavaScript-based NLP technique to extract key information and generate concise summaries from articles or text blocks. Ideal for quick insights.",
    inputsExpected: ["text_to_summarize"],
    outputsProvided: ["Summarized text (string)"],
    category: "Natural Language Processing",
  },
  {
    id: "js-sentiment-analyzer",
    name: "JavaScript Sentiment Analyzer",
    iconName: "MessageSquare",
    description: "Determines sentiment (positive, negative, neutral) of text.",
    longDescription: "Analyzes text to identify the underlying emotional tone. Useful for understanding customer feedback, social media comments, or product reviews, implemented purely in JavaScript.",
    inputsExpected: ["text_to_analyze"],
    outputsProvided: ["Sentiment (string: 'positive' | 'negative' | 'neutral')", "Confidence score (number)"],
    category: "Text Analysis",
  },
  // Add more JavaScript agents
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
]; 