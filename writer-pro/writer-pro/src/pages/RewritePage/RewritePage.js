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
    <div className="rewrite-view fade-in">
      <div className="page-header mb-4">
        <h1>Content Rewriter</h1>
        <p className="text-secondary">Transform your content into different styles</p>
      </div>
      
      {apiKeyError && (
        <div className="api-error-message">
          <p>⚠️ {apiKeyError}</p>
        </div>
      )}
      
      {statusMessage && (
        <div className="status-message">
          <p>{statusMessage}</p>
        </div>
      )}
      
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">Rewrite Your Content</h2>
        </div>
        
        <div className="card-body p-4">
          <div className="form-group">
            <label htmlFor="rewrite-content" className="form-label">Input Content</label>
            <textarea
              id="rewrite-content"
              className="form-control"
              value={rewriteContent}
              onChange={(e) => setRewriteContent(e.target.value)}
              placeholder="Paste content you want to rewrite..."
              rows={8}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Rewrite Style</label>
            <div className="row">
              {rewriteStyles.map(style => (
                <div key={style.id} className="col-6 col-md-4 col-lg mb-3">
                  <button
                    className={`w-100 p-3 text-center ${rewriteStyle === style.id ? 'button-primary' : 'button-outline'}`}
                    onClick={() => setRewriteStyle(style.id)}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div className="mb-2" style={{ fontSize: '1.5rem' }}>{style.icon}</div>
                    <div className="font-weight-bold">{style.label}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="d-flex justify-content-center mt-4">
            <button 
              className="button-primary"
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
        </div>
      </div>
      
      {rewriteResult && (
        <div className="card mt-4 slide-in">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <span className="mr-2" style={{ fontSize: '1.2rem' }}>
                {rewriteStyles.find(s => s.id === rewriteStyle)?.icon}
              </span>
              Rewritten Content ({rewriteStyles.find(s => s.id === rewriteStyle)?.label})
            </h3>
            <button 
              className="button-secondary"
              onClick={() => copyToClipboard(rewriteResult)}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="card-body markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rewriteResult}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewritePage; 