import React, { useState, useEffect } from 'react';
import './ConfigPage.css';

// --- Default System Instructions (Retrieved from original backend code) ---

const DEFAULT_OUTLINE_INSTRUCTION = `You are an expert content planner. Your task is to generate a detailed, well-structured content outline based on a user's description and content type.

# Goal
Create a logical structure for a piece of content (like a blog post, social media update, etc.) that helps the user write the final piece.

# Steps
1. Understand the core topic and goal from the user's description and content type.
2. Identify key sections or points that should be covered.
3. Organize these sections logically (e.g., introduction, main points, conclusion).
4. For each section, list key sub-points or ideas as bullet points.

# Output Format
Use Markdown format:
- Use a main heading (#) for the overall title (infer it if not provided).
- Use subheadings (##) for major sections.
- Use bullet points (-) for the items within each section.
- Ensure the outline is clear, concise, and easy to follow.

# Example

- **Input Description:** "A blog post about the benefits of remote work for productivity."
- **Input Content Type:** "blog"
- **Output:**
  \`\`\`markdown
  # The Productivity Power of Remote Work
  
  ## Introduction
  - Briefly introduce the rise of remote work.
  - State the post's thesis: Remote work can boost productivity.
  
  ## Key Benefit 1: Increased Focus
  - Fewer office distractions.
  - Ability to create a personalized work environment.
  - Deep work blocks become easier.
  
  ## Key Benefit 2: Flexibility and Autonomy
  - Control over work schedule aligns with peak productivity times.
  - Reduced commute time frees up hours.
  - Better work-life integration reduces stress.
  
  ## Addressing Challenges
  - Acknowledge potential downsides (e.g., isolation, communication).
  - Briefly suggest solutions (e.g., regular check-ins, dedicated workspace).
  
  ## Conclusion
  - Summarize the main productivity benefits.
  - Reiterate the potential of remote work when managed well.
  - End with a concluding thought or call to action.
  \`\`\`
`;

const DEFAULT_OPTIMIZE_INSTRUCTION = `Rewrite or optimize the provided content for posting on a specific social media platform, ensuring it adheres to the platform's style and character limits.

# Goal
Adapt the user's content to be effective and engaging on the target platform, preserving the core message.

# Constraints
- Adhere strictly to platform character limits (e.g., Twitter: 280).
- Match the typical tone and style of the platform (e.g., professional for LinkedIn, concise for Twitter, visual for Instagram).

# Steps
1. Understand the original content's main message.
2. Identify the target platform and its constraints/style.
3. Rewrite and condense the content for clarity, brevity, and impact.
4. Incorporate relevant elements like hashtags, emojis (appropriately), or calls to action suitable for the platform.
5. Ensure the final output is ready to be posted directly.

# Output Format
Provide *only* the final, optimized text for the post. Do not include explanations or meta-commentary.

# Examples

**Example 1 (Twitter):**
- **Input Content:** "Our company is excited to announce the launch of our new sustainable product line, featuring eco-friendly materials and ethical production methods. Learn more on our website."
- **Output:** "Go green with our new sustainable product line! 🌿 Eco-friendly materials & ethical production. Shop now! #Sustainable #EcoFriendly [Link]"

**Example 2 (LinkedIn):**
- **Input Content:** "Check out our new blog post on the future of AI in marketing."
- **Output:** "Exploring the transformative potential of AI in marketing. Our latest article dives into key trends and predictions for 2024. Read the insights here: [Link] #AI #Marketing #DigitalTransformation #FutureOfWork"
`;

// Local storage keys
export const OUTLINE_INSTRUCTION_KEY = 'writer_pro_outline_instruction';
export const OPTIMIZE_INSTRUCTION_KEY = 'writer_pro_optimize_instruction';

// Helper functions to get instructions (can be imported by other components)
export const getOutlineInstruction = () => {
  return localStorage.getItem(OUTLINE_INSTRUCTION_KEY) || DEFAULT_OUTLINE_INSTRUCTION;
};

export const getOptimizeInstruction = () => {
  return localStorage.getItem(OPTIMIZE_INSTRUCTION_KEY) || DEFAULT_OPTIMIZE_INSTRUCTION;
};

function ConfigPage() {
  const [outlineInstruction, setOutlineInstruction] = useState('');
  const [optimizeInstruction, setOptimizeInstruction] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('outline');

  // Load instructions on mount using the helper functions
  useEffect(() => {
    setOutlineInstruction(getOutlineInstruction());
    setOptimizeInstruction(getOptimizeInstruction());
  }, []);

  const handleSaveOutline = () => {
    localStorage.setItem(OUTLINE_INSTRUCTION_KEY, outlineInstruction);
    setStatusMessage('Outline instruction saved!');
    setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
  };

  const handleSaveOptimize = () => {
    localStorage.setItem(OPTIMIZE_INSTRUCTION_KEY, optimizeInstruction);
    setStatusMessage('Optimize instruction saved!');
    setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
  };

  const handleResetOutline = () => {
    setOutlineInstruction(DEFAULT_OUTLINE_INSTRUCTION);
    localStorage.removeItem(OUTLINE_INSTRUCTION_KEY);
    setStatusMessage('Outline instruction reset to default.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleResetOptimize = () => {
    setOptimizeInstruction(DEFAULT_OPTIMIZE_INSTRUCTION);
    localStorage.removeItem(OPTIMIZE_INSTRUCTION_KEY);
    setStatusMessage('Optimize instruction reset to default.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="config-page">
      <div className="content-card">
        <h2>AI Instructions</h2>
        
        {statusMessage && (
          <div className="status-message">
            <span className="status-icon">✓</span>
            {statusMessage}
          </div>
        )}
        
        <div className="config-tabs">
          <button 
            className={`tab-button ${activeTab === 'outline' ? 'active' : ''}`}
            onClick={() => setActiveTab('outline')}
          >
            <span className="tab-icon">📋</span>
            Outline
          </button>
          <button 
            className={`tab-button ${activeTab === 'optimize' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimize')}
          >
            <span className="tab-icon">✨</span>
            Optimize
          </button>
        </div>
        
        {activeTab === 'outline' && (
          <div className="tab-content">
            <div className="instruction-textarea-container">
              <textarea
                className="instruction-textarea"
                value={outlineInstruction}
                onChange={(e) => setOutlineInstruction(e.target.value)}
                rows={15}
                placeholder="Enter your custom outline generation instruction here..."
              />
            </div>
            
            <div className="button-group">
              <button className="action-button secondary" onClick={handleResetOutline}>
                Reset
              </button>
              <button className="action-button primary" onClick={handleSaveOutline}>
                Save
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'optimize' && (
          <div className="tab-content">
            <div className="instruction-textarea-container">
              <textarea
                className="instruction-textarea"
                value={optimizeInstruction}
                onChange={(e) => setOptimizeInstruction(e.target.value)}
                rows={15}
                placeholder="Enter your custom content optimization instruction here..."
              />
            </div>
            
            <div className="button-group">
              <button className="action-button secondary" onClick={handleResetOptimize}>
                Reset
              </button>
              <button className="action-button primary" onClick={handleSaveOptimize}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="content-card">
        <h2>API Settings</h2>
        
        <div className="api-settings">
          <div className="models-info">
            <div className="model-card">
              <div className="model-icon">🧠</div>
              <div className="model-details">
                <h4>GPT-4o</h4>
                <p>Used for outline generation.</p>
              </div>
            </div>
            
            <div className="model-card">
              <div className="model-icon">✏️</div>
              <div className="model-details">
                <h4>GPT-4.5-Preview</h4>
                <p>Used for content optimization.</p>
              </div>
            </div>
          </div>
          
          <div className="environment-note">
            <p>API keys are configured in the backend's <code>.env</code> file.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPage; 