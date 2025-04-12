/**
 * OpenAI Service (Frontend)
 * Handles communication with the FastAPI backend for AI tasks.
 */

// Base URL for the FastAPI backend
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000';

// Platform character limits (kept here for frontend UI display)
export const PLATFORM_LIMITS = {
  twitter: parseInt(process.env.REACT_APP_TWITTER_LIMIT) || 280,
  linkedin: parseInt(process.env.REACT_APP_LINKEDIN_LIMIT) || 3000,
  instagram: parseInt(process.env.REACT_APP_INSTAGRAM_LIMIT) || 2200,
  blog: parseInt(process.env.REACT_APP_BLOG_LIMIT) || 10000,
  default: 5000
};

/**
 * Helper function to make POST requests to the backend
 */
async function postToBackend(endpoint, body) {
  // Print request data for debugging
  console.log(`[DEBUG] Sending request to ${endpoint}:`, body);
  
  try {
    const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Print response data
    console.log(`[DEBUG] Response from ${endpoint}:`, data);

    if (!response.ok) {
      // Use the detail message from FastAPI's HTTPException if available
      const errorDetail = data.detail || `Backend request failed with status ${response.status}`;
      console.error('Backend Error:', errorDetail);
      throw new Error(errorDetail);
    }

    return data;
  } catch (error) {
    console.error(`Error calling backend endpoint ${endpoint}:`, error);
    // Re-throw the error so calling components can handle it (e.g., show message to user)
    throw error;
  }
}

/**
 * Generate an outline for new content
 * 
 * @param {string} contentDescription - User description of content to create
 * @param {string} contentType - Type of content (e.g., "latest-news", "motivation")
 * @param {string} customInstruction - Custom system instruction from config page
 * @returns {Promise<string>} - Generated outline text
 */
export const generateOutline = async (contentDescription, contentType, customInstruction) => {
  // Prepare the request body
  const body = {
    contentDescription, 
    contentType,
    base_system_instruction: customInstruction,
  };
  
  // Send to backend
  const data = await postToBackend('/generate-outline', body);
  return data.outline;
};

/**
 * Optimize content for a specific platform
 * 
 * @param {string} content - Content to optimize
 * @param {string} platform - Target platform (e.g., "twitter", "linkedin")
 * @param {string} contentType - Type of content being optimized
 * @param {string} customInstruction - Custom system instruction from config page
 * @returns {Promise<string>} - Optimized content for the platform
 */
export const optimizeForPlatform = async (content, platform, contentType, customInstruction) => {
  // Prepare the request body
  const body = {
    content,
    platform,
    contentType,
    base_system_instruction: customInstruction,
  };
  
  // Send to backend
  const data = await postToBackend('/optimize-content', body);
  return data.optimizedContent;
};

/**
 * Rewrite content in a specific style
 * 
 * @param {string} content - Content to rewrite
 * @param {string} style - Style to use for rewriting (e.g., "professional", "casual")
 * @param {string} customInstruction - Custom system instruction from config page
 * @returns {Promise<string>} - Rewritten content in the specified style
 */
export const rewriteContent = async (content, style, customInstruction) => {
  // Prepare the request body
  const body = {
    content,
    style,
    base_system_instruction: customInstruction,
  };
  
  // Send to backend
  const data = await postToBackend('/rewrite-content', body);
  return data.rewrittenContent;
};

/**
 * Get AI suggestions to improve content
 * 
 * @param {string} content - The current content to analyze
 * @param {string} platform - The target platform
 * @returns {Promise<string>} - Improved content suggestion
 */
export const getSuggestion = async (content, platform) => {
  // Crafting a prompt to get suggestions that respect the platform's constraints
  const body = { 
    content,
    platform,
    mode: "improve",
    customSystemInstruction: `You are an expert content improvement assistant. 
    Review this content targeting ${platform} and suggest improvements to:
    1. Boost engagement and clarity
    2. Optimize for the ${platform} platform
    3. Make it more compelling while maintaining the original message
    4. Fix any grammatical or stylistic issues
    5. Stay within the platform's character limits`
  };
  
  try {
    const data = await postToBackend('/content-suggestion', body);
    return data.suggestion;
  } catch (error) {
    // If the backend endpoint doesn't exist yet, fallback to optimize-content
    console.warn("Falling back to optimize-content endpoint for suggestions");
    const fallbackData = await postToBackend('/optimize-content', {
      content,
      platform,
      contentType: "improvement",
      base_system_instruction: body.customSystemInstruction
    });
    return fallbackData.optimizedContent;
  }
};

/**
 * Generate a reply to a comment
 * 
 * @param {string} comment - The comment to reply to
 * @param {string} tone - The desired tone for the reply
 * @param {string} customInstruction - Custom system instruction from config page (optional)
 * @returns {Promise<string>} - Generated reply text
 */
export const generateReply = async (comment, tone, customInstruction) => {
  // Prepare the request body
  const body = {
    comment,
    tone,
    base_system_instruction: customInstruction || null // Use null if no instruction provided
  };
  
  // Send to backend /generate-reply endpoint
  const data = await postToBackend('/generate-reply', body);
  return data.reply; // Expecting the backend to return { "reply": "..." }
};

// Export default object with all service methods
export default {
  generateOutline,
  optimizeForPlatform,
  rewriteContent,
  getSuggestion,
  generateReply,
  PLATFORM_LIMITS
}; 