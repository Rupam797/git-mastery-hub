import React, { useState } from 'react';
import { Search, Copy, Check, Terminal, Award } from 'lucide-react';
import { cheatSheetCategories } from '../data/gitLessons';

export default function CheatSheet() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(null);

  const handleCopy = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const filteredCategories = cheatSheetCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.cmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="content-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <h2 className="lesson-main-title">Production Git Command Matrix & Cheat Sheet</h2>
          <p className="lesson-summary">Instant searchable CLI reference for everyday, intermediate, and rescue operations.</p>
        </div>
      </div>

      <div style={{ position: 'relative', margin: '0.5rem 0 1rem 0' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
        <input
          type="text"
          className="form-input"
          style={{ width: '100%', paddingLeft: '42px', fontSize: '1rem' }}
          placeholder="Search commands by name or description (e.g. rebase, stash, reset, reflog)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="cheatsheet-grid">
        {filteredCategories.map((cat, idx) => (
          <div key={idx} className="cheatsheet-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--primary-cyan)" /> {cat.category}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cat.items.map((item, i) => (
                <div key={i} className="command-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span className="command-code">{item.cmd}</span>
                    <button className="copy-btn" onClick={() => handleCopy(item.cmd)}>
                      {copiedCmd === item.cmd ? <Check size={14} color="#00dfa2" /> : <Copy size={14} />}
                      {copiedCmd === item.cmd ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <span className="command-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
