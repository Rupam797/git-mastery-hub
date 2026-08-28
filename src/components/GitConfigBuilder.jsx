import React, { useState } from 'react';
import { Settings, Copy, Check, Terminal, Sparkles } from 'lucide-react';

export default function GitConfigBuilder() {
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('john.doe@company.com');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [editor, setEditor] = useState('code --wait');
  const [autocrlf, setAutocrlf] = useState('input');
  const [pullRebase, setPullRebase] = useState(true);
  const [autoStash, setAutoStash] = useState(true);
  const [rerere, setRerere] = useState(true);
  const [enableAliases, setEnableAliases] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatedConfig = `[user]
    name = ${userName || 'Your Name'}
    email = ${userEmail || 'your.email@example.com'}

[init]
    defaultBranch = ${defaultBranch}

[core]
    autocrlf = ${autocrlf}
    editor = ${editor}

[pull]
    rebase = ${pullRebase ? 'true' : 'false'}

[rebase]
    autoStash = ${autoStash ? 'true' : 'false'}
    autoSquash = true

[rerere]
    enabled = ${rerere ? 'true' : 'false'}
${enableAliases ? `
[alias]
    st = status -s
    co = checkout
    sw = switch
    br = branch
    lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
    amend = commit --amend --no-edit
    discard = checkout -- .` : ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="content-card">
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h2 className="lesson-main-title">Interactive Enterprise .gitconfig Generator</h2>
        <p className="lesson-summary">Configure your personalized global Git environment with production aliases, auto-rebase, rerere, and safety defaults.</p>
      </div>

      <div className="config-container">
        {/* Form Controls */}
        <div className="config-form">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} color="var(--primary-cyan)" /> User & Repository Preferences
          </h3>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={userEmail} 
              onChange={(e) => setUserEmail(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Branch Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={defaultBranch} 
              onChange={(e) => setDefaultBranch(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default Editor</label>
            <select 
              className="form-input"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
            >
              <option value="code --wait">VS Code (code --wait)</option>
              <option value="vim">Vim</option>
              <option value="nano">Nano</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Line Endings (core.autocrlf)</label>
            <select 
              className="form-input"
              value={autocrlf}
              onChange={(e) => setAutocrlf(e.target.value)}
            >
              <option value="input">input (macOS / Linux recommendation)</option>
              <option value="true">true (Windows recommendation)</option>
              <option value="false">false (No conversion)</option>
            </select>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-heading)', marginTop: '0.5rem' }}>Production Power Toggles</h4>

          <label className="checkbox-label">
            <input type="checkbox" checked={pullRebase} onChange={(e) => setPullRebase(e.target.checked)} />
            <span>Enable <code>pull.rebase = true</code> (Avoid merge commit noise on pull)</span>
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={autoStash} onChange={(e) => setAutoStash(e.target.checked)} />
            <span>Enable <code>rebase.autoStash = true</code> (Auto-stash uncommitted work)</span>
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={rerere} onChange={(e) => setRerere(e.target.checked)} />
            <span>Enable <code>rerere.enabled = true</code> (Reuse recorded conflict resolutions)</span>
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={enableAliases} onChange={(e) => setEnableAliases(e.target.checked)} />
            <span>Include Power User Aliases (<code>git lg</code>, <code>git undo</code>, <code>git amend</code>)</span>
          </label>
        </div>

        {/* Live Config Preview & Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--accent-amber)" /> Generated ~/.gitconfig
            </h3>
            <button className="copy-btn" onClick={handleCopy} style={{ padding: '0.5rem 1rem' }}>
              {copied ? <Check size={16} color="#00dfa2" /> : <Copy size={16} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Config'}
            </button>
          </div>

          <div className="code-block" style={{ flex: 1, minHeight: '380px', margin: 0, whiteSpace: 'pre' }}>
            {generatedConfig}
          </div>

          <div className="callout callout-protip">
            <Terminal size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem' }}>
              Save this content to <code>~/.gitconfig</code> (or <code>C:\Users\&lt;username&gt;\.gitconfig</code> on Windows) to apply globally across all your repositories!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
