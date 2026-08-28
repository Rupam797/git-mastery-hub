import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LessonViewer from './components/LessonViewer';
import GitSimulator from './components/GitSimulator';
import ScenarioSimulator from './components/ScenarioSimulator';
import CheatSheet from './components/CheatSheet';
import GitConfigBuilder from './components/GitConfigBuilder';
import { gitModules } from './data/gitLessons';

export default function App() {
  const [activeTab, setActiveTab] = useState('lessons');
  const [activeLessonId, setActiveLessonId] = useState('git-architecture');
  
  // Theme state: default to 'dark' or stored preference
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('git-hub-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('git-hub-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Find active lesson object
  const allLessons = gitModules.flatMap(m => m.lessons);
  const currentLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];

  return (
    <div className="app-container">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {activeTab === 'lessons' && (
        <main className="main-layout">
          <Sidebar 
            activeLessonId={activeLessonId} 
            onSelectLesson={(id) => setActiveLessonId(id)} 
          />
          <LessonViewer lesson={currentLesson} />
        </main>
      )}

      {activeTab === 'simulator' && (
        <main style={{ marginTop: '1.5rem' }}>
          <GitSimulator />
        </main>
      )}

      {activeTab === 'scenarios' && (
        <main style={{ marginTop: '1.5rem' }}>
          <ScenarioSimulator />
        </main>
      )}

      {activeTab === 'cheatsheet' && (
        <main style={{ marginTop: '1.5rem' }}>
          <CheatSheet />
        </main>
      )}

      {activeTab === 'config' && (
        <main style={{ marginTop: '1.5rem' }}>
          <GitConfigBuilder />
        </main>
      )}
    </div>
  );
}
