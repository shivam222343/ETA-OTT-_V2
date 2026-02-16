import axios from 'axios';
import dotenv from 'dotenv';
import { runNeo4jQuery } from '../config/neo4j.config.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Check formatting quality of AI response
 * Returns score based on presence of required formatting elements
 */
const checkFormattingQuality = (text) => {
    if (!text) return { score: 0, details: {} };

    const hasMainTitle = /###\s+.+/g.test(text);
    const hasSubtitles = /####\s+.+/g.test(text);
    const hasBulletPoints = /^[\s]*[-*]\s+.+/gm.test(text);
    const hasNumberedLists = /^\d+\.\s+.+/gm.test(text);
    const hasBoldText = /\*\*.+?\*\*/g.test(text);
    const hasCodeBlocks = /```[\s\S]*?```/g.test(text);
    const hasInlineCode = /`.+?`/g.test(text);
    const hasFormulas = /\[.+?\]/g.test(text);

    const titleCount = (text.match(/###\s+.+/g) || []).length;
    const subtitleCount = (text.match(/####\s+.+/g) || []).length;

    return {
        score: (hasMainTitle ? 15 : 0) +
            (hasSubtitles ? 15 : 0) +
            (hasBulletPoints ? 10 : 0) +
            (hasNumberedLists ? 10 : 0) +
            (hasBoldText ? 10 : 0) +
            (hasCodeBlocks ? 5 : 0) +
            (hasInlineCode ? 5 : 0) +
            (hasFormulas ? 5 : 0) +
            (titleCount >= 1 ? 5 : 0) +
            (subtitleCount >= 2 ? 10 : 0),
        details: {
            hasMainTitle,
            hasSubtitles,
            hasBulletPoints,
            hasNumberedLists,
            hasBoldText,
            hasCodeBlocks,
            hasInlineCode,
            hasFormulas,
            titleCount,
            subtitleCount
        }
    };
};

/**
 * Calculate comprehensive confidence score based on multiple parameters
 * Returns final score (0-100) and detailed breakdown
 */
const calculateConfidence = (params) => {
    const {
        aiConfidence = 85,
        hasContext = false,
        hasSelectedText = false,
        hasVisualContext = false,
        isVisionMode = false,
        responseLength = 0,
        hasFormatting = { score: 0 },
        contentType = 'text',
        isVerifiedSource = false
    } = params;

    // Base score from AI (35% weight for AI, 50% for verified)
    const aiWeight = isVerifiedSource ? 0.50 : 0.35;
    const aiScore = Math.min(100, Math.max(0, aiConfidence)) * aiWeight;

    // Context quality score (25% weight)
    let contextScore = 0;
    if (hasSelectedText) contextScore += 12; // Specific text selected
    if (hasContext) contextScore += 8; // General context available
    if (hasVisualContext) contextScore += 5; // Visual positioning data
    contextScore = Math.min(25, contextScore);

    // Response quality score (20% weight)
    let responseScore = 0;
    if (responseLength >= 400) responseScore = 20;
    else if (responseLength >= 200) responseScore = 15;
    else if (responseLength >= 100) responseScore = 10;
    else responseScore = 5;

    // Formatting quality score (20% weight) - increased for AI to reward "Smart Tutor" structure
    const formattingScore = (hasFormatting.score / 100) * 20;

    // Verified Source Bonus
    const sourceBonus = isVerifiedSource ? 10 : 0;

    // Calculate final score
    const finalScore = Math.round(aiScore + contextScore + responseScore + formattingScore + sourceBonus);

    return {
        finalScore: Math.min(100, Math.max(0, finalScore)),
        breakdown: {
            aiConfidence: {
                value: Math.round(aiScore / aiWeight),
                weight: `${aiWeight * 100}%`,
                contribution: Math.round(aiScore)
            },
            contextQuality: {
                weight: '25%',
                contribution: Math.round(contextScore)
            },
            responseQuality: {
                weight: '20%',
                contribution: Math.round(responseScore)
            },
            formattingQuality: {
                weight: '20%',
                contribution: Math.round(formattingScore)
            },
            summary: {
                totalScore: Math.min(100, Math.max(0, finalScore)),
                reliability: finalScore >= 85 ? 'High' :
                    finalScore >= 70 ? 'Good' :
                        finalScore >= 50 ? 'Moderate' : 'Low'
            }
        }
    };
};

export const searchExistingDoubts = async (query, context = '', contentId = null) => {
    try {
        const searchKey = `${query.toLowerCase().trim()}${context ? '|' + context.toLowerCase().trim() : ''}`;

        // 1. Try to find an exact doubt match linked to THIS specific content first
        if (contentId) {
            const contentSpecificResult = await runNeo4jQuery(
                `MATCH (c:Content {id: $contentId})<-[:RELATES_TO]-(d:Doubt {queryKey: $searchKey})
                 WHERE d.confidence >= 80
                 RETURN d.answer as answer, d.confidence as confidence
                 LIMIT 1`,
                { contentId, searchKey }
            );

            if (contentSpecificResult.records.length > 0) {
                return {
                    answer: contentSpecificResult.records[0].get('answer'),
                    confidence: contentSpecificResult.records[0].get('confidence'),
                    source: 'content_knowledge_base'
                };
            }
        }

        // 2. Fallback to global doubt search
        const globalResult = await runNeo4jQuery(
            `MATCH (d:Doubt)
             WHERE d.queryKey = $searchKey
             AND d.confidence >= 80
             RETURN d.answer as answer, d.confidence as confidence
             LIMIT 1`,
            { searchKey }
        );

        if (globalResult.records.length > 0) {
            return {
                answer: globalResult.records[0].get('answer'),
                confidence: globalResult.records[0].get('confidence'),
                source: 'graph_db'
            };
        }
        return null;
    } catch (error) {
        console.error('Error searching existing doubts:', error);
        return null;
    }
};

/**
 * Call Groq Llama to answer a doubt
 */
export const askGroq = async (query, context = '', visualContext = null, contentUrl = null, contentType = null, language = 'english', userName = 'Student', selectedText = '') => {
    try {
        let spatialInfo = '';
        let isVisionMode = false;

        if (visualContext && contentUrl && contentType === 'image') {
            // Enable vision mode for region-specific visual queries on images
            isVisionMode = true;
        }

        if (visualContext) {
            const timeContext = context.match(/\[at \d+:\d+\]/);
            spatialInfo = `\n### CRITICAL CONTEXT: REGION OF INTEREST (ROI)
The student has MANUALLY HIGHLIGHTED a specific area on their screen ${timeContext ? `at timestamp ${timeContext[0]}` : ''}. 
YOUR MISSION: Analyze and explain the contents of this SPECIFIC HIGHLIGHTED BOX in extreme detail. 
If this is a video frame, explain the visual elements, diagram components, or data points being shown in that exact region. 
Act as if you are pointing your finger at that box and teaching the student about its specific contents.`;
        }

        const activeModel = isVisionMode ? (process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview') : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');

        let languageInstruction = "";
        if (language.toLowerCase() === 'hindi') {
            languageInstruction = `
- **STRICT HINGLISH RULE**: Respond only in **conversational Hinglish** (Hindi words in English script).
- **NO DEVANAGARI**: Strictly no Hindi script characters.
- **CONCEPTUAL TEACHING**: Never read code line-by-line. Instead of saying "System.out.println", say "Yahan hum monitor pe output dikha rahe hain".
- **TONE**: Professional but friendly tutor. Use student's name naturally. No "Arre bhai" or "Dost" - use their actual name.`;
        } else {
            languageInstruction = `
- **STRICT ENGLISH RULE**: Respond fully in English.
- **CONCEPTUAL TEACHING**: Explain why we use a block of code, not exactly what characters are typed. Talk about entry points, logic flows, and purpose.
- **TONE**: Professional but conversational mentor. Use student's name naturally.`;
        }

        const systemPrompt = `You are a professional coding mentor for ${userName}. Explain concepts clearly using clean markdown.

MANDATORY STRUCTURE (use these markers):
[[INTRO]] - Greet ${userName} by name and introduce the topic warmly.
[[CONCEPT]] - Main teaching section:
   • Start with "### Concept Overview" heading (blue, bold)
   • Explain the concept conceptually BEFORE showing code
   • If showing code, add "### Code Breakdown" heading AFTER the code block
   • In the breakdown, explain the LOGIC and FLOW, not syntax
[[CODE]] - Code snippet in triple backticks with language specified
[[SUMMARY]] - Brief recap with "### Key Takeaways" heading
[[VIDEO: URL]] - MUST include one highly-viewed YouTube tutorial

CRITICAL RULES:
1. **Use ${userName}'s name** naturally in the intro
2. **Headings**: Use ### for main sections, #### for subsections (will render blue and bold)
3. **Code Explanation**: Explain WHAT the code does and WHY, not HOW to type it
4. **No Syntax Reading**: Don't say "for loop" - say "iterate through each element"
5. **Confident Tone**: Answer definitively. No uncertainty, no confidence scores, no "verify with mentor"
6. **Clean Structure**: Follow the exact order: Intro → Concept → Code → Summary → Video

${languageInstruction}

Current Resource: ${selectedText || context || 'General curriculum'}
Highlighted Context: ${selectedText || 'Main topic'}`;

        const messages = [];

        if (isVisionMode && contentUrl) {
            try {
                const imageResponse = await axios.get(contentUrl, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
                const mimeType = contentUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';

                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: systemPrompt + "\n\nACTUAL STUDENT QUERY: " + query },
                        {
                            type: 'image_url',
                            image_url: { url: `data:${mimeType};base64,${base64Image}` }
                        }
                    ]
                });
            } catch (imgError) {
                console.warn('Failed to encode image for vision:', imgError.message);
                messages.push({ role: 'system', content: systemPrompt });
                messages.push({ role: 'user', content: query });
            }
        } else {
            messages.push({ role: 'system', content: systemPrompt });
            messages.push({ role: 'user', content: query });
        }

        const response = await axios.post(
            GROQ_API_URL,
            {
                model: activeModel,
                messages: messages,
                temperature: 0.6,
                max_tokens: 2048
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const rawContent = response.data.choices[0].message.content;

        return {
            explanation: rawContent,
            confidence: 100, // Fixed as display is removed
            source: isVisionMode ? 'groq_vision' : 'groq_llama'
        };
    } catch (error) {
        console.error('Groq AI call failed:', error.message);
        throw new Error('AI Tutor is currently unavailable.');
    }
};

export const saveDoubtToGraph = async (query, answer, confidence, context = '', contentId = null) => {
    try {
        const queryKey = `${query.toLowerCase().trim()}${context ? '|' + context.toLowerCase().trim() : ''}`;
        await runNeo4jQuery(
            `MERGE(d: Doubt { queryKey: $queryKey })
             SET d.query = $query, d.context = $context, d.answer = $answer,
                 d.confidence = $confidence, d.updatedAt = datetime()
             WITH d
             OPTIONAL MATCH(c: Content { id: $contentId })
             FOREACH(ignoreMe IN CASE WHEN c IS NOT NULL THEN [1] ELSE [] END |
                 MERGE(d)-[:RELATES_TO]->(c)
             )`,
            { queryKey, query: query.trim(), context: context.trim(), answer, confidence, contentId }
        );
    } catch (error) {
        console.error('Error saving doubt to graph:', error);
    }
};

export default {
    searchExistingDoubts,
    askGroq,
    saveDoubtToGraph
};
