import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Bookmark } from 'lucide-react';
import { gitModules } from '../data/gitLessons';

export default function Sidebar({ activeLessonId, onSelectLesson }) {
  const [openModules, setOpenModules] = useState({
    'module-1': true,
    'module-2': true,
    'module-3': true,
    'module-4': true
  });

  const toggleModule = (id) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getBadgeClass = (level) => {
    switch (level) {
      case 'Basic': return 'badge-basic';
      case 'Intermediate': return 'badge-intermediate';
      case 'Advanced': return 'badge-advanced';
      case 'Production Level': return 'badge-production';
      default: return 'badge-basic';
    }
  };

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Bookmark size={18} color="var(--primary-cyan)" />
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-heading)' }}>Modules & Lessons</h3>
      </div>

      {gitModules.map(module => (
        <div key={module.id} className="module-card">
          <div className="module-header" onClick={() => toggleModule(module.id)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className="module-title">{module.title}</span>
              <span className={`badge ${getBadgeClass(module.level)}`} style={{ alignSelf: 'flex-start' }}>
                {module.level}
              </span>
            </div>
            {openModules[module.id] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>

          {openModules[module.id] && (
            <div className="lesson-list">
              {module.lessons.map(lesson => (
                <div
                  key={lesson.id}
                  className={`lesson-item ${activeLessonId === lesson.id ? 'active' : ''}`}
                  onClick={() => onSelectLesson(lesson.id)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lesson.title}
                  </span>
                  {activeLessonId === lesson.id && <CheckCircle2 size={16} color="var(--primary-cyan)" />}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
