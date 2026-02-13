import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import dotenv from 'dotenv';
dotenv.config();

const pollyClient = new PollyClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
});

/**
 * Synthesize speech using AWS Polly (Indian Accent)
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Polly Voice ID (Default: Aditi)
 * @returns {Promise<Buffer>} - Audio buffer
 */
export const synthesizePolly = async (text, voiceId = "Aditi") => {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error("AWS Credentials missing. Please add them to .env");
        }

        const command = new SynthesizeSpeechCommand({
            Engine: "neural",
            OutputFormat: "mp3",
            Text: text,
            VoiceId: voiceId
        });

        const response = await pollyClient.send(command);

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of response.AudioStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        console.error("Polly TTS error:", error.message);
        throw error;
    }
};

export default {
    synthesizePolly
};
