import React, { useState } from 'react';
import { Copy, Check, Terminal, Zap, ShieldCheck } from 'lucide-react';

export default function LessonViewer({ lesson }) {
  const [copiedCmd, setCopiedCmd] = useState(null);

  if (!lesson) return null;

  const handleCopy = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="content-card">
      <div className="lesson-header">
        <div className="lesson-title-meta">
          <h2 className="lesson-main-title">{lesson.title}</h2>
        </div>
        <p className="lesson-summary">{lesson.summary}</p>
      </div>

      <div 
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(lesson.content) }}
      />

      {lesson.commands && lesson.commands.length > 0 && (
        <div className="commands-section">
          <h3 className="section-title">
            <Terminal size={18} color="var(--primary-cyan)" />
            Essential Commands Reference
          </h3>

          {lesson.commands.map((item, idx) => (
            <div key={idx} className="command-row">
              <div>
                <div className="command-code">{item.cmd}</div>
                <div className="command-desc">{item.desc}</div>
              </div>
              <button className="copy-btn" onClick={() => handleCopy(item.cmd)}>
                {copiedCmd === item.cmd ? <Check size={14} color="#00dfa2" /> : <Copy size={14} />}
                {copiedCmd === item.cmd ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}

      {lesson.proTip && (
        <div className="callout callout-protip">
          <Zap size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'white' }}>Pro Tip</strong>
            <span>{lesson.proTip}</span>
          </div>
        </div>
      )}

      {lesson.productionUse && (
        <div className="callout callout-prod">
          <ShieldCheck size={22} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'white' }}>Enterprise Production Standard</strong>
            <span>{lesson.productionUse}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple markdown formatter helper for lesson content rendering
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background: rgba(0,242,254,0.1); color: #7dd3fc; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '<br/><br/>');
}
