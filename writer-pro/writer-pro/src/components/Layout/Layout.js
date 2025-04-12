import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../ThemeSwitcher';
import './Layout.css';

function Layout({ children }) {
  const { theme } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for mobile screen size and auto-collapse sidebar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <button 
              className={isActive('/') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/')}
              aria-label="Navigate to Write page"
            >
              <span className="nav-icon">📝</span>
              <span className="nav-label">Write</span>
            </button>
            <button 
              className={isActive('/rewrite') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/rewrite')}
              aria-label="Navigate to Rewrite page"
            >
              <span className="nav-icon">🔄</span>
              <span className="nav-label">Rewrite</span>
            </button>
            <button 
              className={isActive('/reply') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/reply')}
              aria-label="Navigate to Reply page"
            >
              <span className="nav-icon">💬</span>
              <span className="nav-label">Reply</span>
            </button>
            <button 
              className={isActive('/history') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/history')}
              aria-label="Navigate to History page"
            >
              <span className="nav-icon">📚</span>
              <span className="nav-label">History</span>
            </button>
            <button 
              className={isActive('/config') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/config')}
              aria-label="Navigate to Settings page"
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Settings</span>
            </button>
            <button 
              className={isActive('/todo') ? 'nav-item active' : 'nav-item'} 
              onClick={() => navigate('/todo')}
              aria-label="Navigate to Todo page"
            >
              <span className="nav-icon">✓</span>
              <span className="nav-label">Todo</span>
            </button>
          </nav>
          
          <div className="sidebar-footer">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
      
      {isMobile && !sidebarOpen && (
        <button 
          className="mobile-sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Open sidebar menu"
        >
          ☰
        </button>
      )}
      
      <div className={`app-main ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout; 