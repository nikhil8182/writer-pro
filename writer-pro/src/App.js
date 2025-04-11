import './App.css';
import Editor from './components/Editor';
import ConfigPage from './components/ConfigPage';
import ThemeSwitcher from './components/ThemeSwitcher';
import { getOutlineInstruction, getOptimizeInstruction } from './components/ConfigPage';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './contexts/ThemeContext';
import OpenAIService from './services/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const { theme } = useContext(ThemeContext);
  const [currentView, setCurrentView] = useState('home');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPlatform, setCurrentPlatform] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentType, setContentType] = useState('');
  const [generatedOutline, setGeneratedOutline] = useState('');
  const [finalContent, setFinalContent] = useState('');
  const [optimizedContentMap, setOptimizedContentMap] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlatformSwitching, setIsPlatformSwitching] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mainEditorContent, setMainEditorContent] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Load model preferences only
  useEffect(() => {
    const savedModel = localStorage.getItem('openai_model') || process.env.REACT_APP_DEFAULT_AI_MODEL || 'gpt-4';
  }, []);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Clear status messages after a delay
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Clear API error messages after a delay
  useEffect(() => {
    if (apiKeyError) {
      const timer = setTimeout(() => {
        setApiKeyError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [apiKeyError]);

  // Add effect to keep finalContent in sync with mainEditorContent for backward compatibility
  useEffect(() => {
    if (mainEditorContent !== finalContent) {
      setFinalContent(mainEditorContent);
    }
  }, [mainEditorContent, finalContent]);

  // Effect to update UI when optimization results come in - ensure no infinite loops
  useEffect(() => {
    // When in step 3 and platform content map changes, check if we need to update UI
    if (currentStep === 3 && currentPlatform) {
      const platformData = optimizedContentMap[currentPlatform];
      if (platformData && !platformData.isLoading && platformData.content && !mainEditorContent) {
        // Update main editor content if it's empty and we have optimized content
        setMainEditorContent(platformData.content);
      }
    }
  }, [optimizedContentMap, currentStep, currentPlatform, mainEditorContent]);

  // Effect to prevent outline content flicker in step 2
  useEffect(() => {
    if (currentStep === 2 && !generatedOutline) {
      // If somehow we got to step 2 without an outline, go back to step 1
      setCurrentStep(1);
    }
  }, [currentStep, generatedOutline]);

  // Effect to track changes in mainEditorContent and update optimizedContentMap
  useEffect(() => {
    // Only sync changes when in step 3 and not during platform switching
    if (currentStep === 3 && currentPlatform && !isPlatformSwitching && mainEditorContent) {
      // Update the optimizedContentMap with current editor content
      setOptimizedContentMap(prev => ({
        ...prev,
        [currentPlatform]: {
          ...prev[currentPlatform],
          content: mainEditorContent,
          isLoading: false,
          // Preserve other properties like error state
          error: prev[currentPlatform]?.error || false
        }
      }));
    }
  }, [currentStep, currentPlatform, mainEditorContent, isPlatformSwitching]);

  // Content type presets
  const contentPresets = [
    { id: 'latest-news', label: 'News', icon: '📰' },
    { id: 'motivation', label: 'Motivation', icon: '💪' },
    { id: 'info', label: 'Information', icon: 'ℹ️' },
    { id: 'vibe-check', label: 'Vibe Check', icon: '😎' },
    { id: 'surprise-me', label: 'Surprise Me', icon: '🎁' }
  ];

  // Platform options
  const platformOptions = [
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'blog', label: 'Blog', icon: '📝' }
  ];

  const handleContentPresetClick = (preset) => {
    setContentType(preset.id);
    // Add predefined descriptions based on the preset
    switch(preset.id) {
      case 'latest-news':
        setContentDescription('Share the latest news and updates about trending topics');
        break;
      case 'motivation':
        setContentDescription('Inspirational message to motivate followers');
        break;
      case 'info':
        setContentDescription('Educational content providing valuable information');
        break;
      case 'vibe-check':
        setContentDescription('Casual check-in with followers about current mood');
        break;
      case 'surprise-me':
        setContentDescription('Something unexpected and creative');
        break;
      default:
        setContentDescription('');
    }
  };

  const generateAIOutline = async () => {
    setIsGenerating(true);
    try {
      // Get the instruction from ConfigPage
      const configPageInstruction = getOutlineInstruction();
      
      // Use OpenAI service to generate outline
      const outline = await OpenAIService.generateOutline(
        contentDescription, 
        contentType,
        configPageInstruction // Pass the ConfigPage instruction
      );
      
      // Clear all optimized content when a new outline is generated
      setOptimizedContentMap({}); 
      setMainEditorContent('');
      
      // Set the outline and move to step 2
      setGeneratedOutline(outline);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error generating outline:", error);
      setApiKeyError('Error connecting to OpenAI API. Please check your configuration.');
      // Stay on current step when there's an error
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPlatform = (platform) => {
    // Always store current content before switching platforms
    if (currentStep === 3 && mainEditorContent && currentPlatform) {
      setOptimizedContentMap(prev => ({
        ...prev,
        [currentPlatform]: { 
          ...(prev[currentPlatform] || {}),
          content: mainEditorContent, 
          isLoading: false 
        }
      }));
    }
    
    setCurrentPlatform(platform);
    setIsPlatformSwitching(true);
    
    // Check if we already have optimized content for this platform
    const platformData = optimizedContentMap[platform];
    
    if (!platformData || !platformData.content) {
      // If no optimized content exists, trigger optimization
      setMainEditorContent(''); // Clear main editor while loading
      
      // Update UI to show loading state
      setOptimizedContentMap(prev => ({
        ...prev,
        [platform]: { 
          ...(prev[platform] || {}),
          content: '', 
          isLoading: true 
        }
      }));
      
      // Get the instruction from ConfigPage
      const configPageInstruction = getOptimizeInstruction();
      
      // For the primary platform, call the API directly and update main editor content
      OpenAIService.optimizeForPlatform(
        generatedOutline, 
        platform,
        contentType,
        configPageInstruction
      ).then(optimizedContent => {
        // Update both the main editor content and the optimized content map
        setMainEditorContent(optimizedContent);
        
        setOptimizedContentMap(prev => ({
          ...prev,
          [platform]: {
            ...(prev[platform] || {}),
            content: optimizedContent,
            isLoading: false,
            error: false,
            timestamp: new Date().toISOString()
          }
        }));
        setIsPlatformSwitching(false);
      }).catch(error => {
        console.error(`Error optimizing for ${platform}:`, error);
        setApiKeyError(`Failed to optimize for ${platform}. ${error.message || 'API error'}`);
        
        // Still update the map with the error
        setOptimizedContentMap(prev => ({
          ...prev,
          [platform]: {
            ...(prev[platform] || {}),
            content: `Error: ${error.message || 'Failed to optimize content'}`,
            isLoading: false,
            error: true
          }
        }));
        setIsPlatformSwitching(false);
      });
    } else if (!platformData.isLoading) {
      // If we have content and it's not loading, use it
      setMainEditorContent(platformData.content);
      setIsPlatformSwitching(false);
    } else {
      // Content is loading, clear the editor temporarily
      setMainEditorContent('');
    }
    
    setCurrentStep(3);
  };

  // Add a function to handle editor content changes in step 3
  const handleMainEditorContentChange = (newContent) => {
    // Update the main editor content
    setMainEditorContent(newContent);
    
    // Immediately sync with the optimizedContentMap (alternative to the useEffect)
    if (currentPlatform) {
      setOptimizedContentMap(prev => ({
        ...prev,
        [currentPlatform]: {
          ...(prev[currentPlatform] || {}),
          content: newContent,
          isLoading: false,
          // Mark as manually edited
          edited: true
        }
      }));
    }
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopySuccess(true);
        setStatusMessage('Content copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        setApiKeyError('Failed to copy to clipboard. Please try again.');
      });
  };

  const resetWorkflow = () => {
    // Clear all state completely
    setCurrentStep(1);
    setContentDescription('');
    setContentType('');
    setGeneratedOutline('');
    setMainEditorContent('');
    setFinalContent('');
    setCurrentPlatform('');
    // Clear the entire content map to remove any memory of previous content
    setOptimizedContentMap({});
    setApiKeyError('');
    setStatusMessage('');
    
    // Clear local storage cache if needed (optional)
    // localStorage.removeItem('writer_pro_temp_content');
    
    console.log("Workflow reset - all content cleared");
  };

  // Function to handle going back from step 3 to step 2 while preserving content
  const handleBackToStep2 = () => {
    // First save current editor content for the current platform
    if (mainEditorContent && currentPlatform) {
      setOptimizedContentMap(prev => ({
        ...prev,
        [currentPlatform]: {
          ...(prev[currentPlatform] || {}),
          content: mainEditorContent,
          isLoading: false,
          edited: true
        }
      }));
    }
    
    // Now go back to step 2
    setCurrentStep(2);
  };

  // Function to handle back button from step 2 to step 1
  const handleBackToStep1 = () => {
    // Preserve the outline when going back to step 1
    setCurrentStep(1);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderSidebar = () => {
    return (
      <div className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'} ${theme === 'dark' ? 'dark' : 'light'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">✍️</span>
            <h1>Writer Pro</h1>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <button 
              className={currentView === 'home' ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                setCurrentView('home');
                resetWorkflow();
              }}>
              <span className="nav-icon">📝</span>
              <span className="nav-label">Write</span>
            </button>
            <button 
              className={currentView === 'config' ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                setCurrentView('config');
              }}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
          </nav>
          
          <ThemeSwitcher />
          
          {currentView === 'home' && (
            <div className="workflow-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${(currentStep / 3) * 100}%`}}
                ></div>
              </div>
              <div className="step-labels">
                <span className={currentStep >= 1 ? 'active' : ''}>Describe</span>
                <span className={currentStep >= 2 ? 'active' : ''}>Outline</span>
                <span className={currentStep >= 3 ? 'active' : ''}>Edit</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Home view render function (with streamlined steps)
  const renderHomeView = () => {
    return (
      <div className="home-view">
        {apiKeyError && (
          <div className="api-error-message">
            <p>⚠️ {apiKeyError}</p>
          </div>
        )}
        
        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}
        
        {/* Step 1: Describe your content */}
        {currentStep === 1 && (
          <div className="content-card">
            <h2>Describe Your Content</h2>
            
            <div className="content-description">
              <label htmlFor="content-description">What would you like to write about?</label>
              <textarea
                id="content-description"
                className="content-textarea"
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                placeholder="Describe your content in detail, including topics, tone, and target audience..."
              />
            </div>
            
            <div className="content-presets">
              <h3>Content Type</h3>
              <div className="preset-grid">
                {contentPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-card ${contentType === preset.id ? 'active' : ''}`}
                    onClick={() => handleContentPresetClick(preset)}
                    title={preset.label}
                  >
                    <div className="preset-icon">{preset.icon}</div>
                    <div className="preset-label">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="action-container">
              <button 
                className="action-button primary" 
                onClick={generateAIOutline}
                disabled={!contentDescription || !contentType || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spinner"></div>
                    Generating...
                  </>
                ) : 'Generate Outline'}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Review & Edit Outline */}
        {currentStep === 2 && (
          <div className="content-card">
            <h2>Review & Edit Outline</h2>
            
            <div className="step-indicator">
              <div className="step-number">2</div>
              <div className="step-label">Review and edit your content outline</div>
            </div>
            
            <div className="outline-container">
              <Editor 
                key={`outline-editor-${generatedOutline.length}`} // Key helps prevent state conflicts
                initialContent={generatedOutline}
                onChange={(newOutline) => {
                  // Only update if content actually changed to prevent render loops
                  if (newOutline !== generatedOutline) {
                    setGeneratedOutline(newOutline);
                  }
                }}
                placeholder="Loading outline..."
              />
            </div>
            
            <div className="platform-selector">
              <h3>Select platform to optimize for:</h3>
              <div className="platform-grid">
                {platformOptions.map(platform => (
                  <button 
                    key={platform.id} 
                    className="platform-card"
                    onClick={() => selectPlatform(platform.id)}
                    title={`Optimize for ${platform.label}`}
                  >
                    <div className="platform-icon">{platform.icon}</div>
                    <div className="platform-name">{platform.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="action-container">
              <button className="action-button secondary" onClick={handleBackToStep1}>
                Back
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Optimize Content */}
        {currentStep === 3 && (
          <div className="content-card">
            <h2>Optimize Content</h2>
            
            <div className="step-indicator">
              <div className="step-number">3</div>
              <div className="step-label">
                Optimize for {platformOptions.find(p => p.id === currentPlatform)?.label || 'platform'}
              </div>
            </div>
            
            <div className="other-platforms-section">
              <h3>Also optimize for:</h3>
              <div className="platform-grid">
                {platformOptions
                  .filter(platform => platform.id !== currentPlatform)
                  .map(platform => {
                    const platformData = optimizedContentMap[platform.id];
                    const isLoading = platformData?.isLoading;
                    const isOptimized = platformData && !isLoading && platformData.content && !platformData.error;
                    const hasError = platformData?.error;
                    
                    return (
                      <button 
                        key={platform.id}
                        className={`platform-card ${isOptimized ? 'optimized' : ''} ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
                        onClick={() => optimizeForAdditionalPlatform(platform.id)}
                        disabled={isLoading}
                        title={isLoading ? `Optimizing for ${platform.label}...` : 
                               hasError ? `Error optimizing for ${platform.label}. Click to retry.` :
                               isOptimized ? `View ${platform.label} content` : 
                               `Optimize for ${platform.label}`}
                      >
                        {isLoading ? (
                          <div className="loading-spinner dark"></div>
                        ) : hasError ? (
                          <div className="platform-icon">⚠️</div>
                        ) : (
                          <div className="platform-icon">{platform.icon}</div>
                        )}
                        <div className="platform-name">{platform.label}</div>
                        {isOptimized && !isLoading && !hasError && (
                          <div className="optimized-badge" title="Optimized">✓</div>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
            
            {isPlatformSwitching && (
              <div className="platform-switching-indicator">
                <div className="loading-spinner"></div>
                <p>Optimizing content for {platformOptions.find(p => p.id === currentPlatform)?.label}...</p>
              </div>
            )}
            
            {!isPlatformSwitching && (
              <div className="main-editor-container">
                <div className="main-editor-header">
                  <h3>
                    {platformOptions.find(p => p.id === currentPlatform)?.icon} 
                    {platformOptions.find(p => p.id === currentPlatform)?.label} Content
                  </h3>
                  <button 
                    className="action-button secondary small-button"
                    onClick={() => copyToClipboard(mainEditorContent)}
                    disabled={!mainEditorContent}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                
                <div className="main-editor-content">
                  <EditorWithProtection
                    platform={currentPlatform}
                    content={mainEditorContent}
                    onChange={handleMainEditorContentChange}
                  />
                </div>
              </div>
            )}
            
            {/* Section to display results for OTHER platforms */}
            <div className="optimized-results-section">
              {platformOptions
                .filter(platform => platform.id !== currentPlatform && optimizedContentMap[platform.id])
                .map(platform => {
                  const platformData = optimizedContentMap[platform.id];
                  // Only render if content exists and it's not loading
                  if (!platformData || platformData.isLoading || !platformData.content) return null; 
                  
                  // Check if content indicates an error
                  const isError = platformData.error || 
                                (typeof platformData.content === 'string' && 
                                platformData.content.startsWith('Error:'));

                  return (
                    <div key={platform.id} className={`optimized-result-card ${isError ? 'error' : ''}`}>
                      <div className="result-header">
                        <h3>
                          {isError ? `⚠️ ${platform.label} Error` : `${platform.icon} ${platform.label} Content`}
                        </h3>
                        {!isError && (
                          <button 
                            className="action-button secondary small-button"
                            onClick={() => copyToClipboard(platformData.content)}
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <div className="result-content markdown-preview">
                        {isError ? (
                           <p className="error-text">⚠️ {platformData.content.replace('Error: ', '')}</p>
                        ) : (
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                             {platformData.content}
                           </ReactMarkdown>
                        )}
                      </div>
                      {isError && (
                        <button 
                          className="action-button secondary"
                          onClick={() => optimizeForAdditionalPlatform(platform.id)}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
            
            <div className="action-container">
              <button 
                className="action-button secondary" 
                onClick={handleBackToStep2}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Config view render function
  const renderConfigView = () => {
    return <ConfigPage />;
  };

  // Add the optimizeForAdditionalPlatform function
  const optimizeForAdditionalPlatform = async (platformId) => {
    // Check if the platform content has already been edited by the user
    const existingData = optimizedContentMap[platformId];
    const hasBeenEdited = existingData?.edited === true;
    
    // If it's been manually edited and has content, just show that content without re-optimizing
    if (hasBeenEdited && existingData?.content && !existingData.error) {
      // Just show a message that we're using the edited version
      setStatusMessage(`Using your edited ${platformOptions.find(p => p.id === platformId)?.label || platformId} content`);
      setTimeout(() => setStatusMessage(''), 2000);
      return;
    }
    
    // Update the map to show loading state for this platform
    setOptimizedContentMap(prev => ({
      ...prev,
      [platformId]: { 
        ...(prev[platformId] || {}), // Keep existing data if any
        content: prev[platformId]?.content || '', 
        isLoading: true,
        error: false
      }
    }));

    try {
      // Get the instruction from ConfigPage
      const configPageInstruction = getOptimizeInstruction();
      
      // Call the API to optimize the content for this platform
      const optimizedContent = await OpenAIService.optimizeForPlatform(
        generatedOutline, // Use the outline as the base content to optimize
        platformId,
        contentType,
        configPageInstruction
      );

      // Update the map with the optimized content
      setOptimizedContentMap(prev => ({
        ...prev,
        [platformId]: {
          ...(prev[platformId] || {}),
          content: optimizedContent,
          isLoading: false,
          error: false,
          edited: false, // Reset edited flag
          timestamp: new Date().toISOString() // Add timestamp for cache management
        }
      }));

      // Show success message
      setStatusMessage(`Content optimized for ${platformOptions.find(p => p.id === platformId)?.label || platformId}!`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error(`Error optimizing for ${platformId}:`, error);
      // Update the map with the error
      setOptimizedContentMap(prev => ({
        ...prev,
        [platformId]: {
          ...(prev[platformId] || {}),
          content: `Error: ${error.message || 'Failed to optimize content'}`,
          isLoading: false,
          error: true,
          edited: false // Reset edited flag
        }
      }));

      // Show error message
      setApiKeyError(`Failed to optimize for ${platformId}. ${error.message || 'API error'}`);
      setTimeout(() => setApiKeyError(''), 5000);
    }
  };

  // Create a custom editor component with unmount protection
  const EditorWithProtection = ({ platform, content, onChange }) => {
    // Save content on unmount
    useEffect(() => {
      // Return cleanup function that runs when component unmounts
      return () => {
        if (content && platform) {
          console.log(`Saving content for ${platform} on editor unmount`);
          // Save content to optimizedContentMap when component unmounts
          setOptimizedContentMap(prev => ({
            ...prev,
            [platform]: {
              ...(prev[platform] || {}),
              content: content,
              isLoading: false,
              edited: true
            }
          }));
        }
      };
    }, [platform, content]);

    return (
      <Editor 
        key={`editor-${platform}`}
        initialContent={content}
        onChange={onChange}
        platform={platform}
        placeholder={`Loading content optimized for ${platform}...`}
      />
    );
  };

  // Get content for the current view
  const renderContent = () => {
    switch(currentView) {
      case 'home':
        return renderHomeView();
      case 'config':
        return renderConfigView();
      default:
        return renderHomeView();
    }
  };

  return (
    <div className={`App ${theme}`}>
      {renderSidebar()}
      
      <div className={`app-main ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
        <div className="content-container">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
