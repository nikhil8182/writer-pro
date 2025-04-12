import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import './Layout.css';

function Layout({ children }) {
  const { theme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const resetWorkflow = () => {
    // Navigate to home and let the home component handle the reset
    navigate('/');
  };

  return (
    <div className={`App ${theme}`}>
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
              className={isActive('/') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/');
              }}>
              <span className="nav-icon">📝</span>
              <span className="nav-label">Write</span>
            </button>
            <button 
              className={isActive('/rewrite') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/rewrite');
              }}>
              <span className="nav-icon">🔄</span>
              <span className="nav-label">Rewrite</span>
            </button>
            <button 
              className={isActive('/reply') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/reply');
              }}>
              <span className="nav-icon">💬</span>
              <span className="nav-label">Reply</span>
            </button>
            <button 
              className={isActive('/history') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/history');
              }}>
              <span className="nav-icon">📚</span>
              <span className="nav-label">History</span>
            </button>
            <button 
              className={isActive('/config') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/config');
              }}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
            <button 
              className={isActive('/todo') ? 'nav-item active' : 'nav-item'} 
              onClick={() => {
                navigate('/todo');
              }}>
              <span className="nav-icon">✓</span>
              <span className="nav-label">Todo</span>
            </button>
          </nav>
        </div>
      </div>
      
      <div className={`app-main ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout; 