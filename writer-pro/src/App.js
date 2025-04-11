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
      setGeneratedOutline(outline);
      setCurrentStep(2);
    } catch (error) {
      setApiKeyError('Error connecting to OpenAI API. Please check your configuration.');
      // Stay on current step when there's an error
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPlatform = (platform) => {
    // Store current content if moving from step 3
    if (currentStep === 3 && mainEditorContent) {
      setOptimizedContentMap(prev => ({
        ...prev,
        [currentPlatform]: { 
          content: mainEditorContent, 
          isLoading: false 
        }
      }));
    }
    
    setCurrentPlatform(platform);
    
    // Check if we already have optimized content for this platform
    const platformData = optimizedContentMap[platform];
    
    if (!platformData) {
      // If no optimized content exists, trigger optimization
      setMainEditorContent(''); // Clear main editor while loading
      
      // Update UI to show loading state
      setOptimizedContentMap(prev => ({
        ...prev,
        [platform]: { 
          content: '', 
          isLoading: true 
        }
      }));
      
      // Get the instruction from ConfigPage
      const configPageInstruction = getOptimizeInstruction();
      
      // For the primary platform, call the API directly and update main editor content
      // This ensures the primary platform is optimized when going from step 2 to step 3
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
            content: optimizedContent,
            isLoading: false
          }
        }));
      }).catch(error => {
        console.error(`Error optimizing for ${platform}:`, error);
        setApiKeyError(`Failed to optimize for ${platform}. ${error.message || 'API error'}`);
        
        // Still update the map with the error
        setOptimizedContentMap(prev => ({
          ...prev,
          [platform]: {
            content: `Error: ${error.message || 'Failed to optimize content'}`,
            isLoading: false
          }
        }));
      });
    } else if (!platformData.isLoading) {
      // If we have content and it's not loading, use it
      setMainEditorContent(platformData.content);
    } else {
      // Content is loading, clear the editor temporarily
      setMainEditorContent('');
    }
    
    setCurrentStep(3);
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopySuccess(true);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setContentDescription('');
    setContentType('');
    setGeneratedOutline('');
    setMainEditorContent('');
    setFinalContent('');
    setCurrentPlatform('');
    setOptimizedContentMap({});
    setApiKeyError('');
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
        {currentStep === 1 && (
          <div className="content-card">
            <div className="step-indicator">
              <div className="step-number">1</div>
              <div className="step-label">Step 1 of 3: Describe Your Content</div>
            </div>
            <h2>What do you want to create?</h2>
            
            <div className="content-description">
              <textarea 
                value={contentDescription}
                onChange={(e) => setContentDescription(e.target.value)}
                placeholder="Describe what you want to write about..."
                className="content-textarea"
              />
            </div>
            
            <div className="content-presets">
              <h3>Quick templates:</h3>
              <div className="preset-grid">
                {contentPresets.map(preset => (
                  <button 
                    key={preset.id}
                    className={contentType === preset.id ? 'preset-card active' : 'preset-card'}
                    onClick={() => handleContentPresetClick(preset)}
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
                disabled={(!contentDescription && !contentType) || isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Outline'} {isGenerating && <span className="loading-spinner"></span>}
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="content-card">
            <div className="step-indicator">
              <div className="step-number">2</div>
              <div className="step-label">Step 2 of 3: Choose Platform & Review Outline</div>
            </div>
            <h2>AI-Generated Outline</h2>
            {apiKeyError && <div className="api-error-message">{apiKeyError}</div>}
            
            <div className="outline-container">
              <div className="outline-content">
                <textarea
                  value={generatedOutline}
                  onChange={(e) => setGeneratedOutline(e.target.value)}
                  className="outline-textarea"
                  placeholder="Your outline will appear here..."
                />
              </div>
            </div>
            
            <div className="platform-selector">
              <h3>Select platform to optimize for</h3>
              <div className="platform-grid">
                {platformOptions.map(platform => (
                  <button 
                    key={platform.id}
                    className="platform-card"
                    onClick={() => selectPlatform(platform.id)}
                  >
                    <div className="platform-icon">{platform.icon}</div>
                    <div className="platform-name">{platform.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="action-container">
              <button className="action-button secondary" onClick={() => setCurrentStep(1)}>
                Back
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="content-card">
            <div className="step-indicator">
              <div className="step-number">3</div>
              <div className="step-label">Step 3 of 3: Edit & Copy Content</div>
            </div>
            <h2>Optimize for {currentPlatform}</h2>
            {apiKeyError && <div className="api-error-message">{apiKeyError}</div>}
            
            {optimizedContentMap[currentPlatform]?.isLoading && (
              <div className="platform-switching-indicator">
                <div className="loading-spinner"></div>
                <p>Optimizing initial content for {currentPlatform}...</p>
              </div>
            )}
            
            <Editor 
              platform={currentPlatform} 
              contentDescription={contentDescription}
              contentType={contentType}
              value={mainEditorContent || ''}
              onContentChange={(newContent) => {
                setMainEditorContent(newContent);
                if (currentPlatform && optimizedContentMap[currentPlatform]) {
                  setOptimizedContentMap(prev => ({
                    ...prev,
                    [currentPlatform]: { ...prev[currentPlatform], content: newContent }
                  }));
                }
              }}
            />
            
            <div className="action-container">
              <button className="action-button secondary" onClick={() => setCurrentStep(2)}>
                Back
              </button>
              <button 
                className="action-button primary"
                onClick={() => copyToClipboard(mainEditorContent)}
                disabled={!mainEditorContent || optimizedContentMap[currentPlatform]?.isLoading}
              >
                {copySuccess ? '✓ Copied!' : `Copy ${currentPlatform} Content`}
              </button>
              <button 
                className="action-button secondary"
                onClick={resetWorkflow}
              >
                Create New Content
              </button>
            </div>

            {/* Section for optimizing for OTHER platforms */}
            <div className="other-platforms-section">
              <h3>Also optimize for:</h3>
              <div className="platform-grid">
                {platformOptions
                  .filter(platform => platform.id !== currentPlatform)
                  .map(platform => {
                    const platformData = optimizedContentMap[platform.id];
                    const isLoading = platformData?.isLoading;
                    const isOptimized = platformData && !isLoading && platformData.content;
                    
                    return (
                      <button 
                        key={platform.id}
                        className={`platform-card ${isOptimized ? 'optimized' : ''} ${isLoading ? 'loading' : ''}`}
                        onClick={() => optimizeForAdditionalPlatform(platform.id)}
                        disabled={isLoading}
                        title={isLoading ? `Optimizing for ${platform.label}...` : `Optimize for ${platform.label}`}
                      >
                        {isLoading ? (
                          <div className="loading-spinner dark"></div> // Use dark spinner for visibility
                        ) : (
                          <div className="platform-icon">{platform.icon}</div>
                        )}
                        <div className="platform-name">{platform.label}</div>
                        {isOptimized && !isLoading && (
                          <div className="optimized-badge" title="Optimized">✓</div>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Section to display results for OTHER platforms */}
            <div className="optimized-results-section">
              {platformOptions
                .filter(platform => platform.id !== currentPlatform && optimizedContentMap[platform.id])
                .map(platform => {
                  const platformData = optimizedContentMap[platform.id];
                  // Only render if content exists and it's not loading
                  if (!platformData || platformData.isLoading || !platformData.content) return null; 
                  
                  // Check if content indicates an error
                  const isError = typeof platformData.content === 'string' && platformData.content.startsWith('Error:');

                  return (
                    <div key={platform.id} className={`optimized-result-card ${isError ? 'error' : ''}`}>
                      <div className="result-header">
                        <h3>{platform.label} Content</h3>
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
                           <p className="error-text">⚠️ {platformData.content}</p>
                        ) : (
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                             {platformData.content}
                           </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  )
                })}
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
    // Update the map to show loading state for this platform
    setOptimizedContentMap(prev => ({
      ...prev,
      [platformId]: { 
        ...(prev[platformId] || {}), // Keep existing data if any
        content: prev[platformId]?.content || '', 
        isLoading: true 
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
          content: optimizedContent,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error(`Error optimizing for ${platformId}:`, error);
      // Update the map with the error
      setOptimizedContentMap(prev => ({
        ...prev,
        [platformId]: {
          content: `Error: ${error.message || 'Failed to optimize content'}`,
          isLoading: false
        }
      }));
    }
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
