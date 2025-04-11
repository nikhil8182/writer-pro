import React, { useState, useEffect } from 'react';
import './Editor.css';
import OpenAIService from '../services/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Editor({ 
  platform = 'default', 
  contentDescription = '',
  contentType = '',
  value = '',
  onContentChange = () => {}
}) {
  const [charCount, setCharCount] = useState(value.length);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setCharCount(newContent.length);
    onContentChange(newContent);
  };
  
  const platformLimits = OpenAIService.PLATFORM_LIMITS;
  const currentLimit = platformLimits[platform] || platformLimits.default;

  const getCharCounterClass = () => {
    const percentUsed = (charCount / currentLimit) * 100;
    if (charCount > currentLimit) {
      return 'over-limit';
    } else if (percentUsed >= 85) {
      return 'near-limit';
    }
    return '';
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };
  
  const getPlatformTips = () => {
    switch(platform) {
      case 'twitter':
        return [
          `Keep it under ${currentLimit} characters`,
          'Use 1-2 relevant hashtags',
          'Include a clear call to action',
          'Engage with a question',
          'Use emojis sparingly'
        ];
      case 'linkedin':
        return [
          'Professional tone works best',
          'Include industry insights',
          'End with a question to drive engagement',
          'Add relevant stats or data points',
          'Format with bullets for readability'
        ];
      case 'instagram':
        return [
          'Add relevant context for images',
          'Use concise, engaging language',
          'Maintain brand voice consistency',
          'Strategic hashtag placement',
          'Strong emotional connection'
        ];
      case 'blog':
        return [
          'Include a compelling headline',
          'Structure with headers for scanability',
          'Aim for 1000+ words for SEO',
          'Include internal and external links',
          'Add visual elements'
        ];
      default:
        return [
          'Keep content clear and concise',
          'Use appropriate tone for your audience',
          'Include a call to action',
          'Proofread for errors',
          'Test readability'
        ];
    }
  };

  const requestAISuggestion = async () => {
    if (!value) return;
    
    setShowAIAssistant(true);
    setIsGeneratingAI(true);
    try {
      const suggestion = await OpenAIService.getSuggestion(value, platform);
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      setAiSuggestion("Sorry, I couldn't generate a suggestion right now. Please try again later.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      onContentChange(aiSuggestion);
      setShowAIAssistant(false);
      setAiSuggestion('');
    }
  };
  
  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="platform-badge">
          <span className="platform-icon">
            {platform === 'twitter' && '🐦'}
            {platform === 'linkedin' && '💼'}
            {platform === 'instagram' && '📸'}
            {platform === 'blog' && '📝'}
            {!['twitter', 'linkedin', 'instagram', 'blog'].includes(platform) && '📄'}
          </span>
          <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
          <div className={`char-counter ${getCharCounterClass()}`}>
            <span className={charCount > currentLimit ? 'over-limit' : ''}>
              {charCount}
            </span>
            <span>/</span>
            <span>{currentLimit}</span>
          </div>
        </div>
        
        <div className="editor-actions">
          <button
            className="ai-assist-btn"
            onClick={requestAISuggestion}
            disabled={!value || isGeneratingAI}
            title="Get AI suggestions to improve your content">
            {isGeneratingAI ? (
              <><span className="loading-spinner dark"></span> Improving...</>
            ) : (
              <><span>✨</span> Improve</>
            )}
          </button>
          <button 
            className={`view-toggle-btn ${isPreviewMode ? 'active' : ''}`}
            onClick={togglePreviewMode}
          >
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>
      
      <div className="editor-main">
        {isPreviewMode ? (
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="editor-textarea-container">
            <textarea 
              value={value}
              onChange={handleContentChange}
              placeholder={`Write your optimized ${platform} content here...`}
              className="editor-textarea"
            ></textarea>
            <div className={`char-counter-inline ${getCharCounterClass()}`}>
              <span className={charCount > currentLimit ? 'over-limit' : ''}>
                {charCount}
              </span>
              <span>/</span>
              <span>{currentLimit}</span>
            </div>
          </div>
        )}
      </div>
      
      {showAIAssistant && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-header">
            <h3>✨ AI Suggestion</h3>
            <button className="close-btn" onClick={() => setShowAIAssistant(false)}>×</button>
          </div>
          <div className="ai-assistant-content">
            {isGeneratingAI ? (
              <div className="ai-loading">
                <div className="loading-spinner dark"></div>
                <p>Analyzing your content...</p>
              </div>
            ) : aiSuggestion ? (
              <div className="ai-suggestion">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiSuggestion}
                </ReactMarkdown>
                <div className="ai-suggestion-actions">
                  <button onClick={applyAISuggestion} className="action-button primary">Apply Suggestion</button>
                  <button onClick={() => setShowAIAssistant(false)} className="action-button secondary">Dismiss</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default Editor; 