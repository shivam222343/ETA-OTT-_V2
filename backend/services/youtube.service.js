import yts from 'yt-search';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Content from '../models/Content.model.js';

/**
 * Search for YouTube videos with educational focus
 * @param {string} query - Search term
 * @param {string} userId - User ID to save search history
 * @returns {Promise<Array>} List of videos
 */
export const searchVideos = async (query, userId = null) => {
    try {
        // Requirement allows searching 'any' video in the search option
        const r = await yts(query);

        // Filter out videos that might not be educational (basic heuristic)
        // yt-search doesn't provide category, but we can check title/description if needed
        const videos = r.videos.slice(0, 30).map(v => ({
            id: v.videoId,
            url: v.url,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            duration: v.timestamp,
            views: v.views,
            ago: v.ago,
            author: v.author.name
        }));

        // Save to search history if userId is provided
        if (userId && query) {
            await User.findByIdAndUpdate(userId, {
                $push: {
                    searchHistory: {
                        $each: [{
                            term: query,
                            timestamp: new Date()
                        }],
                        $slice: -20 // Keep only last 20 searches
                    }
                }
            });
        }

        return videos;
    } catch (error) {
        console.error('YouTube search error:', error);
        throw error;
    }
};

/**
 * Get recommended YouTube videos based on user context
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of recommended videos
 */
export const getRecommendedVideos = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // 1. Get themes from joined courses
        const joinedCourses = await Course.find({
            branchIds: { $in: user.branchIds || [] },
            isActive: true
        }).limit(5);
        const courseThemes = joinedCourses.map(c => c.name);

        // 2. Get themes from faculty added content
        const recentContent = await Content.find({
            branchIds: { $in: user.branchIds || [] },
            isActive: true
        })
            .sort({ createdAt: -1 })
            .limit(10);
        const contentThemes = recentContent.map(c => c.title);

        // 3. Get search history
        const searchHistory = user.searchHistory?.slice(-10).map(h => h.term) || [];

        // 4. Combine and deduplicate themes
        const allThemes = [...new Set([...courseThemes, ...contentThemes, ...searchHistory])];

        // Pick random themes to keep it dynamic
        const selectedThemes = allThemes.sort(() => 0.5 - Math.random()).slice(0, 4);

        let recommendationQuery;
        if (selectedThemes.length > 0) {
            recommendationQuery = `${selectedThemes.join(' ')} educational academic lecture`;
        } else {
            // Default educational query if no history/courses
            recommendationQuery = "trending educational technology science lectures academic";
        }

        console.log(`🔍 Generating recommendations with query: ${recommendationQuery}`);

        const r = await yts(recommendationQuery);

        return r.videos.slice(0, 18).map(v => ({
            id: v.videoId,
            url: v.url,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            duration: v.timestamp,
            views: v.views,
            ago: v.ago,
            author: v.author.name
        }));
    } catch (error) {
        console.error('YouTube recommendation error:', error);
        throw error;
    }
};

export default {
    searchVideos,
    getRecommendedVideos
};
