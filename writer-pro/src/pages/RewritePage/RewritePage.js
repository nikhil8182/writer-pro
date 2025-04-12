import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getRewriteInstruction } from '../../components/ConfigPage';
import OpenAIService from '../../services/openai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../../App.css';

function RewritePage() {
  const { theme } = useContext(ThemeContext);
  const [rewriteContent, setRewriteContent] = useState('');
  const [rewriteResult, setRewriteResult] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState('professional');
  const [apiKeyError, setApiKeyError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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

  const rewriteStyles = [
    { id: 'professional', label: 'Professional', icon: '👔' },
    { id: 'casual', label: 'Casual', icon: '😊' },
    { id: 'creative', label: 'Creative', icon: '🎨' },
    { id: 'formal', label: 'Formal', icon: '📜' },
    { id: 'simple', label: 'Simple', icon: '🔤' },
  ];

  const handleRewrite = async () => {
    if (!rewriteContent) return;
    
    setIsRewriting(true);
    setRewriteResult('');
    
    try {
      // Get the instruction from ConfigPage
      const configPageInstruction = getRewriteInstruction();
      
      // Use our rewriteContent endpoint
      const rewritten = await OpenAIService.rewriteContent(
        rewriteContent,
        rewriteStyle,
        configPageInstruction
      );
      
      setRewriteResult(rewritten);
      setStatusMessage("Content successfully rewritten!");
    } catch (error) {
      console.error("Error rewriting content:", error);
      setApiKeyError(`Failed to rewrite content. ${error.message || 'API error'}`);
    } finally {
      setIsRewriting(false);
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

  return (
    <div className="rewrite-view">
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
      
      <div className="content-card">
        <div className="content-nav">
          <h2 className="nav-title">Content Rewriter</h2>
        </div>
        
        <div className="rewrite-container">
          <h3>Input Content</h3>
          <textarea
            className="content-textarea"
            value={rewriteContent}
            onChange={(e) => setRewriteContent(e.target.value)}
            placeholder="Paste content you want to rewrite..."
            rows={8}
          />
          
          <h3>Rewrite Style</h3>
          <div className="rewrite-options">
            {rewriteStyles.map(style => (
              <button
                key={style.id}
                className={`rewrite-option ${rewriteStyle === style.id ? 'active' : ''}`}
                onClick={() => setRewriteStyle(style.id)}
              >
                <span>{style.icon}</span> {style.label}
              </button>
            ))}
          </div>
          
          <div className="action-container">
            <button 
              className="action-button primary" 
              onClick={handleRewrite}
              disabled={!rewriteContent || isRewriting}
            >
              {isRewriting ? (
                <>
                  <div className="loading-spinner"></div>
                  Rewriting...
                </>
              ) : 'Rewrite Content'}
            </button>
          </div>
          
          {rewriteResult && (
            <div className="rewrite-result">
              <div className="result-header">
                <h3>Rewritten Content ({rewriteStyles.find(s => s.id === rewriteStyle)?.label})</h3>
                <button 
                  className="action-button secondary small-button"
                  onClick={() => copyToClipboard(rewriteResult)}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="result-content markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rewriteResult}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RewritePage; 