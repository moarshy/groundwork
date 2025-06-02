const fetch = require('node-fetch'); // npm install node-fetch
const { JSDOM } = require('jsdom'); // npm install jsdom
// dotenv.config(); // Removed, assuming handled by main application

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Configuration
const OPENAI_MODEL = "gpt-3.5-turbo";
const DEFAULT_CONFIG = {
    maxStories: 10,
    timeout: 30000, // 30 seconds in milliseconds
    rateLimitDelay: 300, // 0.3 seconds
    maxContentLength: 5000,
    summarizeComments: true,
    maxComments: 8,
    minCommentsForSummary: 2,
    maxConcurrentStories: 3,
    maxConcurrentOpenAICalls: 5
};

/**
 * Simple semaphore implementation for rate limiting
 */
class Semaphore {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentConcurrency = 0;
        this.queue = [];
    }

    async acquire() {
        return new Promise((resolve) => {
            if (this.currentConcurrency < this.maxConcurrency) {
                this.currentConcurrency++;
                resolve();
            } else {
                this.queue.push(resolve);
            }
        });
    }

    release() {
        this.currentConcurrency--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.currentConcurrency++;
            next();
        }
    }

    async execute(fn) {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }
}

/**
 * Utility function to decode HTML entities
 */
function decodeHTMLEntities(text) {
    const dom = new JSDOM();
    const doc = dom.window.document;
    const element = doc.createElement('div');
    element.innerHTML = text;
    return element.textContent || element.innerText || '';
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Story class to represent a Hacker News story
 */
class Story {
    constructor(data) {
        this.id = data.id;
        this.title = (data.title || '').trim();
        this.url = data.url || null;
        this.score = data.score || 0;
        this.author = data.by || '';
        this.time = data.time || 0;
        this.descendants = data.descendants || 0;
        this.summary = null;
        this.comments_summary = null;
        this._comment_ids = data.kids || [];

        if (!this.title) {
            throw new Error('Title cannot be empty');
        }
    }

    get publishedDateTime() {
        return new Date(this.time * 1000);
    }

    get domain() {
        if (!this.url) return null;
        try {
            return new URL(this.url).hostname;
        } catch {
            return null;
        }
    }
}

/**
 * Makes a request to OpenAI API
 */
async function callOpenAI(messages, systemPrompt = null, maxTokens = 150) {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    const messagesArray = systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...messages]
        : messages;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: messagesArray,
            max_tokens: maxTokens,
            temperature: 0.0,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Main Hacker News Agent Class
 */
class HackerNewsAgent {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.baseUrl = "https://hacker-news.firebaseio.com/v0";

        // Ensure maxConcurrentStories is at least 1
        if (this.config.maxConcurrentStories <= 0) {
            console.warn(`[HackerNewsAgent] maxConcurrentStories was ${this.config.maxConcurrentStories}, defaulting to ${DEFAULT_CONFIG.maxConcurrentStories} (or 1 if default is also non-positive).`);
            this.config.maxConcurrentStories = DEFAULT_CONFIG.maxConcurrentStories > 0 ? DEFAULT_CONFIG.maxConcurrentStories : 1;
        }
        // Ensure maxConcurrentOpenAICalls is at least 1 as well for similar reasons
        if (this.config.maxConcurrentOpenAICalls <= 0) {
            console.warn(`[HackerNewsAgent] maxConcurrentOpenAICalls was ${this.config.maxConcurrentOpenAICalls}, defaulting to ${DEFAULT_CONFIG.maxConcurrentOpenAICalls} (or 1 if default is also non-positive).`);
            this.config.maxConcurrentOpenAICalls = DEFAULT_CONFIG.maxConcurrentOpenAICalls > 0 ? DEFAULT_CONFIG.maxConcurrentOpenAICalls : 1;
        }

        // Validate OpenAI API key
        if (!OPENAI_API_KEY) {
            throw new Error(
                "OPENAI_API_KEY environment variable is required. " +
                "This agent requires AI summarization capabilities. " +
                "Get your API key from: https://platform.openai.com/api-keys"
            );
        }

        // Initialize semaphores for rate limiting
        this.openaiSemaphore = new Semaphore(this.config.maxConcurrentOpenAICalls);
        this.hnApiSemaphore = new Semaphore(5); // Conservative limit for HN API
    }

    /**
     * Get list of top story IDs
     */
    async getTopStories() {
        console.log('[HackerNewsAgent] typeof fetch in getTopStories (before try):', typeof fetch); // DIAGNOSTIC LOG
        try {
            console.log('[HackerNewsAgent] typeof fetch in getTopStories (inside try, before fetch call):', typeof fetch); // DIAGNOSTIC LOG
            const response = await fetch(`${this.baseUrl}/topstories.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const storyIds = await response.json();
            return storyIds.slice(0, this.config.maxStories);
        } catch (error) {
            console.error(`[HackerNewsAgent] Error in getTopStories: ${error.message}`); // Added console.error for better visibility
            throw new Error(`Failed to fetch top stories: ${error.message}`);
        }
    }

    /**
     * Get details for a specific story with rate limiting
     */
    async getStoryDetails(storyId) {
        return await this.hnApiSemaphore.execute(async () => {
            try {
                const response = await fetch(`${this.baseUrl}/item/${storyId}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (!data || data.type !== 'story') {
                    return null;
                }

                const story = new Story(data);
                return story;

            } catch (error) {
                console.log(`⚠️  Error fetching story ${storyId}: ${error.message}`);
                return null;
            } finally {
                await sleep(this.config.rateLimitDelay);
            }
        });
    }

    /**
     * Get details for a specific comment with rate limiting
     */
    async getCommentDetails(commentId) {
        return await this.hnApiSemaphore.execute(async () => {
            try {
                const response = await fetch(`${this.baseUrl}/item/${commentId}.json`);
                if (!response.ok) {
                    return null;
                }

                const data = await response.json();

                if (!data || data.type !== 'comment' || data.deleted || data.dead) {
                    return null;
                }

                return {
                    id: data.id,
                    author: data.by || '',
                    text: data.text || '',
                    time: data.time || 0,
                    kids: data.kids || []
                };

            } catch (error) {
                return null;
            } finally {
                await sleep(100); // Smaller delay for comments
            }
        });
    }

    /**
     * Fetch comments for a story with concurrent processing
     */
    async getStoryComments(story) {
        if (!story._comment_ids || story._comment_ids.length === 0) {
            return [];
        }

        const commentIds = story._comment_ids.slice(0, this.config.maxComments);
        console.log(`   💬 Fetching ${commentIds.length} comments concurrently...`);

        // Fetch comments concurrently
        const commentPromises = commentIds.map(id => this.getCommentDetails(id));
        const commentsData = await Promise.allSettled(commentPromises);

        const commentsText = [];
        for (const result of commentsData) {
            if (result.status === 'fulfilled' && result.value && result.value.text) {
                const comment = result.value;
                let cleanText = comment.text;

                // Handle common HN HTML patterns
                cleanText = cleanText.replace(/<p>/g, '\n');
                cleanText = cleanText.replace(/<br\s*\/>/g, '\n');
                cleanText = cleanText.replace(/<[^>]+>/g, ' ');

                // Decode HTML entities
                cleanText = decodeHTMLEntities(cleanText);

                // Clean up whitespace
                cleanText = cleanText.replace(/\s+/g, ' ').trim();

                if (cleanText.length > 50) { // Only include substantial comments
                    const authorText = `[${comment.author}]: ${cleanText}`;
                    commentsText.push(authorText);
                }
            }
        }

        console.log(`   💬 Successfully fetched ${commentsText.length} meaningful comments`);
        return commentsText;
    }

    /**
     * Fetch article content with improved text extraction
     */
    async getArticleContent(url) {
        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            };

            const response = await fetch(url, { headers, timeout: this.config.timeout });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let text = await response.text();

            // Remove scripts, styles, and other non-content elements
            text = text.replace(/<script[^>]*>.*?<\/script>/gis, '');
            text = text.replace(/<style[^>]*>.*?<\/style>/gis, '');
            text = text.replace(/<nav[^>]*>.*?<\/nav>/gis, '');
            text = text.replace(/<header[^>]*>.*?<\/header>/gis, '');
            text = text.replace(/<footer[^>]*>.*?<\/footer>/gis, '');

            // Remove HTML tags
            text = text.replace(/<[^>]+>/g, ' ');

            // Decode HTML entities
            text = decodeHTMLEntities(text);

            // Clean up whitespace
            text = text.replace(/\s+/g, ' ').trim();

            // Extract meaningful content
            const sentences = text.split(/[.!?]+/);
            const meaningfulSentences = sentences
                .map(s => s.trim())
                .filter(s =>
                    s.length > 40 &&
                    !['cookie', 'privacy policy', 'subscribe', 'newsletter',
                      'copyright', 'all rights reserved', 'click here']
                      .some(skip => s.toLowerCase().includes(skip))
                );

            if (meaningfulSentences.length > 0) {
                const content = meaningfulSentences.slice(0, 8).join('. ');
                return content.substring(0, this.config.maxContentLength);
            }

            return text.substring(0, this.config.maxContentLength) || null;

        } catch (error) {
            console.log(`⚠️  Error fetching content from ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * AI-powered summarization with rate limiting
     */
    async aiSummarize(content, title) {
        if (!content || content.trim().length < 50) {
            return `📰 ${title}\n🤖 Content not available or too short to summarize.`;
        }

        return await this.openaiSemaphore.execute(async () => {
            try {
                console.log(`   🤖 Generating AI summary...`);

                const systemPrompt = `You are a helpful assistant that summarizes Hacker News articles concisely. Focus on the key technical insights, business implications, or interesting findings. Provide a 2-3 sentence summary that captures the essence of the article.`;

                const userPrompt = `Please provide a concise summary of this article:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 3000)}`;

                const summary = await callOpenAI([{ role: "user", content: userPrompt }], systemPrompt);

                console.log(`   ✅ AI summary generated successfully`);
                return `📰 ${title}\n🤖 ${summary}`;

            } catch (error) {
                const errorMsg = `AI summarization failed (${error.constructor.name}: ${error.message.substring(0, 100)})`;
                console.log(`⚠️  ${errorMsg}`);
                return `📰 ${title}\n❌ ${errorMsg}`;
            }
        });
    }

    /**
     * AI-powered comment summarization with rate limiting
     */
    async aiSummarizeComments(comments, title) {
        if (comments.length < this.config.minCommentsForSummary) {
            return null; // Return null for insufficient comments
        }

        return await this.openaiSemaphore.execute(async () => {
            try {
                console.log(`   🤖 Generating AI comment summary for ${comments.length} comments...`);

                // Combine comments into a single text, limiting size
                let commentsText = comments.slice(0, 15).join('\n\n');

                if (commentsText.length > 4000) {
                    commentsText = commentsText.substring(0, 4000) + '...';
                }

                const systemPrompt = `You are a helpful assistant that summarizes Hacker News comment discussions. Focus on the main themes, debates, technical insights, and community sentiment. Identify key points of agreement/disagreement and interesting technical details mentioned by users.`;

                const userPrompt = `Please provide a 2-3 sentence summary of the key themes and insights from these Hacker News comments about '${title}':\n\n${commentsText}`;

                const summary = await callOpenAI([{ role: "user", content: userPrompt }], systemPrompt);

                console.log(`   ✅ AI comment summary generated successfully`);
                return `💬 Community Discussion: ${summary}`;

            } catch (error) {
                const errorMsg = `AI comment summarization failed (${error.constructor.name}: ${error.message.substring(0, 100)})`;
                console.log(`⚠️  ${errorMsg}`);
                return null; // Return null instead of error message for cleaner output
            }
        });
    }

    /**
     * Process a single story with concurrent article and comment processing
     */
    async processStory(storyId, index, total) {
        console.log(`📖 Processing story ${index}/${total} (ID: ${storyId})`);

        try {
            // Get story details
            const story = await this.getStoryDetails(storyId);
            if (!story) {
                console.log(`   ❌ Failed to fetch story details`);
                return null;
            }

            console.log(`   📰 ${story.title}`);
            console.log(`   🔥 Score: ${story.score} | 💬 Comments: ${story.descendants}`);

            // Create concurrent tasks for article and comments
            const tasks = [];

            // Task 1: Get article content and generate AI summary
            const processArticle = async () => {
                let content = "";
                if (story.url) {
                    console.log(`   🌐 Fetching: ${story.domain}`);
                    content = await this.getArticleContent(story.url);
                }
                return await this.aiSummarize(content || "", story.title);
            };

            tasks.push(processArticle());

            // Task 2: Get and summarize comments if enabled
            const processComments = async () => {
                if (!this.config.summarizeComments) {
                    return null;
                }

                if (story.descendants === 0) {
                    return null;
                }

                const comments = await this.getStoryComments(story);
                if (comments.length > 0) {
                    return await this.aiSummarizeComments(comments, story.title);
                } else {
                    return null;
                }
            };

            tasks.push(processComments());

            // Process article and comments concurrently
            const [summary, commentsummary] = await Promise.all(tasks);

            story.summary = summary;
            story.comments_summary = commentsummary;

            console.log(`   ✅ Story ${index} processed successfully`);
            return story;

        } catch (error) {
            console.log(`   ❌ Error processing story ${storyId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Main function to fetch and summarize top stories with concurrent processing
     */
    async run() {
        console.log(`🚀 Starting AI-Powered Hacker News Agent`);
        console.log(`📊 Fetching top ${this.config.maxStories} stories...`);
        console.log(`⚡ Concurrent processing: ${this.config.maxConcurrentStories} stories, ${this.config.maxConcurrentOpenAICalls} AI calls`);

        // Get top story IDs
        const storyIds = await this.getTopStories();
        console.log(`✅ Found ${storyIds.length} story IDs`);

        // Process stories with controlled concurrency
        const storySemaphore = new Semaphore(this.config.maxConcurrentStories);

        const processWithSemaphore = async (storyId, index) => {
            return await storySemaphore.execute(async () => {
                return await this.processStory(storyId, index, storyIds.length);
            });
        };

        // Create tasks for concurrent processing
        const tasks = storyIds.map((storyId, index) =>
            processWithSemaphore(storyId, index + 1)
        );

        console.log(`🔄 Processing ${tasks.length} stories concurrently...`);

        // Process all stories concurrently and collect results
        const storyResults = await Promise.allSettled(tasks);

        // Filter successful results
        const stories = [];
        let failedCount = 0;

        for (const result of storyResults) {
            if (result.status === 'fulfilled' && result.value !== null) {
                stories.push(result.value);
            } else {
                failedCount++;
                if (result.status === 'rejected') {
                    console.log(`⚠️  Story processing failed: ${result.reason}`);
                }
            }
        }

        console.log(`\n✅ Successfully processed ${stories.length} stories`);
        if (failedCount > 0) {
            console.log(`⚠️  ${failedCount} stories failed to process`);
        }

        const report = {
            generated_at: new Date().toISOString(),
            total_stories: stories.length,
            stories: stories,
            config: this.config
        };

        return HackerNewsAgent.formatReportAsMarkdown(report);
    }

    static escapeSlackMrkdwn(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    static formatReportAsMarkdown(report) {
        let markdown = `# Hacker News Summary Report (${new Date().toLocaleDateString()})\n\n`;

        if (report.errors && report.errors.length > 0) {
            markdown += `## Errors Encountered\n`;
            report.errors.forEach(error => {
                markdown += `- ${HackerNewsAgent.escapeSlackMrkdwn(error)}\n`; // Escape errors too
            });
            markdown += '\n';
        }

        markdown += `## Top ${report.stories.length} Stories\n\n`;

        report.stories.forEach((story, index) => {
            const escapedTitle = HackerNewsAgent.escapeSlackMrkdwn(story.title);
            markdown += `### ${index + 1}. ${escapedTitle}\n`;
            
            // Ensure story.url is defined and cleaned for the link text part
            const linkText = escapedTitle.replace(/[|<>]/g, ''); // Remove problematic characters for link display text
            const storyLink = story.url ? `<${story.url}|${linkText}>` : linkText;
            markdown += `*Link:* ${storyLink}\n`;
            markdown += `*Score:* ${story.score}\n`;

            if (story.summary) {
                markdown += `*Summary:* ${HackerNewsAgent.escapeSlackMrkdwn(story.summary)}\n`;
            }
            if (story.comments_summary) {
                markdown += `*Comments Summary:* ${HackerNewsAgent.escapeSlackMrkdwn(story.comments_summary)}\n`;
            }
            markdown += '\n';
        });
        // console.log("Generated Markdown (pre-final escape):\n", markdown); // For debugging
        return HackerNewsAgent.escapeSlackMrkdwn(markdown); // Final escape of the whole thing
    }

    /**
     * Print formatted summary report
     */
    static printReport(report) {
        console.log("\n" + "=".repeat(80));
        console.log("🤖 AI-POWERED HACKER NEWS SUMMARY REPORT");
        console.log(`🕒 Generated: ${new Date(report.generated_at).toLocaleString()}`);
        console.log(`📈 Stories: ${report.total_stories}`);
        console.log(`⚡ Concurrency: ${this.config.maxConcurrentStories} stories, ${this.config.maxConcurrentOpenAICalls} AI calls`);
        if (report.config.summarizeComments) {
            console.log(`💬 Comments: AI-powered analysis (max ${report.config.maxComments} per story)`);
        }
        console.log("=".repeat(80));

        report.stories.forEach((story, index) => {
            console.log(`\n${index + 1}. ${story.summary}`);

            // Display comments summary only if available and meaningful
            if (story.comments_summary) {
                console.log(`   ${story.comments_summary}`);
            }

            console.log(`   👤 ${story.author} | 🔥 ${story.score} points | 💬 ${story.descendants} comments`);
            console.log(`   🕒 ${story.publishedDateTime.toLocaleString()}`);
            if (story.url) {
                console.log(`   🔗 ${story.url}`);
            }
            console.log("-".repeat(60));
        });
    }

    /**
     * Save report to JSON file
     */
    static async saveReport(report, filename = null) {
        const fs = require('fs/promises'); 
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            filename = `hn_summary_${timestamp}.json`;
        }

        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        return filename;
    }
}

// Example usage (for standalone testing)
async function main() {
    console.log("🚀 AI-Powered Hacker News Summarization Agent");
    console.log("📋 This agent uses OpenAI for intelligent summarization");
    console.log("⚡ Features concurrent processing for maximum speed");

    const config = {
        maxStories: 10,
        timeout: 30000,
        rateLimitDelay: 300,
        summarizeComments: true,
        maxComments: 8,
        minCommentsForSummary: 2,
        maxConcurrentStories: 4,
        maxConcurrentOpenAICalls: 6
    };

    try {
        const agent = new HackerNewsAgent(config);
        const report = await agent.run();
        HackerNewsAgent.printReport(report);
        const filename = await HackerNewsAgent.saveReport(report);
        console.log(`\n💾 Report saved to: ${filename}`);

    } catch (error) {
        if (error.message.includes("OPENAI_API_KEY")) {
            console.log(`\n❌ ${error.message}`);
            console.log("\n🔧 Setup Instructions:");
            console.log("1. Get your API key: https://platform.openai.com/api-keys");
            console.log("2. Set environment variable: export OPENAI_API_KEY='sk-your-key-here'");
            console.log("3. Run the agent again");
        } else {
            console.log(`\n❌ Configuration Error: ${error.message}`);
        }
    }
}

// Export for use as module
module.exports = { HackerNewsAgent, Story };

// Run if called directly (for standalone testing)
if (require.main === module) {
    const fs = require('fs/promises'); // fs is only needed for main() in standalone
    main().catch(console.error);
} 