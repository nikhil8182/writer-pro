import React from 'react';
import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import PropTypes from 'prop-types';

const Sidebar = ({ 
  sidebarOpen, 
  toggleSidebar, 
  currentView, 
  setCurrentView, 
  resetWorkflow 
}) => {
  const { theme } = useContext(ThemeContext);

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
            className={currentView === 'rewrite' ? 'nav-item active' : 'nav-item'} 
            onClick={() => {
              setCurrentView('rewrite');
            }}>
            <span className="nav-icon">🔄</span>
            <span className="nav-label">Rewrite</span>
          </button>
          <button 
            className={currentView === 'reply' ? 'nav-item active' : 'nav-item'} 
            onClick={() => {
              setCurrentView('reply');
            }}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Reply</span>
          </button>
          <button 
            className={currentView === 'history' ? 'nav-item active' : 'nav-item'} 
            onClick={() => {
              setCurrentView('history');
            }}>
            <span className="nav-icon">📚</span>
            <span className="nav-label">History</span>
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
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired,
  setCurrentView: PropTypes.func.isRequired,
  resetWorkflow: PropTypes.func.isRequired
};

export default Sidebar; 