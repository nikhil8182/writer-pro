import React from 'react';
import Editor from './Editor';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DescribeContent from './DescribeContent';

const HomeView = ({
  currentStep,
  contentDescription,
  setContentDescription,
  contentType,
  setContentType,
  contentPresets,
  handleContentPresetClick,
  generateAIOutline,
  isGenerating,
  generatedOutline,
  platformOptions,
  selectPlatform,
  currentPlatform,
  mainEditorContent,
  handleMainEditorContentChange,
  optimizedContentMap,
  isPlatformSwitching,
  handleBackToStep1,
  handleBackToStep2,
  copyToClipboard,
  apiKeyError
}) => {
  // Step 1: Content description and type using the enhanced component
  const renderStep1 = () => (
    <DescribeContent
      contentDescription={contentDescription}
      setContentDescription={setContentDescription}
      contentType={contentType}
      setContentType={setContentType}
      contentPresets={contentPresets}
      handleContentPresetClick={handleContentPresetClick}
      generateAIOutline={generateAIOutline}
      isGenerating={isGenerating}
      apiKeyError={apiKeyError}
    />
  );
  
  // Step 2: Outline review
  const renderStep2 = () => (
    <div className="content-card">
      <div className="content-nav">
        <button className="nav-button previous" onClick={handleBackToStep1}>
          Back
        </button>
        <div className="nav-title">
          <h3>Review AI-Generated Outline</h3>
        </div>
        <div className="nav-actions"></div>
      </div>
      
      <div className="outline-container">
        <div className="outline-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {generatedOutline}
          </ReactMarkdown>
        </div>
      </div>
      
      <div className="platform-selector">
        <h3>Choose a platform to optimize for:</h3>
        <div className="platform-grid">
          {platformOptions.map((platform) => (
            <button
              key={platform.id}
              className="platform-card"
              onClick={() => selectPlatform(platform.id)}
            >
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-name">{platform.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Step 3: Platform optimization
  const renderStep3 = () => (
    <div className="content-card">
      <div className="content-nav">
        <button className="nav-button previous" onClick={handleBackToStep2}>
          Back to Outline
        </button>
        <div className="nav-title">
          <h3>
            Optimize for {platformOptions.find(p => p.id === currentPlatform)?.label || 'Platform'}
          </h3>
        </div>
        <div className="nav-actions">
          <button 
            className="action-button small-button"
            onClick={() => copyToClipboard(mainEditorContent)}
          >
            Copy
          </button>
        </div>
      </div>
      
      {isPlatformSwitching ? (
        <div className="platform-switching-indicator">
          <span className="loading-spinner"></span>
          <p>Optimizing for {platformOptions.find(p => p.id === currentPlatform)?.label}...</p>
        </div>
      ) : (
        <div className="main-editor-container">
          <Editor
            value={mainEditorContent}
            onChange={handleMainEditorContentChange}
            placeholder="Loading optimized content..."
            height="380px"
          />
        </div>
      )}
      
      <div className="other-platforms-section">
        <div className="section-header">
          <h3>Other Platforms</h3>
        </div>
        <div className="platform-grid">
          {platformOptions
            .filter(platform => platform.id !== currentPlatform)
            .map(platform => {
              const platformData = optimizedContentMap[platform.id] || {};
              const isOptimized = !!platformData.content && !platformData.isLoading;
              const hasError = platformData.error;
              const isLoading = platformData.isLoading;
              
              return (
                <button
                  key={platform.id}
                  className={`platform-card 
                    ${isOptimized ? 'optimized' : ''} 
                    ${hasError ? 'error' : ''} 
                    ${isLoading ? 'loading' : ''}`}
                  onClick={() => selectPlatform(platform.id)}
                >
                  <span className="platform-icon">{platform.icon}</span>
                  <span className="platform-name">{platform.label}</span>
                  {isLoading && <span className="loading-spinner"></span>}
                  <span className="platform-action">
                    {isOptimized ? 'View' : hasError ? 'Error' : 'Optimize'}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
  
  // Render the appropriate step
  switch (currentStep) {
    case 1:
      return renderStep1();
    case 2:
      return renderStep2();
    case 3:
      return renderStep3();
    default:
      return renderStep1();
  }
};

HomeView.propTypes = {
  currentStep: PropTypes.number.isRequired,
  contentDescription: PropTypes.string.isRequired,
  setContentDescription: PropTypes.func.isRequired,
  contentType: PropTypes.string.isRequired,
  setContentType: PropTypes.func.isRequired,
  contentPresets: PropTypes.array.isRequired,
  handleContentPresetClick: PropTypes.func.isRequired,
  generateAIOutline: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool.isRequired,
  generatedOutline: PropTypes.string.isRequired,
  platformOptions: PropTypes.array.isRequired,
  selectPlatform: PropTypes.func.isRequired,
  currentPlatform: PropTypes.string.isRequired,
  mainEditorContent: PropTypes.string.isRequired,
  handleMainEditorContentChange: PropTypes.func.isRequired,
  optimizedContentMap: PropTypes.object.isRequired,
  isPlatformSwitching: PropTypes.bool.isRequired,
  handleBackToStep1: PropTypes.func.isRequired,
  handleBackToStep2: PropTypes.func.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
  apiKeyError: PropTypes.string
};

export default HomeView; 