import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './StatusMessage.css';

const StatusMessage = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`status-message ${type} ${message ? 'visible' : ''}`}>
      <span className="status-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✗'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <span className="status-text">{message}</span>
    </div>
  );
};

StatusMessage.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func
};

export default StatusMessage; 