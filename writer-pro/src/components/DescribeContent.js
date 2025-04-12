import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './DescribeContent.css';

const DescribeContent = ({ 
  contentDescription, 
  setContentDescription, 
  contentType, 
  setContentType,
  contentPresets,
  handleContentPresetClick,
  generateAIOutline,
  isGenerating,
  apiKeyError
}) => {
  const [charCount, setCharCount] = useState(0);
  
  // Update character count whenever content description changes
  useEffect(() => {
    setCharCount(contentDescription.length);
  }, [contentDescription]);

  // Determine character count class based on length
  const getCharCountClass = () => {
    if (charCount === 0) return '';
    if (charCount < 20) return 'too-short';
    if (charCount > 500) return 'lengthy';
    if (charCount > 300) return 'good-length';
    return 'ok-length';
  };

  return (
    <div className="content-card">
      <h2>What would you like to write about?</h2>
      <div className="content-description">
        <label htmlFor="content-description">Describe your content:</label>
        <textarea
          id="content-description"
          placeholder="Enter a description of what you want to write about..."
          value={contentDescription}
          onChange={(e) => setContentDescription(e.target.value)}
          rows={5}
          autoFocus
        />
        <div className={`char-count ${getCharCountClass()}`}>
          {charCount === 0 ? (
            <span>Start typing to describe your content</span>
          ) : (
            <span>
              {charCount} characters 
              {charCount < 20 && charCount > 0 && " (add more details)"}
              {charCount > 300 && charCount <= 500 && " (good length)"}
              {charCount > 500 && " (detailed description)"}
            </span>
          )}
        </div>
      </div>
            
      <div className="content-type">
        <label>Content Type:</label>
        <div className="preset-grid">
          {contentPresets.map((preset) => (
            <button
              key={preset.id}
              className={`preset-button ${contentType === preset.id ? 'active' : ''}`}
              onClick={() => handleContentPresetClick(preset)}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-label">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="action-container">
        <button 
          className="action-button primary"
          onClick={generateAIOutline}
          disabled={!contentDescription || !contentType || isGenerating || charCount < 15}
        >
          {isGenerating ? 'Generating...' : 'Generate Outline'}
          {isGenerating && <span className="loading-spinner"></span>}
        </button>
      </div>
      
      {apiKeyError && (
        <div className="api-error-message">
          {apiKeyError}
        </div>
      )}
    </div>
  );
};

DescribeContent.propTypes = {
  contentDescription: PropTypes.string.isRequired,
  setContentDescription: PropTypes.func.isRequired,
  contentType: PropTypes.string.isRequired,
  setContentType: PropTypes.func.isRequired,
  contentPresets: PropTypes.array.isRequired,
  handleContentPresetClick: PropTypes.func.isRequired,
  generateAIOutline: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool.isRequired,
  apiKeyError: PropTypes.string
};

export default DescribeContent; 