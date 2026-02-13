import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call ML service for data extraction
 * @param {string} fileUrl - URL of the file on Cloudinary
 * @param {string} contentId - MongoDB ID of the content
 * @param {string} contentType - 'pdf', 'video', etc.
 * @returns {Promise<Object>} Extracted data
 */
export const extractWithML = async (fileUrl, contentId, contentType) => {
    try {
        console.log(`🤖 Calling ML service for ${contentType} extraction...`);
        console.log(`🔗 URL: ${ML_SERVICE_URL}/extract`);

        const response = await axios.post(`${ML_SERVICE_URL}/extract`, {
            file_url: fileUrl,
            content_id: contentId,
            content_type: contentType
        }, {
            timeout: 300000 // 5 minutes timeout for transcription/heavy processing
        });

        if (response.data && response.data.success) {
            console.log(`✅ ML extraction successful for ${contentId}`);
            return response.data.data;
        } else {
            console.error(`❌ ML service returned error:`, response.data?.message);
            throw new Error(response.data?.message || 'ML extraction failed');
        }
    } catch (error) {
        console.error(`❌ ML service call failed:`, error.message);
        if (error.code === 'ECONNREFUSED') {
            throw new Error('ML service is not running. Please start the Python service on port 8000.');
        }
        throw error;
    }
};

export default {
    extractWithML
};
