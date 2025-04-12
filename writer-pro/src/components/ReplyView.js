import React, { useState, useEffect } from 'react';
import OpenAIService from '../services/openai';
import { getReplyInstruction } from './ConfigPage'; // Import the getter
import './ReplyView.css';

function ReplyView() {
  const [commentText, setCommentText] = useState('');
  const [replyTone, setReplyTone] = useState('helpful'); // e.g., helpful, appreciative, critical, funny
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReply = async () => {
    if (!commentText) return;

    setIsLoading(true);
    setError('');
    setGeneratedReply('');

    try {
      // TODO: Replace with a dedicated backend endpoint for replying to comments
      // For now, we can adapt the rewrite endpoint or create a specific prompt
      const prompt = `Generate a ${replyTone} reply to the following comment:\n\nComment:\n"${commentText}"\n\nReply:`;
      
      // Using rewriteContent as a placeholder - ideally needs a specific backend route
      // const reply = await OpenAIService.rewriteContent(prompt, replyTone, 'Generate a suitable reply'); 
      
      // Get custom instruction from ConfigPage (assuming it exists and is exported)
      // TODO: Need to import getReplyInstruction if it exists in ConfigPage, or handle differently
      // const customInstruction = null; // Placeholder: Need a way to get this instruction
      const customInstruction = getReplyInstruction(); // Use the imported getter
      
      // Use the new generateReply service function
      const reply = await OpenAIService.generateReply(commentText, replyTone, customInstruction);
      setGeneratedReply(reply);
    } catch (err) {
      console.error("Error generating reply:", err);
      setError(`Failed to generate reply. ${err.message || 'API error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reply-view">
      <div className="content-card">
        <div className="content-nav">
          <h2 className="nav-title">Reply to Comments</h2>
        </div>

        <div className="reply-form">
          <div className="form-group">
            <label htmlFor="comment-text">Comment to Reply To:</label>
            <textarea
              id="comment-text"
              className="content-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Paste the comment here..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reply-tone">Desired Reply Tone:</label>
            <select 
              id="reply-tone"
              value={replyTone}
              onChange={(e) => setReplyTone(e.target.value)}
            >
              <option value="helpful">Helpful</option>
              <option value="appreciative">Appreciative</option>
              <option value="critical">Addressing Criticism</option>
              <option value="funny">Funny / Witty</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div className="action-container">
            <button 
              className="action-button primary" 
              onClick={handleGenerateReply}
              disabled={!commentText || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Generating Reply...
                </>
              ) : 'Generate Reply'}
            </button>
          </div>
        </div>

        {error && (
          <div className="api-error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {generatedReply && (
          <div className="reply-result">
            <h3>Generated Reply:</h3>
            <textarea
              className="content-textarea result-textarea"
              value={generatedReply}
              readOnly
              rows={6}
            />
            <button 
              className="action-button secondary small-button copy-button"
              onClick={() => navigator.clipboard.writeText(generatedReply)}
            >
              Copy Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplyView; 