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
  const [activeTab, setActiveTab] = useState('simulator');
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
    <div className="page-wrapper">
      {/* 2. Sticky Header Container (840px max-width) */}
      <div className="sticky-header-container">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* 3. Main Content Container (920px max-width) */}
      <div className="main-content-container">
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
          <main>
            <GitSimulator />
          </main>
        )}

        {activeTab === 'scenarios' && (
          <main>
            <ScenarioSimulator />
          </main>
        )}

        {activeTab === 'cheatsheet' && (
          <main>
            <CheatSheet />
          </main>
        )}

        {activeTab === 'config' && (
          <main>
            <GitConfigBuilder />
          </main>
        )}
      </div>
    </div>
  );
}
