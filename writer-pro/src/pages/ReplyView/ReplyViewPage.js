import React, { useState, useEffect, useRef } from 'react';
import OpenAIService from '../../services/openai';
import { getReplyInstruction } from '../../components/ConfigPage';
import '../../App.css';
import './ReplyViewPage.css';

// Helper to get next ID for thread items
let nextId = 0;

function ReplyViewPage() {
  // State management
  const [contextThread, setContextThread] = useState([{ id: nextId++, author: 'original', text: '' }]);
  const [newMessageText, setNewMessageText] = useState('');
  const [replyTone, setReplyTone] = useState('helpful');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const resultRef = useRef(null);

  // Auto-focus on original post textarea when component mounts
  useEffect(() => {
    if (contextThread.length === 1) {
      // Find and focus the original post textarea
      const originalTextarea = document.querySelector('.thread-item-original .thread-textarea');
      if (originalTextarea) {
        originalTextarea.focus();
      }
    }
  }, []);

  // Auto-scroll to result when generated
  useEffect(() => {
    if (generatedReply && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedReply]);
  
  // Functions
  const handleThreadTextChange = (id, newText) => {
    setContextThread(currentThread => 
      currentThread.map(item => 
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`; // Cap at 300px height
  };

  const addMessageToThread = (author) => {
    if (!newMessageText.trim()) return;
    setContextThread(currentThread => [
      ...currentThread,
      { id: nextId++, author: author, text: newMessageText }
    ]);
    setNewMessageText('');
    
    // Focus back on the input after adding
    setTimeout(() => {
      const textarea = document.querySelector('.new-message-input');
      if (textarea) textarea.focus();
    }, 0);
  };

  const removeMessageFromThread = (idToRemove) => {
    setContextThread(currentThread => 
      currentThread.filter(item => !(item.id === idToRemove || (idToRemove === 'original' && item.author === 'original')))
    );
  };

  const resetThread = () => {
    const confirmReset = window.confirm("Are you sure you want to reset the entire conversation thread?");
    if (confirmReset) {
      setContextThread([{ id: nextId++, author: 'original', text: '' }]);
      setGeneratedReply('');
      setError('');
      
      // Focus on the empty original post textarea
      setTimeout(() => {
        const originalTextarea = document.querySelector('.thread-item-original .thread-textarea');
        if (originalTextarea) originalTextarea.focus();
      }, 0);
    }
  };

  const handleGenerateReply = async () => {
    const originalPostItem = contextThread.find(item => item.author === 'original');
    if (!originalPostItem || !originalPostItem.text.trim()) {
      setError('Please add content to the original post before generating a reply.');
      
      // Focus on the original post textarea if empty
      const originalTextarea = document.querySelector('.thread-item-original .thread-textarea');
      if (originalTextarea) originalTextarea.focus();
      
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedReply('');

    try {
      // Show a temporary generating message
      setGeneratedReply('Generating your reply...');
      
      const formattedContext = contextThread.map(item => 
        `[${item.author === 'me' ? 'My Reply' : item.author === 'other' ? 'Comment' : 'Original Post'}]\n${item.text}`
      ).join('\n\n---\n\n');
      
      const lastOtherComment = [...contextThread].reverse().find(item => item.author === 'other');
      
      let actionDescription = lastOtherComment
        ? `Generate a ${replyTone} reply to the last [Comment] in the following thread, considering the full context.`
        : `Generate a ${replyTone} comment on the [Original Post] in the following thread.`;

      const finalPrompt = `Context Thread:\n${formattedContext}\n\n---\n\nTask: ${actionDescription}`;
      const customInstruction = getReplyInstruction();
      
      const reply = await OpenAIService.generateReply(finalPrompt, replyTone, customInstruction);
      setGeneratedReply(reply);
    } catch (err) {
      console.error("Error generating reply:", err);
      setError(`Failed to generate reply. ${err.message || 'API error'}`);
      setGeneratedReply(''); // Clear the temporary message
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleAddGeneratedToThread = () => {
    if (!generatedReply) return;
    
    setContextThread(currentThread => [
      ...currentThread,
      { id: nextId++, author: 'me', text: generatedReply }
    ]);
    
    // Clear the generated reply to avoid duplication
    setGeneratedReply('');
  };

  const handleKeyDown = (e, action) => {
    // Ctrl+Enter to submit
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      action();
    }
  };

  // Get tone description for the selected tone
  const getToneDescription = () => {
    const descriptions = {
      helpful: "Provides useful, informative responses focused on solving problems.",
      appreciative: "Expresses warm gratitude and acknowledges value received.",
      critical: "Offers constructive feedback with analytical perspective.",
      funny: "Uses humor, wit, and playful language to engage readers.",
      formal: "Employs professional, structured language with proper etiquette.",
      casual: "Adopts a friendly, conversational tone with relaxed language.",
      agreeable: "Shows support and alignment with the original viewpoint.",
      disagreeable: "Presents counterpoints and challenges ideas respectfully.",
      empathetic: "Demonstrates understanding of emotions and experiences.",
      professional: "Maintains business-appropriate language with expertise."
    };
    
    return descriptions[replyTone] || "Adjust your response tone to match the context.";
  };

  return (
    <div className="reply-page">
      <div className="content-card">
        <h2>Reply Composer</h2>
        <p className="subtitle">Create perfect responses to comments and posts</p>
        
        <div className="reply-thread-section">
          <h3>Conversation Thread</h3>
          <div className="thread-list">
            {contextThread.map((item) => (
              <div key={item.id} className={`thread-item thread-item-${item.author}`}>
                <div className="thread-item-header">
                  <label>
                    {item.author === 'original' ? 'Original Post' : 
                     item.author === 'other' ? 'Comment from Others' : 'My Reply'}
                  </label>
                  <button
                    className="remove-button"
                    onClick={() => removeMessageFromThread(item.id)}
                    title={`Remove this ${item.author === 'original' ? 'post' : item.author === 'other' ? 'comment' : 'reply'}`}
                    aria-label={`Remove this ${item.author === 'original' ? 'post' : item.author === 'other' ? 'comment' : 'reply'}`}
                    disabled={item.author === 'original' && contextThread.length === 1}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  className="thread-textarea"
                  value={item.text}
                  onChange={(e) => handleThreadTextChange(item.id, e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.target)}
                  placeholder={
                    item.author === 'original' 
                      ? 'Enter the original post content...' 
                      : item.author === 'other' 
                        ? 'Enter a comment from another person...' 
                        : 'Enter your reply...'
                  }
                  rows={1}
                  aria-label={
                    item.author === 'original' 
                      ? 'Original post content' 
                      : item.author === 'other' 
                        ? 'Comment from others' 
                        : 'Your reply'
                  }
                />
              </div>
            ))}
          </div>
          
          <div className="add-message-section">
            <textarea
              className="new-message-input"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onInput={(e) => autoResizeTextarea(e.target)}
              placeholder="Write a message to add to the thread..."
              rows={2}
              onKeyDown={(e) => handleKeyDown(e, () => addMessageToThread('other'))}
              aria-label="New message input"
            />
            <div className="composer-hint">
              Use <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to add quickly
            </div>
            <div className="add-message-buttons">
              <button 
                className="action-button secondary"
                onClick={() => addMessageToThread('other')}
                disabled={!newMessageText.trim()}
                aria-label="Add as comment from others"
              >
                <span className="button-icon">💬</span> Add as Comment
              </button>
              <button 
                className="action-button secondary"
                onClick={() => addMessageToThread('me')}
                disabled={!newMessageText.trim()}
                aria-label="Add as your reply"
              >
                <span className="button-icon">✏️</span> Add as My Reply
              </button>
            </div>
          </div>
        </div>
        
        <div className="tone-section">
          <div className="form-group">
            <label htmlFor="tone-select">Response Tone</label>
            <select 
              id="tone-select" 
              value={replyTone} 
              onChange={e => setReplyTone(e.target.value)}
              className="tone-dropdown"
              aria-label="Select response tone"
            >
              <option value="helpful">Helpful</option>
              <option value="appreciative">Appreciative</option>
              <option value="critical">Critical</option>
              <option value="funny">Funny</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="agreeable">Agreeable</option>
              <option value="disagreeable">Disagreeable</option>
              <option value="empathetic">Empathetic</option>
              <option value="professional">Professional</option>
            </select>
            <p className="tone-description">
              {getToneDescription()}
            </p>
          </div>
          
          <div className="action-container">
            <button 
              className="action-button primary"
              onClick={handleGenerateReply}
              disabled={!(contextThread.find(item => item.author === 'original')?.text.trim()) || isLoading}
              aria-label="Generate AI reply"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="button-icon" aria-hidden="true">✨</span> Generate Reply
                </>
              )}
            </button>
            <button 
              className="action-button secondary"
              onClick={resetThread}
              title="Reset conversation"
              aria-label="Reset conversation thread"
            >
              <span className="button-icon" aria-hidden="true">🔄</span> Reset
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {generatedReply && (
          <div className="results-section" ref={resultRef}>
            <div className="results-header">
              <h3>Generated Reply</h3>
              <div className="results-actions">
                <button 
                  className="action-button secondary small"
                  onClick={handleAddGeneratedToThread}
                  title="Add this reply to thread"
                  aria-label="Add this reply to thread"
                >
                  Add to Thread
                </button>
                <button 
                  className="copy-button"
                  onClick={handleCopyToClipboard}
                  title="Copy to clipboard"
                  aria-label="Copy to clipboard"
                >
                  {copySuccess ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>
            <div 
              className="result-content" 
              tabIndex={0}
              aria-label="Generated reply content"
            >
              {generatedReply}
            </div>
          </div>
        )}
        
        <div className="page-footer">
          <p>👋 Generate the perfect reply to any comment or post with WriterPro's AI assistant</p>
        </div>
      </div>
    </div>
  );
}

export default ReplyViewPage; 