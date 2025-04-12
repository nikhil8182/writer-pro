import './App.css';
import Editor from './components/Editor';
import ConfigPage from './components/ConfigPage';
import ThemeSwitcher from './components/ThemeSwitcher';
import { getOutlineInstruction, getOptimizeInstruction, getRewriteInstruction } from './components/ConfigPage';
import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { ThemeContext } from './contexts/ThemeContext';
import OpenAIService from './services/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HistoryView from './components/HistoryView';
import ReplyView from './components/ReplyView';
import Sidebar from './components/Layout/Sidebar';
import HomeView from './components/HomeView';
import StatusMessage from './components/ui/StatusMessage';

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
  const [statusType, setStatusType] = useState('info');
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [rewriteContent, setRewriteContent] = useState('');
  const [rewriteResult, setRewriteResult] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState('professional');

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
  const contentPresets = useMemo(() => [
    { id: 'latest-news', label: 'News', icon: '📰' },
    { id: 'motivation', label: 'Motivation', icon: '💪' },
    { id: 'info', label: 'Information', icon: 'ℹ️' },
    { id: 'vibe-check', label: 'Vibe Check', icon: '😎' },
    { id: 'surprise-me', label: 'Surprise Me', icon: '🎁' }
  ], []);

  // Platform options
  const platformOptions = useMemo(() => [
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'blog', label: 'Blog', icon: '📝' }
  ], []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleContentPresetClick = useCallback((preset) => {
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
  }, []);

  const generateAIOutline = useCallback(async () => {
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
      setStatusMessage('Failed to generate outline. Please try again.');
      setStatusType('error');
      // Stay on current step when there's an error
    } finally {
      setIsGenerating(false);
    }
  }, [contentDescription, contentType]);

  const selectPlatform = useCallback((platform) => {
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
        setStatusMessage(`Content optimized for ${platformOptions.find(p => p.id === platform)?.label}`);
        setStatusType('success');
      }).catch(error => {
        console.error(`Error optimizing for ${platform}:`, error);
        setApiKeyError(`Failed to optimize for ${platform}. ${error.message || 'API error'}`);
        setStatusMessage(`Failed to optimize for ${platform}`);
        setStatusType('error');
        
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
  }, [currentStep, mainEditorContent, currentPlatform, optimizedContentMap, generatedOutline, contentType, platformOptions]);

  // Add a function to handle editor content changes in step 3
  const handleMainEditorContentChange = useCallback((newContent) => {
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
  }, [currentPlatform]);

  const copyToClipboard = useCallback((content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopySuccess(true);
        setStatusMessage('Content copied to clipboard!');
        setStatusType('success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        setApiKeyError('Failed to copy to clipboard. Please try again.');
        setStatusMessage('Failed to copy to clipboard');
        setStatusType('error');
      });
  }, []);

  const resetWorkflow = useCallback(() => {
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
  }, []);

  // Function to handle going back from step 3 to step 2 while preserving content
  const handleBackToStep2 = useCallback(() => {
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
  }, [mainEditorContent, currentPlatform]);

  // Function to handle back button from step 2 to step 1
  const handleBackToStep1 = useCallback(() => {
    // Preserve the outline when going back to step 1
    setCurrentStep(1);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Handle the rewrite functionality
  const handleRewrite = useCallback(async () => {
    if (!rewriteContent || rewriteContent.trim() === '') {
      setStatusMessage('Please enter content to rewrite');
      setStatusType('warning');
      return;
    }
    
    setIsRewriting(true);
    try {
      // Get the instruction from ConfigPage
      const configPageInstruction = getRewriteInstruction();
      
      // Use OpenAI service to rewrite
      const rewritten = await OpenAIService.rewriteContent(
        rewriteContent,
        rewriteStyle,
        configPageInstruction
      );
      
      // Set the rewritten content
      setRewriteResult(rewritten);
      setStatusMessage('Content rewritten successfully');
      setStatusType('success');
    } catch (error) {
      console.error("Error rewriting content:", error);
      setApiKeyError('Error connecting to OpenAI API. Please check your configuration.');
      setStatusMessage('Failed to rewrite content');
      setStatusType('error');
    } finally {
      setIsRewriting(false);
    }
  }, [rewriteContent, rewriteStyle]);

  // Render main content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView 
            currentStep={currentStep}
            contentDescription={contentDescription}
            setContentDescription={setContentDescription}
            contentType={contentType}
            setContentType={setContentType}
            contentPresets={contentPresets}
            handleContentPresetClick={handleContentPresetClick}
            generateAIOutline={generateAIOutline}
            isGenerating={isGenerating}
            generatedOutline={generatedOutline}
            platformOptions={platformOptions}
            selectPlatform={selectPlatform}
            currentPlatform={currentPlatform}
            mainEditorContent={mainEditorContent}
            handleMainEditorContentChange={handleMainEditorContentChange}
            optimizedContentMap={optimizedContentMap}
            isPlatformSwitching={isPlatformSwitching}
            handleBackToStep1={handleBackToStep1}
            handleBackToStep2={handleBackToStep2}
            copyToClipboard={copyToClipboard}
            apiKeyError={apiKeyError}
          />
        );
      case 'rewrite':
        return (
          <div className="rewrite-view">
            <div className="content-card">
              <h2>Rewrite Content</h2>
              <div className="rewrite-container">
                <div className="content-description">
                  <label htmlFor="rewrite-content">Original Content:</label>
                  <textarea
                    id="rewrite-content"
                    placeholder="Enter content you want to rewrite..."
                    value={rewriteContent}
                    onChange={(e) => setRewriteContent(e.target.value)}
                    rows={8}
                  />
                </div>
                
                <div className="rewrite-options">
                  <label>Rewrite Style:</label>
                  <div className="option-buttons">
                    {['professional', 'casual', 'creative', 'simple', 'academic'].map((style) => (
                      <button
                        key={style}
                        className={`rewrite-option ${rewriteStyle === style ? 'active' : ''}`}
                        onClick={() => setRewriteStyle(style)}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="action-container">
                  <button 
                    className="action-button primary"
                    onClick={handleRewrite}
                    disabled={!rewriteContent || isRewriting}
                  >
                    {isRewriting ? 'Rewriting...' : 'Rewrite Content'}
                    {isRewriting && <span className="loading-spinner"></span>}
                  </button>
                </div>
                
                {rewriteResult && (
                  <div className="rewrite-result">
                    <h3>Rewritten Content</h3>
                    <div className="content-preview">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {rewriteResult}
                      </ReactMarkdown>
                    </div>
                    <div className="action-container">
                      <button 
                        className="action-button secondary"
                        onClick={() => copyToClipboard(rewriteResult)}
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'reply':
        return <ReplyView />;
      case 'history':
        return <HistoryView />;
      case 'config':
        return <ConfigPage />;
      default:
        return <div>Select a view from the sidebar</div>;
    }
  };

  return (
    <div className={`App ${theme}`}>
      <Sidebar 
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        currentView={currentView}
        setCurrentView={setCurrentView}
        resetWorkflow={resetWorkflow}
      />
      
      <div className={`app-main ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        <div className="main-header">
          <ThemeSwitcher />
        </div>
        
        <div className="content-container">
          {renderContent()}
        </div>
      </div>
      
      <StatusMessage 
        message={statusMessage}
        type={statusType}
        onClose={() => setStatusMessage('')}
      />
    </div>
  );
}

export default App;
