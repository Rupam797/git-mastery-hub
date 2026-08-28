import React from 'react';
import { GitBranch, Terminal, ShieldAlert, BookOpen, Settings, Award, Sun, Moon } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon">
            <GitBranch size={22} />
          </div>
          <div>
            <h1 className="brand-title">Git Mastery Hub</h1>
            <p className="brand-subtitle">Zero to Enterprise Production</p>
          </div>
        </div>

        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} color="#ffb703" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={16} color="#7928ca" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-btn ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <BookOpen size={16} />
          <span>Curriculum</span>
        </button>
        
        <button
          className={`nav-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Terminal size={16} />
          <span>Simulator</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          <ShieldAlert size={16} />
          <span>Scenarios</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'cheatsheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('cheatsheet')}
        >
          <Award size={16} />
          <span>Cheat Sheet</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={16} />
          <span>.gitconfig</span>
        </button>
      </nav>
    </header>
  );
}
