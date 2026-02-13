import axios from 'axios';
import dotenv from 'dotenv';
import { runNeo4jQuery } from '../config/neo4j.config.js';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
 * @param {string} query - The student's question
 * @param {string} context - Selection text or content context
 * @param {Object} visualContext - Coordinates {x, y, width, height}
 * @returns {Promise<Object>} - AI response with confidence
 */
export const askGroq = async (query, context = '', visualContext = null, contentUrl = null, contentType = null) => {
    try {
        let spatialInfo = '';
        let isVisionMode = false;
        let activeModel = GROQ_MODEL;

        // Determine if we should use Vision mode
        const isYouTube = contentUrl?.includes('youtube.com') || contentUrl?.includes('youtu.be');

        // Use vision if:
        // 1. It's an image
        // 2. It's a visual focus region AND we aren't restricted (like YouTube where we can't directly fetch frames yet)
        if (visualContext && (contentType === 'image' || (!context.includes('Video Focus') && !context.includes('Text Extraction failed')))) {
            // TEMPORARY FIX: Disabling vision mode as both 90b and 11b vision previews are unstable/decommissioned.
            // Falling back to text-based analysis with spatial context prompts.
            // if (!isYouTube && contentType !== 'video') {
            //     isVisionMode = true; 
            //     activeModel = 'llama-3.2-11b-vision-preview'; 

            //     // If it's a PDF, we need to transform it to an image for Cloudinary
            //     if (contentType === 'pdf' && contentUrl?.includes('cloudinary')) {
            //         contentUrl = contentUrl.replace(/\.pdf$/, '.jpg');
            //     }
            // }
            isVisionMode = false;
        }

        if (visualContext) {
            const timeContext = context.match(/\[at \d+:\d+\]/);
            spatialInfo = `\nSTUDENT HAS HIGHLIGHTED A SPECIFIC FOCUS REGION ${timeContext ? `IN THE VIDEO ${timeContext[0]}` : ''}. 
${isVisionMode ? 'WE ARE USING VISION CAPABILITIES TO SEE THE AREA.' : 'ACT AS A GUIDE BY ANALYZING THE SPATIAL CONTEXT AND TEMPORAL POSITION.'}
Please provide a direct explanation about THIS specific focus area. 
IMPORTANT: DO NOT mention technical details like coordinates, x/y values, width, height, or "focus region" in your response. 
Act as if you can see what they are looking at and explain it naturally based on the content context.`;
        }

        const systemPrompt = `You are an expert academic tutor on the Eta OTT platform. 
Your goal is to explain concepts clearly, simply, and "like a human teacher".
Use a warm, encouraging tone. 

CRITICAL INSTRUCTIONS:
1. RESPONSE FORMAT: You must return a SINGLE VALID JSON OBJECT with exactly two fields: "explanation" and "confidence".
   - Example: {"explanation": "Your explanation here...", "confidence": 90}
2. In the "explanation" field:
   - IT MUST BE A SINGLE, VALID JSON STRING.
   - You MUST properly escape all special characters, especially double quotes (") and newlines (\\n) within the string.
   - FORMATTING IS MANDATORY: Use Markdown inside the string. 
     * **BOLD** key concepts and important terms using double asterisks (e.g., **Key Term**).
     * Use bullet points for lists.
     * Use numbered lists for steps.
   - Do NOT mention anything about coordinates, bounding boxes, or technical selection data.
   - Speak fluently. Use natural tutoring language.
   - Focus strictly on answering the student's doubt using the provided context.
   - If the student has selected a specific area, prioritize that information.

3. CONFIDENCE SCORE CALCULATION (0-100):
   - **Step 1: Context Check**: Does the user's question relate to the provided 'Selection Context' below?
     * YES, and the answer is IN the text -> Score: 90-100
     * YES, but I need to use outside knowledge to explain fully -> Score: 80-89
     * SOMEWHAT, it's a related topic but not in the text -> Score: 60-75
     * NO, the question is completely unrelated to the selection -> Score: < 50 (WARN USER)

   - **Step 2: Penalties**:
     * If the extracted text is garbled or empty: Max Score = 60
     * If you are guessing: Max Score = 40

   - **Step 3: Final Output**: Return the calculated integer.

Selection Context: ${context}${spatialInfo}`;

        const messages = [];

        if (isVisionMode && contentUrl) {
            try {
                // Fetch image and convert to Base64 for maximum reliability
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
                console.warn('Failed to encode image for vision, falling back to URL:', imgError.message);
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: systemPrompt + "\n\nACTUAL STUDENT QUERY: " + query },
                        { type: 'image_url', image_url: { url: contentUrl } }
                    ]
                });
            }
        } else {
            messages.push({ role: 'system', content: systemPrompt });
            messages.push({ role: 'user', content: query });
        }

        const payload = {
            model: activeModel,
            messages: messages,
            temperature: 0.5 // Lower temperature for more deterministic scoring
        };

        // Removed strict response_format: { type: 'json_object' } to prevent 400 errors on minor syntax glitches.
        // Our manual parsing logic below is robust enough to handle raw text or slightly malformed JSON.

        const response = await axios.post(
            GROQ_API_URL,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY} `,
                    'Content-Type': 'application/json'
                }
            }
        );

        let aiContent;
        const rawContent = response.data.choices[0].message.content;

        try {
            // Attempt standard parse first
            aiContent = JSON.parse(rawContent);
        } catch (e) {
            // Fallback 1: Extract JSON from markdown code blocks or curly braces
            let jsonString = rawContent.match(/\{[\s\S]*\}/)?.[0];

            if (jsonString) {
                try {
                    // Fix potential trailing commas before closing braces (common LLM error)
                    jsonString = jsonString.replace(/,\s*}/g, '}');
                    aiContent = JSON.parse(jsonString);
                } catch (innerE) {
                    // Fallback 2: If parsing still fails, treat it as raw text
                    console.warn('JSON parse failed for AI response, using raw text fallback.');
                    aiContent = { explanation: rawContent, confidence: 65 };
                }
            } else {
                aiContent = { explanation: rawContent, confidence: 65 };
            }
        }

        // Normalize confidence to 0-100 if it came back as 0-1
        let finalConfidence = aiContent.confidence || 90;
        if (finalConfidence > 0 && finalConfidence <= 1) {
            finalConfidence *= 100;
        }

        return {
            explanation: aiContent.explanation || aiContent.text || rawContent,
            confidence: Math.round(finalConfidence),
            source: isVisionMode ? 'groq_vision' : 'groq_llama'
        };
    } catch (error) {
        if (error.response) {
            console.error('Groq API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('Groq AI call failed:', error.message);
        throw new Error('AI Tutor is currently unavailable. Please try again later.');
    }
};

/**
 * Save a high-confidence doubt to Graph DB
 */
export const saveDoubtToGraph = async (query, answer, confidence, context = '', contentId = null) => {
    try {
        const queryKey = `${query.toLowerCase().trim()}${context ? '|' + context.toLowerCase().trim() : ''} `;

        // Create/Update Doubt Node
        await runNeo4jQuery(
            `MERGE(d: Doubt { queryKey: $queryKey })
             SET d.query = $query, d.context = $context, d.answer = $answer,
            d.confidence = $confidence, d.updatedAt = datetime()
             WITH d
             // If contentId provided, link it to the Content node
             OPTIONAL MATCH(c: Content { id: $contentId })
        FOREACH(ignoreMe IN CASE WHEN c IS NOT NULL THEN[1] ELSE[] END |
            MERGE(d) - [: RELATES_TO] -> (c)
        )`,
            {
                queryKey,
                query: query.trim(),
                context: context.trim(),
                answer,
                confidence,
                contentId
            }
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
