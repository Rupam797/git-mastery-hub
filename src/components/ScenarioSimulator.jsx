import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { gitScenarios } from '../data/gitLessons';

export default function ScenarioSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(gitScenarios[0]);

  return (
    <div className="content-card">
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h2 className="lesson-main-title">Production Emergency & Disaster Recovery Scenarios</h2>
        <p className="lesson-summary">Real-world production situations engineers encounter in enterprise environments and step-by-step resolution playbooks.</p>
      </div>

      <div className="scenario-grid">
        {gitScenarios.map(sc => (
          <div 
            key={sc.id} 
            className="scenario-card"
            style={{
              borderColor: selectedScenario.id === sc.id ? 'var(--primary-cyan)' : 'var(--border-color)',
              background: selectedScenario.id === sc.id ? 'rgba(0, 242, 254, 0.06)' : 'var(--bg-card)'
            }}
            onClick={() => setSelectedScenario(sc)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-advanced">{sc.category}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: '700' }}>{sc.difficulty}</span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-heading)' }}>{sc.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sc.problem}</p>

            <button 
              className="copy-btn" 
              style={{ 
                marginTop: 'auto', 
                alignSelf: 'flex-start', 
                background: selectedScenario.id === sc.id ? 'var(--primary-cyan)' : 'var(--badge-bg-subtle)', 
                color: selectedScenario.id === sc.id ? '#ffffff' : 'var(--text-heading)' 
              }}
            >
              View Solution Playbook <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {selectedScenario && (
        <div style={{ background: 'var(--badge-bg-subtle)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldAlert size={26} color="var(--accent-amber)" />
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-heading)' }}>{selectedScenario.title}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Category: {selectedScenario.category}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: '0.2rem' }}>Problem Context</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{selectedScenario.problem}</span>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '0.75rem' }}>Step-by-Step Production Resolution Playbook:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {selectedScenario.steps.map((step, idx) => (
              <div key={idx} className="command-row" style={{ background: 'var(--bg-card-solid)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--code-text)' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          <div className="callout callout-protip" style={{ marginTop: '1.25rem' }}>
            <Lightbulb size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-heading)' }}>Golden Rule for Production Safety</strong>
              <span>{selectedScenario.goldenRule}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
