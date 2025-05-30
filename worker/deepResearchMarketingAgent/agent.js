require('dotenv').config(); // npm install dotenv
const nodeFetch = require('node-fetch'); // npm install node-fetch
const fetch = nodeFetch.default || nodeFetch; // Handle ESM default export if present
// Note: Consider using global fetch in Node.js 18+ or Next.js environment if available

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Configuration
const PERPLEXITY_MODEL = "sonar-deep-research";
const PERPLEXITY_MAX_OUTPUT_TOKENS = 5000;
const PERPLEXITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const OPENAI_MODEL = "gpt-4o";

/**
 * Makes a request to OpenAI API to generate structured responses
 */
async function callOpenAI(messages, systemPrompt = null) {
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
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Generates a detailed research prompt for Perplexity API
 */
async function generateResearchPrompt(userQuery, targetAudience, keyMessageAngle = null) {
    const systemPrompt = `You are an expert prompt engineer. Generate a detailed research prompt for the Perplexity sonar-deep-research model based on user inputs. The prompt should guide the model to conduct exhaustive research and provide expert-level insights suitable for generating a detailed report or blog post.\n\nReturn only the research prompt, nothing else.`;

    const userPrompt = `Generate a comprehensive research prompt for:\n- User Query: ${userQuery}\n- Target Audience: ${targetAudience}\n${keyMessageAngle ? `- Key Message Angle: ${keyMessageAngle}` : ''}\n\nThe prompt should instruct the Perplexity model to conduct in-depth research and analysis.`;

    const messages = [{ role: "user", content: userPrompt }];
    return await callOpenAI(messages, systemPrompt);
}

/**
 * Calls the Perplexity API with the sonar-deep-research model
 */
async function callPerplexityAPI(researchPrompt, apiKey = PERPLEXITY_API_KEY, maxOutputTokens = PERPLEXITY_MAX_OUTPUT_TOKENS) {
    if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY is not set or provided");
    }

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const systemMessage = `You are an expert-level research analyst using the sonar-deep-research model. Your task is to conduct an exhaustive search on the provided topic, synthesize insights from hundreds of sources, and generate a detailed, coherent, and well-structured report. Focus on providing factual information, in-depth analysis, and actionable insights. Avoid conversational filler. The output should be suitable for informing a white paper, a detailed go-to-market plan, or educational content.`;

    const payload = {
        model: PERPLEXITY_MODEL,
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: researchPrompt }
        ],
        max_tokens: maxOutputTokens
    };

    console.log(`Calling Perplexity API with prompt (first 100 chars): ${researchPrompt.substring(0, 100)}...`);

    try {
        // const controller = new AbortController(); // Node-fetch doesn't use AbortController instance directly in signal
        // const timeoutId = setTimeout(() => controller.abort(), PERPLEXITY_TIMEOUT);
        // For node-fetch, timeout is often handled differently, e.g. with a wrapper or a library like 'promise-timeout'
        // For simplicity, direct timeout via AbortController might not work as expected with older node-fetch.
        // Node.js 16+ has native AbortController support for fetch.

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            // signal: controller.signal, // Ensure your node-fetch version and Node env support this
            timeout: PERPLEXITY_TIMEOUT // Some versions of node-fetch accept a timeout option directly
        });

        // clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();

        if (responseData.usage) {
            console.log(`Perplexity API Usage: PromptTokens=${responseData.usage.prompt_tokens || 'N/A'}, CompletionTokens=${responseData.usage.completion_tokens || 'N/A'}, ReasoningTokens=${responseData.usage.reasoning_tokens || 'N/A'}, NumSearchQueries=${responseData.usage.num_search_queries || 'N/A'}`);
        }

        if (responseData.choices && responseData.choices.length > 0) {
            let messageContent = responseData.choices[0].message?.content || "";
            const citations = responseData.citations || [];

            if (messageContent.startsWith("<think>")) {
                const thinkEndIndex = messageContent.indexOf("</think>");
                if (thinkEndIndex !== -1) {
                    messageContent = messageContent.substring(thinkEndIndex + "</think>".length).trim();
                }
            }

            if (!messageContent) {
                throw new Error("Perplexity research returned empty content");
            }

            return { content: messageContent, citations };
        } else {
            throw new Error(`Could not extract content from Perplexity API. Response: ${JSON.stringify(responseData, null, 2)}`);
        }
    } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) { // Broader timeout check
            throw new Error("Perplexity API request timed out");
        }
        throw new Error(`Perplexity API request failed: ${error.message}`);
    }
}

/**
 * Generates a social media post using research results
 */
async function generateSocialMediaPost(
    researchResults,
    originalQuery,
    targetAudience,
    toneStyle,
    keyMessageAngle = null,
    callToAction = null,
    citationsList = null
) {
    const systemPrompt = `You are an expert social media content creator. Generate an engaging and informative social media blog post using the provided research findings. The post should be tailored to the specified audience, tone, and include any requested elements.\n\nReturn a JSON object with:\n{\n    "social_media_post_text": "The fully generated text content for the social media blog post",\n    "suggested_hashtags": "3-5 relevant hashtags, space-separated (e.g., '#AI #FutureOfWork #TechTrends')"\n}`;

    const userPrompt = `Generate a social media post based on:\n\nResearch Results: ${researchResults}\n\nOriginal Query: ${originalQuery}\nTarget Audience: ${targetAudience}\nTone/Style: ${toneStyle}\n${keyMessageAngle ? `Key Message Angle: ${keyMessageAngle}` : ''}\n${callToAction ? `Call to Action: ${callToAction}` : ''}\n${citationsList && citationsList.length > 0 ? `Citations to include: ${JSON.stringify(citationsList)}` : ''}\n\nCreate an engaging, informative post that incorporates the research findings and meets the specified requirements.`;

    const messages = [{ role: "user", content: userPrompt }];
    const response = await callOpenAI(messages, systemPrompt);
    
    try {
        return JSON.parse(response);
    } catch (error) {
        console.warn("Failed to parse OpenAI response as JSON for social media post. Returning text directly.", error);
        return {
            social_media_post_text: response,
            suggested_hashtags: generateFallbackHashtags(response, originalQuery, targetAudience)
        };
    }
}

/**
 * Fallback hashtag generator
 */
function generateFallbackHashtags(textContent, originalQuery, targetAudience, maxHashtags = 5) {
    const words = new Set();
    
    const queryWords = originalQuery.split(' ')
        .filter(word => word.length > 3 && /^[a-zA-Z0-9]+$/.test(word))
        .map(word => word.toLowerCase());
    queryWords.forEach(word => words.add(word));
    
    const contentKeywords = textContent.split(' ')
        .filter(word => word.length > 3 && /^[a-zA-Z0-9]+$/.test(word.replace(/[#.,!:;'"]/g, '')))
        .map(word => word.replace(/[#.,!:;'"]/g, '').toLowerCase())
        .slice(0, 10); // Take more keywords to increase chance of good hashtags
    contentKeywords.forEach(word => words.add(word));
    
    if (targetAudience && targetAudience.toLowerCase() !== "general audience") {
        const audienceTag = targetAudience.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (audienceTag.length > 2) {
            words.add(audienceTag);
        }
    }
    
    const wordsArray = Array.from(words);
    const finalHashtags = wordsArray
        .sort((a, b) => queryWords.includes(a) ? -1 : queryWords.includes(b) ? 1 : b.length - a.length) // Prioritize query words, then longer words
        .slice(0, maxHashtags)
        .map(tag => `#${tag.charAt(0).toUpperCase() + tag.slice(1)}`); // Capitalize hashtags
    
    return finalHashtags.join(' ');
}

/**
 * Main Marketing Agent Class
 */
class DeepResearchMarketingAgent {
    constructor() {
        console.log("✅ Deep Research Marketing Agent initialized.");
        if (!PERPLEXITY_API_KEY) {
            console.warn("⚠️ PERPLEXITY_API_KEY is not set. Perplexity calls will fail.");
        }
        if (!OPENAI_API_KEY) {
            console.warn("⚠️ OPENAI_API_KEY is not set. OpenAI calls will fail.");
        }
    }

    /**
     * Main method to generate a social media blog post
     */
    async createSocialMediaPost({
        userQuery,
        targetAudience = "general audience",
        toneStyle = "informative and engaging",
        keyMessageAngle = null,
        callToAction = null,
        useCitations = false,
        perplexityMaxOutputTokens = PERPLEXITY_MAX_OUTPUT_TOKENS // Use const from top
    }) {
        console.log(`\n🔄 Starting social media post generation for query: '${userQuery}'`);
        console.log(`Parameters: Audience='${targetAudience}', Tone='${toneStyle}', Angle='${keyMessageAngle}', CTA='${callToAction}', UseCitations=${useCitations}`);

        try {
            console.log("\n🔍 Step 1: Generating research prompt for Perplexity...");
            const detailedResearchPrompt = await generateResearchPrompt(
                userQuery,
                targetAudience,
                keyMessageAngle
            );
            console.log(`✅ Generated Perplexity Prompt (first 150 chars): ${detailedResearchPrompt.substring(0, 150)}...`);

            console.log("\n🔬 Step 2: Calling Perplexity API (sonar-deep-research)...");
            const perplexityResponse = await callPerplexityAPI(
                detailedResearchPrompt,
                PERPLEXITY_API_KEY, // Passed explicitly
                perplexityMaxOutputTokens
            );

            const researchResultsContent = perplexityResponse.content;
            const researchCitations = perplexityResponse.citations;

            console.log(`✅ Received Research Results from Perplexity (content snippet): ${researchResultsContent.substring(0, 200)}...`);
            if (researchCitations && researchCitations.length > 0) {
                console.log(`✅ Received ${researchCitations.length} citations from Perplexity.`);
            } else {
                console.log("ℹ️ No citations received from Perplexity.");
            }

            console.log("\n✍️ Step 3: Generating social media post using research results...");
            const postResult = await generateSocialMediaPost(
                researchResultsContent,
                userQuery,
                targetAudience,
                toneStyle,
                keyMessageAngle,
                callToAction,
                useCitations ? researchCitations : null
            );

            const finalPostText = postResult.social_media_post_text;
            let suggestedHashtags = postResult.suggested_hashtags;

            if (!suggestedHashtags || !suggestedHashtags.trim()) {
                console.log("⚠️ Generated hashtags are empty, using fallback generator.");
                suggestedHashtags = generateFallbackHashtags(finalPostText, userQuery, targetAudience);
            }

            const output = {
                research_results: researchResultsContent,
                social_media_post_text: finalPostText,
                suggested_hashtags: suggestedHashtags.trim(),
                citations_used_in_generation: (useCitations && researchCitations) ? researchCitations : []
            };

            console.log("\n🎉 --- Generation Complete --- 🎉");
            // console.log(`Research Results (snippet): ${researchResultsContent.substring(0, 200)}...`); // Already logged
            // console.log(`Social Media Post: ${finalPostText}`);
            // console.log(`Hashtags: ${suggestedHashtags.trim()}`);
            // if (researchCitations && researchCitations.length > 0 && useCitations) {
            //     console.log(`Citations Used: ${JSON.stringify(researchCitations.slice(0,3))}...`);
            // }
            console.log("--------------------------------------");

            return output;

        } catch (error) {
            const errorMsg = `Error during social media post generation: ${error.message}`;
            console.error(`❌ ${errorMsg}`, error.stack); // Log stack for more details
            throw new Error(errorMsg); // Re-throw to be caught by workflow runner
        }
    }
}

// Example usage (can be commented out when used as a module)
/*
async function main() {
    console.log("🚀 Marketing Agent Script Starting 🚀");
    
    const agent = new DeepResearchMarketingAgent();

    const userQuery = "The latest trends in AI marketing";
    const targetAudience = "marketing professionals";
    const toneStyle = "informative and engaging";
    const keyMessageAngle = "focus on AI-driven strategies";

    try {
        const result = await agent.createSocialMediaPost({
            userQuery,
            targetAudience,
            toneStyle,
            keyMessageAngle,
            useCitations: true
        });

        console.log("
--- Main Script Output ---");
        console.log(`Perplexity Research (snippet): ${result.research_results.substring(0, 500)}...`);
        console.log(`
Social Media Post:
${result.social_media_post_text}`);
        console.log(`
Hashtags: ${result.suggested_hashtags}`);
        if (result.citations_used_in_generation && result.citations_used_in_generation.length > 0) {
            console.log(`
Citations Passed to Generator: ${JSON.stringify(result.citations_used_in_generation)}`);
        }
        console.log("--------------------------");

    } catch (error) {
        console.log(`
❌ Operation Failed: ${error.message}`);
    }
}
*/

// Export for use as module if it's CommonJS
module.exports = { DeepResearchMarketingAgent, callPerplexityAPI, generateResearchPrompt, generateSocialMediaPost };

// Remove direct execution for module usage:
// if (import.meta.url === `file://${process.argv[1]}`) {
//     main().catch(console.error);
// } 