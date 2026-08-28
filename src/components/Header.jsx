import React from 'react';
import { GitBranch, Terminal, ShieldAlert, BookOpen, Settings, Award, Sun, Moon } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <GitBranch size={26} />
        </div>
        <div>
          <h1 className="brand-title">Git Mastery Hub</h1>
          <p className="brand-subtitle">Basic to Advanced Production & Enterprise Workflows</p>
        </div>
      </div>

      <div className="header-controls">
        <nav className="nav-tabs">
          <button
            className={`nav-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <BookOpen size={18} />
            Curriculum
          </button>
          
          <button
            className={`nav-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Terminal size={18} />
            Visual Simulator
          </button>

          <button
            className={`nav-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            <ShieldAlert size={18} />
            Scenarios
          </button>

          <button
            className={`nav-btn ${activeTab === 'cheatsheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('cheatsheet')}
          >
            <Award size={18} />
            Cheat Sheet
          </button>

          <button
            className={`nav-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={18} />
            .gitconfig Builder
          </button>
        </nav>

        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={18} color="#ffb703" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} color="#7928ca" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
