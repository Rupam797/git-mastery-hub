import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, GitBranch, RefreshCw, ChevronRight, 
  Volume2, VolumeX, Maximize2, Minimize2, Copy, Check, 
  Monitor, Sparkles, Tv, Layout, Lightbulb, Play, BookOpen
} from 'lucide-react';

// ─── Branch color palette ────────────────────────────────
const BRANCH_COLORS = [
  '#4facfe', '#ff0080', '#00dfa2', '#ffb703', '#c084fc',
  '#f97316', '#06b6d4', '#ef4444', '#84cc16', '#e879f9'
];
function branchColor(branches, name) {
  const idx = branches.indexOf(name);
  return BRANCH_COLORS[idx % BRANCH_COLORS.length];
}

// ─── Helpers ─────────────────────────────────────────────
const randHash = () => Math.random().toString(16).substring(2, 9);
const shortHash = h => h?.substring(0, 7) || '';

// Web Audio API Synthesizer for Retro Terminal Sounds
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'key') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'enter') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Audio context not allowed without gesture or unsupported
  }
}

// ─── BEGINNER GUIDED TUTORIAL MISSIONS ────────────────────
const BEGINNER_STEPS = [
  { id: 1, cmd: 'touch app.js', title: '1. Create a file', desc: 'Create a new file in your Working Tree folder (shows in RED in Working Tree).' },
  { id: 2, cmd: 'git status', title: '2. Check Git Status', desc: 'Inspect what files are modified/untracked before staging.' },
  { id: 3, cmd: 'git add .', title: '3. Stage changes', desc: 'Move files from Working Tree into Staging Area (shows in GREEN).' },
  { id: 4, cmd: 'git commit -m "feat: add app.js"', title: '4. Commit snapshot', desc: 'Save staged changes as a permanent commit in the tree graph.' },
  { id: 5, cmd: 'git branch feature/auth', title: '5. Create a branch', desc: 'Create a new parallel development timeline pointer.' },
  { id: 6, cmd: 'git switch feature/auth', title: '6. Switch branch', desc: 'Move your working focus to your new branch.' },
  { id: 7, cmd: 'git log --oneline', title: '7. View Commit Tree', desc: 'See your commit graph history timeline.' },
];

// ─── INITIAL VIRTUAL FILESYSTEM ──────────────────────────
const INITIAL_VIRTUAL_FILES = {
  'README.md': '# Git Mastery Hub Repository\n\nWelcome to your full real terminal simulator.\nTry commands: git status, git log, ls -la, nano README.md',
  'package.json': '{\n  "name": "git-mastery-app",\n  "version": "2.5.0",\n  "private": true\n}',
  'index.js': '// Entry point\nconsole.log("Git Mastery Engine Active");',
  'src/App.js': '// React App main module\nexport default function App() { return <h1>Git Terminal Active</h1>; }',
};

// ─── INITIAL STATE FACTORY ───────────────────────────────
function makeInitial() {
  return {
    commits: [
      { hash: 'a1b2c3d', msg: 'Initial commit',           branch: 'main', parents: [] },
      { hash: 'e4f5a6b', msg: 'Add README.md & package.json', branch: 'main', parents: ['a1b2c3d'] },
      { hash: 'f9c8d7e', msg: 'feat: setup project structure', branch: 'main', parents: ['e4f5a6b'] },
    ],
    branches: { main: 'f9c8d7e' },
    currentBranch: 'main',
    HEAD: 'f9c8d7e',
    detached: false,
    workingDir: [],        // file names with unstaged modifications
    stagingArea: [],       // file names staged
    stashStack: [],        // { id, msg, branch }
    tags: {},              // tag -> hash
    remotes: { main: 'f9c8d7e' },   // remote branch -> hash
    commandHistory: [],    // for up arrow
    config: { 'user.name': 'Git Mastery Student', 'user.email': 'student@gitmastery.dev' },
  };
}

// ─── COMMAND AUTOCOMPLETE DICTIONARY ─────────────────────
const AUTOCOMPLETE_COMMANDS = [
  'git init', 'git status', 'git add .', 'git add', 'git commit -m ""', 'git commit',
  'git log', 'git log --oneline', 'git log --graph', 'git diff', 'git diff --staged',
  'git branch', 'git branch -d', 'git branch -m', 'git switch', 'git switch -c',
  'git checkout', 'git checkout -b', 'git merge', 'git rebase', 'git stash',
  'git stash pop', 'git stash list', 'git stash drop', 'git reset --soft HEAD~1',
  'git reset --mixed HEAD~1', 'git reset --hard HEAD~1', 'git revert', 'git cherry-pick',
  'git tag', 'git remote -v', 'git push', 'git pull', 'git fetch', 'git reflog',
  'git show', 'git config --list', 'ls', 'ls -la', 'ls -l', 'pwd', 'cd', 'mkdir',
  'touch', 'rm', 'cat', 'echo', 'nano', 'history', 'whoami', 'date', 'uptime',
  'which git', 'clear', 'help'
];

// ─── HELP TEXT ───────────────────────────────────────────
const HELP_TEXT = `
  Git Mastery Terminal v3.0 – Supported Command Reference:
  ─────────────────────────────────────────────────────────────
  [Git Fundamentals]
    git init                    Initialize repository
    git status                  Show working tree status
    git add <file|.>            Stage changes
    git commit -m "<msg>"       Commit staged changes (supports --amend)
    git log [--oneline|--graph] Show commit history tree
    git diff [--staged]         Show unstaged / staged diffs
    git show <hash>             Show commit details

  [Branching & Merging]
    git branch [name]           List / create branch
    git branch -d <name>        Delete branch
    git branch -m <old> <new>   Rename branch
    git switch <branch>         Switch branch
    git switch -c <branch>      Create & switch branch
    git checkout <branch>       Legacy switch / detached HEAD
    git checkout -b <branch>    Legacy create & switch
    git merge <branch>          Merge branch into current
    git rebase <branch>         Rebase onto target branch

  [Stash, Undo & Advanced]
    git stash [push -m "msg"]   Stash working directory changes
    git stash pop / list / drop Stash stack management
    git reset [--soft|--mixed|--hard] HEAD~N  Undo commits
    git revert <hash>           Create inverse safety commit
    git cherry-pick <hash>      Apply single commit
    git tag <name> [hash]       Tag commit
    git reflog                  Show HEAD movement history

  [Remotes & Config]
    git remote -v               Show remote repository URLs
    git push / pull / fetch     Simulate remote synchronization
    git config --list           Show git configuration settings

  [Unix & Windows Shell Utilities]
    ls [-l|-la] / dir           List files with details & colors
    pwd                         Print current working directory
    cd <dir>                    Change directory (cd .. or cd ~)
    touch <file>                Create file in working directory
    cat <file>                  Print file contents
    echo "text" > <file>        Write text to file
    nano <file>                 Open interactive in-terminal text editor!
    rm <file>                   Remove file
    history                     Show command execution history
    whoami / date / uptime      System status commands
    clear / cls (or Ctrl+L)     Clear terminal screen
    help                        Show this guide
`.trim();

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function GitSimulator() {
  const [state, setState] = useState(makeInitial);
  const [virtualFiles, setVirtualFiles] = useState(INITIAL_VIRTUAL_FILES);
  const [currentDir, setCurrentDir] = useState('~/project');
  
  // Beginner Mode & Assistant Toggle
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Terminal Customizations
  const [windowStyle, setWindowStyle] = useState('mac'); // 'mac' | 'windows' | 'linux'
  const [termTheme, setTermTheme] = useState('dark'); // 'dark' | 'matrix' | 'retro' | 'dracula' | 'ubuntu' | 'macos'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(false);
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' | 'full-terminal'
  const [copiedToast, setCopiedToast] = useState(false);

  // Nano Editor State
  const [nanoState, setNanoState] = useState({ isOpen: false, fileName: '', content: '' });

  const [history, setHistory] = useState([
    { type: 'banner', text: '┌─────────────────────────────────────────────────────────────────────────────┐' },
    { type: 'banner', text: '│  Git Mastery Hub — Interactive Real Terminal Simulator v3.0                 │' },
    { type: 'banner', text: '│  🌱 BEGINNER ASSISTANT IS ON! Try the 1-click step-by-step missions below.  │' },
    { type: 'banner', text: '│  Shortcuts: TAB (Complete), Ctrl+L (Clear), Ctrl+C (Interrupt), Up/Down    │' },
    { type: 'banner', text: '└─────────────────────────────────────────────────────────────────────────────┘' },
    { type: 'system', text: 'Workspace initialized clean on branch main. Type any git or shell command!' }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [reflog, setReflog] = useState([
    { action: 'commit (initial)', hash: 'a1b2c3d', msg: 'HEAD -> main' },
    { action: 'commit', hash: 'e4f5a6b', msg: 'HEAD -> main' },
    { action: 'commit', hash: 'f9c8d7e', msg: 'HEAD -> main' },
  ]);

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on output update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Output helpers
  const out = (...lines) => {
    setHistory(p => [...p, ...lines.map(l => (typeof l === 'string' ? { type: 'out', text: l } : l))]);
  };
  const err = (text) => {
    if (soundEnabled) playSound('error');
    setHistory(p => [...p, { type: 'error', text: `✖ ${text}` }]);
  };
  const sys = (text) => {
    setHistory(p => [...p, { type: 'system', text: `ℹ ${text}` }]);
  };
  const explain = (text) => {
    if (beginnerMode) {
      setHistory(p => [...p, { type: 'banner', text: `💡 EXPLANATION: ${text}` }]);
    }
  };

  // Ghost text suggestion calculator
  const ghostSuggestion = (() => {
    if (!inputVal.trim()) return '';
    const match = AUTOCOMPLETE_COMMANDS.find(c => c.startsWith(inputVal) && c !== inputVal);
    if (match) return match.slice(inputVal.length);
    return '';
  })();

  // ─── COMMAND PROCESSOR ────────────────────────────────
  const processCommand = (raw) => {
    const cmdStr = raw.trim();
    if (!cmdStr) return;

    if (soundEnabled) playSound('enter');

    // Build PS1 prompt text for history display based on windowStyle
    const dirtySymbol = (state.workingDir.length > 0 || state.stagingArea.length > 0) ? ' ⚡' : '';
    const branchLabel = state.detached ? `(${shortHash(state.HEAD)})` : `(${state.currentBranch}${dirtySymbol})`;
    
    let promptPrefix = '';
    if (windowStyle === 'windows') {
      promptPrefix = `PS C:\\Users\\developer\\project${currentDir.replace('~', '').replace(/\//g, '\\')} ${branchLabel}>`;
    } else if (windowStyle === 'linux') {
      promptPrefix = `developer@ubuntu:${currentDir} ${branchLabel}$`;
    } else {
      promptPrefix = `user@git-mastery:${currentDir} ${branchLabel} $`;
    }

    setHistory(p => [...p, { type: 'cmd', text: `${promptPrefix} ${cmdStr}` }]);
    setState(prev => ({ ...prev, commandHistory: [...prev.commandHistory, cmdStr] }));
    setHistoryIdx(-1);

    // Auto-advance beginner step if matching step command
    if (BEGINNER_STEPS[currentStepIdx] && cmdStr.startsWith(BEGINNER_STEPS[currentStepIdx].cmd.split(' ')[0])) {
      if (currentStepIdx < BEGINNER_STEPS.length - 1) {
        setCurrentStepIdx(currentStepIdx + 1);
      }
    }

    // 1. Terminal Utilities
    if (cmdStr === 'clear' || cmdStr === 'cls') { setHistory([]); return; }
    if (cmdStr === 'help') { out(HELP_TEXT); return; }
    if (cmdStr === 'whoami') { out(windowStyle === 'windows' ? 'DESKTOP-DEV\\developer' : 'developer@git-mastery'); return; }
    if (cmdStr === 'date') { out(new Date().toUTCString()); return; }
    if (cmdStr === 'uptime') { out(` 03:52:28 up 12 days, 4:20, 1 user, load average: 0.08, 0.05, 0.01`); return; }
    if (cmdStr === 'which git' || cmdStr === 'where git') { out(windowStyle === 'windows' ? 'C:\\Program Files\\Git\\cmd\\git.exe' : '/usr/bin/git'); return; }
    if (cmdStr === 'pwd') { out(windowStyle === 'windows' ? `C:\\Users\\developer\\project${currentDir.replace('~', '').replace(/\//g, '\\')}` : `/home/developer/project${currentDir.replace('~', '')}`); return; }

    if (cmdStr === 'history') {
      state.commandHistory.forEach((c, idx) => out(`  ${(idx + 1).toString().padStart(4, ' ')}  ${c}`));
      return;
    }

    // 2. Directory Navigation (cd)
    if (cmdStr.startsWith('cd')) {
      const target = cmdStr.slice(2).trim();
      if (!target || target === '~' || target === '~/project' || target === '\\') {
        setCurrentDir('~/project');
        return;
      }
      if (target === '..' || target === '../') {
        setCurrentDir('~');
        return;
      }
      if (target === 'src' || target === './src' || target === 'src\\') {
        setCurrentDir('~/project/src');
        return;
      }
      err(`cd: no such file or directory: ${target}`);
      return;
    }

    // 3. Directory Listing (ls / dir)
    if (cmdStr === 'ls' || cmdStr.startsWith('ls ') || cmdStr === 'dir' || cmdStr.startsWith('dir ')) {
      const isLong = cmdStr.includes('-l') || cmdStr.startsWith('dir');
      const allFiles = Object.keys(virtualFiles);
      
      if (isLong) {
        if (windowStyle === 'windows') {
          out('    Directory: C:\\Users\\developer\\project');
          out('');
          out('Mode                 LastWriteTime         Length Name');
          out('----                 -------------         ------ ----');
          out('d-----         8/29/2026   3:50 AM                src');
          out('d-----         8/29/2026   3:52 AM                .git');
          allFiles.forEach(f => {
            const size = (virtualFiles[f]?.length || 100).toString().padStart(12, ' ');
            out(`-a----         8/29/2026   3:52 AM   ${size} ${f}`);
          });
        } else {
          out('total 32');
          out('drwxr-xr-x 2 user dev 4096 Aug 29 03:50 .');
          out('drwxr-xr-x 4 user dev 4096 Aug 29 03:50 ..');
          out('drwxr-xr-x 8 user dev 4096 Aug 29 03:52 .git');
          allFiles.forEach(f => {
            const isStaged = state.stagingArea.includes(f);
            const isModified = state.workingDir.includes(f);
            const statusTag = isStaged ? ' [staged]' : isModified ? ' [modified]' : '';
            const size = (virtualFiles[f]?.length || 100).toString().padStart(5, ' ');
            out(`-rw-r--r-- 1 user dev ${size} Aug 29 03:52 ${f}${statusTag}`);
          });
        }
      } else {
        const fileNames = ['src/', ...allFiles].join('   ');
        out(fileNames);
      }
      return;
    }

    // 4. File Reading (cat)
    if (cmdStr.startsWith('cat ')) {
      const fname = cmdStr.slice(4).trim();
      if (virtualFiles[fname] !== undefined) {
        out(virtualFiles[fname]);
      } else {
        err(`cat: ${fname}: No such file or directory`);
      }
      return;
    }

    // 5. Interactive Nano Text Editor
    if (cmdStr.startsWith('nano ')) {
      const fname = cmdStr.slice(5).trim();
      if (!fname) { err('usage: nano <filename>'); return; }
      setNanoState({
        isOpen: true,
        fileName: fname,
        content: virtualFiles[fname] || `# File: ${fname}\n// Type content here...`
      });
      return;
    }

    // 6. Echo write / append to file
    if (cmdStr.startsWith('echo ')) {
      const match = cmdStr.match(/^echo\s+["']?(.*?)["']?\s*(>>|>)\s*(.+)$/);
      if (match) {
        const text = match[1];
        const mode = match[2]; // '>' or '>>'
        const fname = match[3].trim();

        setVirtualFiles(prev => {
          const oldContent = prev[fname] || '';
          const newContent = mode === '>>' ? `${oldContent}\n${text}` : text;
          return { ...prev, [fname]: newContent };
        });

        setState(prev => {
          if (!prev.workingDir.includes(fname) && !prev.stagingArea.includes(fname)) {
            out(`Wrote to '${fname}' (modified in working directory).`);
            explain(`File '${fname}' modified in Working Directory (red). Run 'git add .' to stage it!`);
            return { ...prev, workingDir: [...prev.workingDir, fname] };
          }
          out(`Updated '${fname}'.`);
          return prev;
        });
        return;
      }
      out(cmdStr.slice(5).replace(/^["']|["']$/g, ''));
      return;
    }

    // 7. Touch file
    if (cmdStr.startsWith('touch ')) {
      const fname = cmdStr.slice(6).trim();
      if (!fname) { err('usage: touch <filename>'); return; }
      setVirtualFiles(prev => ({ ...prev, [fname]: prev[fname] || `// ${fname}` }));
      setState(prev => {
        if (prev.workingDir.includes(fname)) { err(`File '${fname}' already exists in working tree.`); return prev; }
        sys(`Created file '${fname}' in working directory.`);
        explain(`New file '${fname}' created in Working Directory (shown in RED). Run 'git status' or 'git add .' next!`);
        return { ...prev, workingDir: [...prev.workingDir, fname] };
      });
      return;
    }

    // 8. Remove file (rm)
    if (cmdStr.startsWith('rm ')) {
      const fname = cmdStr.slice(3).trim();
      setState(prev => {
        const exists = prev.workingDir.includes(fname) || prev.stagingArea.includes(fname) || virtualFiles[fname] !== undefined;
        if (!exists) { err(`rm: cannot remove '${fname}': No such file or directory`); return prev; }
        
        setVirtualFiles(vf => {
          const next = { ...vf }; delete next[fname]; return next;
        });
        out(`Removed file '${fname}'.`);
        return {
          ...prev,
          workingDir: prev.workingDir.filter(f => f !== fname),
          stagingArea: prev.stagingArea.filter(f => f !== fname)
        };
      });
      return;
    }

    // 9. Git Commands Verification
    if (!cmdStr.startsWith('git')) {
      err(`Command not found: '${cmdStr}'. Type "help" for available commands.`);
      return;
    }

    const parts = cmdStr.split(/\s+/);
    const action = parts[1];

    // ─── GIT CONFIG ───
    if (action === 'config') {
      if (cmdStr.includes('--list')) {
        out(`user.name=${state.config['user.name']}`);
        out(`user.email=${state.config['user.email']}`);
        return;
      }
      if (parts[2] === 'user.name' && parts[3]) {
        const val = parts.slice(3).join(' ').replace(/["']/g, '');
        setState(p => ({ ...p, config: { ...p.config, 'user.name': val } }));
        sys(`Updated user.name to "${val}"`);
        return;
      }
      if (parts[2] === 'user.email' && parts[3]) {
        const val = parts[3].replace(/["']/g, '');
        setState(p => ({ ...p, config: { ...p.config, 'user.email': val } }));
        sys(`Updated user.email to "${val}"`);
        return;
      }
      out(`user.name=${state.config['user.name']}`);
      out(`user.email=${state.config['user.email']}`);
      return;
    }

    // ─── GIT INIT ───
    if (action === 'init') {
      sys('Reinitialized existing Git repository in /home/developer/project/.git/');
      explain('Git repository is already initialized with a .git tracking directory.');
      return;
    }

    // ─── GIT STATUS ───
    if (action === 'status') {
      setState(prev => {
        out(`On branch ${prev.currentBranch}`);
        out(`Your branch is up to date with 'origin/${prev.currentBranch}'.`);
        out('');
        if (prev.stagingArea.length > 0) {
          out('Changes to be committed:');
          out('  (use "git restore --staged <file>..." to unstage)');
          prev.stagingArea.forEach(f => out(`\x1b[32m\tnew file:   ${f}\x1b[0m`));
          out('');
        }
        if (prev.workingDir.length > 0) {
          out('Untracked / modified files:');
          out('  (use "git add <file>..." to include in what will be committed)');
          prev.workingDir.forEach(f => out(`\x1b[31m\tmodified:   ${f}\x1b[0m`));
          out('');
        }
        if (!prev.stagingArea.length && !prev.workingDir.length) {
          out('nothing to commit, working tree clean');
        }
        explain('Git status lists modified files in RED (unstaged) vs GREEN (staged, ready to commit).');
        return prev;
      });
      return;
    }

    // ─── GIT ADD ───
    if (action === 'add') {
      const target = parts[2];
      if (!target) { err('Nothing specified, nothing added. Use "git add <file>" or "git add ."'); return; }
      setState(prev => {
        if (target === '.' || target === '-A') {
          if (prev.workingDir.length === 0) { sys('Nothing to add.'); return prev; }
          sys(`Added ${prev.workingDir.length} file(s) to index staging area.`);
          explain("Git moved files from Working Tree into the Staging Index (shown in GREEN on the right). Run 'git commit -m \"msg\"' next!");
          return { ...prev, stagingArea: [...new Set([...prev.stagingArea, ...prev.workingDir])], workingDir: [] };
        }
        if (!prev.workingDir.includes(target) && virtualFiles[target] === undefined) {
          err(`pathspec '${target}' did not match any files`);
          return prev;
        }
        sys(`Staged '${target}'.`);
        explain(`File '${target}' staged. Staged files will be saved in your next commit!`);
        return { ...prev, stagingArea: [...prev.stagingArea, target], workingDir: prev.workingDir.filter(f => f !== target) };
      });
      return;
    }

    // ─── GIT DIFF ───
    if (action === 'diff') {
      setState(prev => {
        const isStaged = parts[2] === '--staged' || parts[2] === '--cached';
        const list = isStaged ? prev.stagingArea : prev.workingDir;
        if (list.length === 0) {
          sys(isStaged ? 'No staged changes.' : 'No unstaged changes.');
          return prev;
        }
        list.forEach(f => {
          out(`diff --git a/${f} b/${f}`);
          out(`index a1b2c3d..e4f5a6b 100644`);
          out(`--- a/${f}`);
          out(`+++ b/${f}`);
          out(`@@ -1,4 +1,6 @@`);
          out(`+ // New content additions in ${f}`);
          out(`+ console.log("Updated ${f}");`);
        });
        explain('Git diff shows line-by-line changes between your modified files and the saved baseline commit.');
        return prev;
      });
      return;
    }

    // ─── GIT COMMIT ───
    if (action === 'commit') {
      const isAmend = cmdStr.includes('--amend');
      const msgMatch = cmdStr.match(/-m\s+["'](.+?)["']/);
      const msgMatch2 = cmdStr.match(/-m\s+([^\s"']+)/);

      setState(prev => {
        if (!isAmend && prev.stagingArea.length === 0) {
          err('nothing to commit (create or stage files first with "git add .")');
          return prev;
        }

        if (isAmend) {
          const lastCommit = prev.commits[prev.commits.length - 1];
          const newMsg = msgMatch ? msgMatch[1] : msgMatch2 ? msgMatch2[1] : lastCommit.msg;
          const amended = prev.commits.map((c, i) => i === prev.commits.length - 1 ? { ...c, msg: newMsg } : c);
          out(`[${prev.currentBranch} ${shortHash(lastCommit.hash)}] ${newMsg} (amended)`);
          explain('Git amended (replaced) the last commit with your updated staged changes!');
          setReflog(r => [...r, { action: 'commit (amend)', hash: lastCommit.hash, msg: `HEAD -> ${prev.currentBranch}` }]);
          return { ...prev, commits: amended, stagingArea: [] };
        }

        const msg = msgMatch ? msgMatch[1] : msgMatch2 ? msgMatch2[1] : 'WIP commit';
        const hash = randHash();
        const newCommit = { hash, msg, branch: prev.currentBranch, parents: [prev.HEAD] };
        out(`[${prev.currentBranch} ${shortHash(hash)}] ${msg}`);
        out(` ${prev.stagingArea.length || 1} file(s) changed, 12 insertions(+)`);
        explain('CONGRATS! Git saved a permanent commit snapshot node in the visualizer graph on the right!');
        setReflog(r => [...r, { action: 'commit', hash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return {
          ...prev,
          commits: [...prev.commits, newCommit],
          HEAD: hash,
          branches: { ...prev.branches, [prev.currentBranch]: hash },
          stagingArea: [],
        };
      });
      return;
    }

    // ─── GIT LOG ───
    if (action === 'log') {
      const oneline = parts.includes('--oneline');
      const graph = parts.includes('--graph');

      setState(prev => {
        const branchCommits = getBranchCommits(prev, prev.currentBranch);
        const lines = [];

        branchCommits.slice().reverse().forEach((c) => {
          const refs = [];
          Object.entries(prev.branches).forEach(([b, h]) => { if (h === c.hash) refs.push(b); });
          Object.entries(prev.tags).forEach(([t, h]) => { if (h === c.hash) refs.push(`tag: ${t}`); });
          if (c.hash === prev.HEAD) refs.unshift('HEAD');
          const refStr = refs.length ? ` (${refs.join(', ')})` : '';

          if (oneline) {
            const prefix = graph ? '* ' : '';
            lines.push(`${prefix}${shortHash(c.hash)}${refStr} ${c.msg}`);
          } else {
            if (graph) lines.push('*');
            lines.push(`commit ${c.hash}${refStr}`);
            lines.push(`Author: ${prev.config['user.name']} <${prev.config['user.email']}>`);
            lines.push(`Date:   ${new Date().toDateString()}`);
            lines.push('');
            lines.push(`    ${c.msg}`);
            lines.push('');
          }
        });
        out(...lines);
        explain('Git log prints the history timeline of all commit snapshots created on this branch.');
        return prev;
      });
      return;
    }

    // ─── GIT SHOW ───
    if (action === 'show') {
      const target = parts[2] || state.HEAD;
      const targetCommit = state.commits.find(c => c.hash.startsWith(target)) || state.commits[state.commits.length - 1];
      out(`commit ${targetCommit.hash}`);
      out(`Author: ${state.config['user.name']} <${state.config['user.email']}>`);
      out(`Date:   ${new Date().toDateString()}`);
      out('');
      out(`    ${targetCommit.msg}`);
      out('');
      out(`diff --git a/src/index.js b/src/index.js`);
      out(`+ // Changes in commit ${shortHash(targetCommit.hash)}`);
      explain(`Git show inspects detailed file diffs inside commit ${shortHash(targetCommit.hash)}.`);
      return;
    }

    // ─── GIT BRANCH ───
    if (action === 'branch') {
      if (parts[2] === '-d' || parts[2] === '-D') {
        const bname = parts[3];
        setState(prev => {
          if (!prev.branches[bname]) { err(`error: branch '${bname}' not found.`); return prev; }
          if (bname === prev.currentBranch) { err(`error: Cannot delete branch '${bname}' which you are currently on.`); return prev; }
          sys(`Deleted branch ${bname} (was ${shortHash(prev.branches[bname])}).`);
          const nb = { ...prev.branches }; delete nb[bname];
          return { ...prev, branches: nb };
        });
        return;
      }
      if (parts[2] === '-m') {
        const oldName = parts[3], newName = parts[4];
        setState(prev => {
          if (!prev.branches[oldName]) { err(`error: branch '${oldName}' not found.`); return prev; }
          const nb = { ...prev.branches }; nb[newName] = nb[oldName]; delete nb[oldName];
          sys(`Branch '${oldName}' renamed to '${newName}'.`);
          return { ...prev, branches: nb, currentBranch: prev.currentBranch === oldName ? newName : prev.currentBranch };
        });
        return;
      }
      if (!parts[2]) {
        setState(prev => {
          const lines = Object.keys(prev.branches).sort().map(b => b === prev.currentBranch ? `* \x1b[32m${b}\x1b[0m` : `  ${b}`);
          out(...lines);
          explain('Branch list shows all available timeline pointers. Asterisk * indicates your active branch.');
          return prev;
        });
        return;
      }
      const bname = parts[2];
      setState(prev => {
        if (prev.branches[bname]) { err(`fatal: A branch named '${bname}' already exists.`); return prev; }
        sys(`Created branch '${bname}' at ${shortHash(prev.HEAD)}.`);
        explain(`Created a new branch '${bname}'. Run "git switch ${bname}" to switch to it!`);
        return { ...prev, branches: { ...prev.branches, [bname]: prev.HEAD } };
      });
      return;
    }

    // ─── GIT SWITCH / CHECKOUT ───
    if (action === 'switch' || action === 'checkout') {
      const createFlag = (action === 'switch' && parts[2] === '-c') || (action === 'checkout' && parts[2] === '-b');
      const target = createFlag ? parts[3] : parts[2];
      if (!target) { err(`error: no branch or target specified`); return; }
      setState(prev => {
        if (prev.workingDir.length > 0 || prev.stagingArea.length > 0) {
          err(`error: Your local changes to working tree files would be overwritten. Please commit or stash.`);
          return prev;
        }
        if (createFlag) {
          if (prev.branches[target]) { err(`fatal: A branch named '${target}' already exists.`); return prev; }
          sys(`Switched to a new branch '${target}'`);
          explain(`Created & switched HEAD pointer to '${target}'. New commits will now build on this branch!`);
          setReflog(r => [...r, { action: `checkout: moving from ${prev.currentBranch} to ${target}`, hash: prev.HEAD, msg: `HEAD -> ${target}` }]);
          return { ...prev, branches: { ...prev.branches, [target]: prev.HEAD }, currentBranch: target, detached: false };
        }
        if (!prev.branches[target]) {
          const commitMatch = prev.commits.find(c => c.hash.startsWith(target));
          if (commitMatch) {
            sys(`Note: switching to '${target}'. You are in 'detached HEAD' state.`);
            setReflog(r => [...r, { action: `checkout: moving to ${shortHash(commitMatch.hash)}`, hash: commitMatch.hash, msg: `HEAD detached at ${shortHash(commitMatch.hash)}` }]);
            return { ...prev, HEAD: commitMatch.hash, detached: true };
          }
          err(`error: pathspec '${target}' did not match any branch or commit.`);
          return prev;
        }
        sys(`Switched to branch '${target}'`);
        explain(`Moved HEAD to branch '${target}'.`);
        setReflog(r => [...r, { action: `checkout: moving from ${prev.currentBranch} to ${target}`, hash: prev.branches[target], msg: `HEAD -> ${target}` }]);
        return { ...prev, currentBranch: target, HEAD: prev.branches[target], detached: false };
      });
      return;
    }

    // ─── GIT MERGE ───
    if (action === 'merge') {
      const target = parts[2];
      if (!target) { err('usage: git merge <branch>'); return; }
      setState(prev => {
        if (!prev.branches[target]) { err(`merge: '${target}' - not something we can merge`); return prev; }
        if (prev.branches[target] === prev.HEAD) { sys('Already up to date.'); return prev; }
        
        const targetHash = prev.branches[target];
        const currentChain = getBranchCommitHashes(prev, prev.currentBranch);
        if (currentChain.includes(targetHash)) { sys('Already up to date.'); return prev; }
        
        const targetChain = getBranchCommitHashes(prev, target);
        if (targetChain.includes(prev.HEAD)) {
          sys(`Updating ${shortHash(prev.HEAD)}..${shortHash(targetHash)}`);
          out('Fast-forward');
          explain(`Fast-forward merge: moved ${prev.currentBranch} forward directly to target branch commit ${shortHash(targetHash)}!`);
          setReflog(r => [...r, { action: `merge ${target}: Fast-forward`, hash: targetHash, msg: `HEAD -> ${prev.currentBranch}` }]);
          return { ...prev, HEAD: targetHash, branches: { ...prev.branches, [prev.currentBranch]: targetHash } };
        }
        
        const mergeHash = randHash();
        const mergeCommit = { hash: mergeHash, msg: `Merge branch '${target}' into ${prev.currentBranch}`, branch: prev.currentBranch, parents: [prev.HEAD, targetHash] };
        sys(`Merge made by the 'ort' strategy.`);
        out(`  merge commit: ${shortHash(mergeHash)}`);
        explain(`Created a 3-way merge commit combining changes from branch '${target}' into '${prev.currentBranch}'!`);
        setReflog(r => [...r, { action: `merge ${target}`, hash: mergeHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, mergeCommit], HEAD: mergeHash, branches: { ...prev.branches, [prev.currentBranch]: mergeHash } };
      });
      return;
    }

    // ─── GIT REBASE ───
    if (action === 'rebase') {
      const target = parts[2];
      if (!target) { err('usage: git rebase <branch>'); return; }
      setState(prev => {
        if (!prev.branches[target]) { err(`fatal: invalid upstream '${target}'`); return prev; }
        const myCommits = prev.commits.filter(c => c.branch === prev.currentBranch && !getBranchCommitHashes(prev, target).includes(c.hash));
        if (myCommits.length === 0) { sys(`Current branch ${prev.currentBranch} is up to date.`); return prev; }
        
        const targetHash = prev.branches[target];
        const rebasedCommits = myCommits.map(c => ({ ...c, hash: randHash(), parents: [targetHash] }));
        const newAll = [...prev.commits.filter(c => !myCommits.map(m => m.hash).includes(c.hash)), ...rebasedCommits];
        const newHead = rebasedCommits[rebasedCommits.length - 1].hash;
        
        sys(`Successfully rebased and updated refs/heads/${prev.currentBranch}.`);
        explain(`Rebased your commits linearly on top of branch '${target}' for a clean history graph!`);
        setReflog(r => [...r, { action: `rebase (finish): ${target}`, hash: newHead, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: newAll, HEAD: newHead, branches: { ...prev.branches, [prev.currentBranch]: newHead } };
      });
      return;
    }

    // ─── GIT STASH ───
    if (action === 'stash') {
      const sub = parts[2];
      if (!sub || sub === 'push') {
        const msgMatch2 = cmdStr.match(/-m\s+["'](.+?)["']/);
        setState(prev => {
          if (prev.workingDir.length === 0 && prev.stagingArea.length === 0) { err('No local changes to save'); return prev; }
          const msg = msgMatch2 ? msgMatch2[1] : `WIP on ${prev.currentBranch}`;
          const stashEntry = { id: prev.stashStack.length, msg, branch: prev.currentBranch, files: [...prev.workingDir, ...prev.stagingArea] };
          sys(`Saved working directory and index state "${msg}"`);
          explain('Stashed unsaved changes into temporary clipboard memory. Working Tree is clean!');
          return { ...prev, stashStack: [stashEntry, ...prev.stashStack], workingDir: [], stagingArea: [] };
        });
        return;
      }
      if (sub === 'pop') {
        setState(prev => {
          if (prev.stashStack.length === 0) { err('No stash entries found.'); return prev; }
          const [top, ...rest] = prev.stashStack;
          sys(`Dropped refs/stash@{0} – restored ${top.files.length} file(s) to working directory.`);
          explain('Restored your latest stashed changes back into the Working Tree!');
          return { ...prev, stashStack: rest, workingDir: [...prev.workingDir, ...top.files] };
        });
        return;
      }
      if (sub === 'list') {
        setState(prev => {
          if (prev.stashStack.length === 0) { out('No stash entries.'); return prev; }
          prev.stashStack.forEach((s, i) => out(`stash@{${i}}: ${s.msg} (${s.files.length} files)`));
          return prev;
        });
        return;
      }
      if (sub === 'drop') {
        setState(prev => {
          if (prev.stashStack.length === 0) { err('No stash entries found.'); return prev; }
          sys(`Dropped refs/stash@{0} (${prev.stashStack[0].msg})`);
          return { ...prev, stashStack: prev.stashStack.slice(1) };
        });
        return;
      }
      err(`Unknown stash subcommand: ${sub}`);
      return;
    }

    // ─── GIT RESET ───
    if (action === 'reset') {
      const mode = parts.find(p => p.startsWith('--'));
      const resetMode = mode === '--hard' ? 'hard' : mode === '--soft' ? 'soft' : 'mixed';
      const refMatch = cmdStr.match(/HEAD~(\d+)/);
      const n = refMatch ? parseInt(refMatch[1]) : 1;

      setState(prev => {
        const chain = getBranchCommits(prev, prev.currentBranch);
        if (n >= chain.length) { err(`fatal: cannot go back ${n} commits on this branch.`); return prev; }
        const targetCommit = chain[chain.length - 1 - n];
        const removedCommits = chain.slice(chain.length - n);
        const keptCommits = prev.commits.filter(c => !removedCommits.map(rc => rc.hash).includes(c.hash));
        
        let newWorking = prev.workingDir;
        let newStaging = prev.stagingArea;
        if (resetMode === 'soft') {
          newStaging = [...prev.stagingArea, ...removedCommits.map(c => `changes-from-${shortHash(c.hash)}`)];
        } else if (resetMode === 'mixed') {
          newWorking = [...prev.workingDir, ...removedCommits.map(c => `changes-from-${shortHash(c.hash)}`)];
          newStaging = [];
        } else {
          newWorking = [];
          newStaging = [];
        }

        sys(`HEAD is now at ${shortHash(targetCommit.hash)} ${targetCommit.msg}`);
        explain(`Reset branch back ${n} commit(s). Mode: --${resetMode}`);
        setReflog(r => [...r, { action: `reset: moving to HEAD~${n} (--${resetMode})`, hash: targetCommit.hash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: keptCommits, HEAD: targetCommit.hash, branches: { ...prev.branches, [prev.currentBranch]: targetCommit.hash }, workingDir: newWorking, stagingArea: newStaging };
      });
      return;
    }

    // ─── GIT REVERT ───
    if (action === 'revert') {
      const target = parts[2];
      if (!target) { err('usage: git revert <commit-hash>'); return; }
      setState(prev => {
        const targetCommit = prev.commits.find(c => c.hash.startsWith(target));
        if (!targetCommit) { err(`fatal: bad revision '${target}'`); return prev; }
        const revertHash = randHash();
        const revertCommit = { hash: revertHash, msg: `Revert "${targetCommit.msg}"`, branch: prev.currentBranch, parents: [prev.HEAD] };
        sys(`[${prev.currentBranch} ${shortHash(revertHash)}] Revert "${targetCommit.msg}"`);
        explain(`Safely undone commit ${shortHash(target)} by appending an inverse revert commit!`);
        setReflog(r => [...r, { action: `revert: ${shortHash(target)}`, hash: revertHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, revertCommit], HEAD: revertHash, branches: { ...prev.branches, [prev.currentBranch]: revertHash } };
      });
      return;
    }

    // ─── GIT CHERRY-PICK ───
    if (action === 'cherry-pick') {
      const target = parts[2];
      if (!target) { err('usage: git cherry-pick <commit-hash>'); return; }
      setState(prev => {
        const targetCommit = prev.commits.find(c => c.hash.startsWith(target));
        if (!targetCommit) { err(`fatal: bad object '${target}'`); return prev; }
        const newHash = randHash();
        const cpCommit = { hash: newHash, msg: targetCommit.msg, branch: prev.currentBranch, parents: [prev.HEAD] };
        sys(`[${prev.currentBranch} ${shortHash(newHash)}] ${targetCommit.msg}`);
        explain(`Applied commit ${shortHash(targetCommit.hash)} onto branch '${prev.currentBranch}'!`);
        setReflog(r => [...r, { action: `cherry-pick: ${shortHash(targetCommit.hash)}`, hash: newHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, cpCommit], HEAD: newHash, branches: { ...prev.branches, [prev.currentBranch]: newHash } };
      });
      return;
    }

    // ─── GIT TAG ───
    if (action === 'tag') {
      if (!parts[2]) {
        setState(prev => {
          const tags = Object.keys(prev.tags);
          if (tags.length === 0) { sys('No tags.'); return prev; }
          tags.forEach(t => out(`${t}  →  ${shortHash(prev.tags[t])}`));
          return prev;
        });
        return;
      }
      const tagName = parts[2];
      const tagTarget = parts[3];
      setState(prev => {
        if (prev.tags[tagName]) { err(`fatal: tag '${tagName}' already exists`); return prev; }
        const targetHash = tagTarget ? (prev.commits.find(c => c.hash.startsWith(tagTarget))?.hash || prev.HEAD) : prev.HEAD;
        sys(`Created tag '${tagName}' at ${shortHash(targetHash)}`);
        explain(`Created landmark tag '🏷 ${tagName}' pointing to commit ${shortHash(targetHash)}.`);
        return { ...prev, tags: { ...prev.tags, [tagName]: targetHash } };
      });
      return;
    }

    // ─── GIT REMOTE ───
    if (action === 'remote') {
      out('origin  https://github.com/user/repo.git (fetch)');
      out('origin  https://github.com/user/repo.git (push)');
      return;
    }

    // ─── GIT PUSH ───
    if (action === 'push') {
      setState(prev => {
        out('Enumerating objects: 5, done.');
        out('Counting objects: 100% (5/5), done.');
        out('Writing objects: 100% (3/3), 420 bytes | 420.00 KiB/s, done.');
        out('To https://github.com/user/repo.git');
        out(`   ${shortHash(prev.remotes[prev.currentBranch] || 'new')}..${shortHash(prev.HEAD)}  ${prev.currentBranch} -> ${prev.currentBranch}`);
        explain(`Synchronized your local commits to remote server repository (origin/${prev.currentBranch})!`);
        return { ...prev, remotes: { ...prev.remotes, [prev.currentBranch]: prev.HEAD } };
      });
      return;
    }

    // ─── GIT PULL / FETCH ───
    if (action === 'pull' || action === 'fetch') {
      out('From https://github.com/user/repo.git');
      out(` * branch            ${state.currentBranch}     -> FETCH_HEAD`);
      if (action === 'pull') sys('Already up to date.');
      return;
    }

    // ─── GIT REFLOG ───
    if (action === 'reflog') {
      reflog.slice().reverse().forEach((entry, i) => {
        out(`${shortHash(entry.hash)} HEAD@{${reflog.length - 1 - i}}: ${entry.action}: ${entry.msg}`);
      });
      explain('Git reflog records every single movement of your HEAD pointer, making accidental data loss impossible!');
      return;
    }

    err(`git: '${action}' is not recognized in this simulator. Type "help" for available commands.`);
  };

  // ─── HELPERS: Commit graph retrieval ─────────────────
  function getBranchCommits(st, branchName) {
    const headHash = st.branches[branchName];
    if (!headHash) return [];
    const result = [];
    const visited = new Set();
    const walk = (hash) => {
      if (!hash || visited.has(hash)) return;
      visited.add(hash);
      const commit = st.commits.find(c => c.hash === hash);
      if (!commit) return;
      result.unshift(commit);
      commit.parents.forEach(p => walk(p));
    };
    walk(headHash);
    return result;
  }

  function getBranchCommitHashes(st, branchName) {
    return getBranchCommits(st, branchName).map(c => c.hash);
  }

  // ─── KEY DOWN HANDLER (Tab, Ctrl+L, Ctrl+C, Arrows) ─────
  const handleKeyDown = (e) => {
    // Sound FX on keypress
    if (soundEnabled && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      playSound('key');
    }

    // Tab Autocompletion
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!inputVal.trim()) return;

      const matches = AUTOCOMPLETE_COMMANDS.filter(c => c.startsWith(inputVal));
      if (matches.length === 1) {
        setInputVal(matches[0]);
      } else if (matches.length > 1) {
        out(`Possible completion candidates:`);
        out(`  ${matches.join('    ')}`);
        let commonPrefix = inputVal;
        while (true) {
          const nextChar = matches[0][commonPrefix.length];
          if (!nextChar || !matches.every(m => m[commonPrefix.length] === nextChar)) break;
          commonPrefix += nextChar;
        }
        setInputVal(commonPrefix);
      }
      return;
    }

    // Right Arrow accepts ghost suggestion
    if (e.key === 'ArrowRight' && ghostSuggestion && inputRef.current?.selectionStart === inputVal.length) {
      e.preventDefault();
      setInputVal(prev => prev + ghostSuggestion);
      return;
    }

    // Ctrl + L (Clear screen)
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      setHistory([]);
      return;
    }

    // Ctrl + C (Interrupt prompt)
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      const dirtySymbol = (state.workingDir.length > 0 || state.stagingArea.length > 0) ? ' ⚡' : '';
      const branchLabel = state.detached ? `(${shortHash(state.HEAD)})` : `(${state.currentBranch}${dirtySymbol})`;
      
      let promptPrefix = '';
      if (windowStyle === 'windows') {
        promptPrefix = `PS C:\\Users\\developer\\project${currentDir.replace('~', '').replace(/\//g, '\\')} ${branchLabel}>`;
      } else if (windowStyle === 'linux') {
        promptPrefix = `developer@ubuntu:${currentDir} ${branchLabel}$`;
      } else {
        promptPrefix = `user@git-mastery:${currentDir} ${branchLabel} $`;
      }

      setHistory(p => [...p, { type: 'cmd', text: `${promptPrefix} ${inputVal}^C` }]);
      setInputVal('');
      return;
    }

    // Ctrl + U (Clear input line)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      setInputVal('');
      return;
    }

    // Arrow Up / Down (History Navigation)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmds = state.commandHistory;
      if (cmds.length === 0) return;
      const newIdx = historyIdx === -1 ? cmds.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInputVal(cmds[newIdx]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmds = state.commandHistory;
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= cmds.length) { setHistoryIdx(-1); setInputVal(''); return; }
      setHistoryIdx(newIdx);
      setInputVal(cmds[newIdx]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    processCommand(inputVal);
    setInputVal('');
  };

  const resetAll = () => {
    setState(makeInitial());
    setVirtualFiles(INITIAL_VIRTUAL_FILES);
    setCurrentStepIdx(0);
    setHistory([
      { type: 'banner', text: '┌─────────────────────────────────────────────────────────────────────────────┐' },
      { type: 'banner', text: '│  Git Mastery Hub — Interactive Real Terminal Simulator v3.0                 │' },
      { type: 'banner', text: '└─────────────────────────────────────────────────────────────────────────────┘' },
      { type: 'system', text: 'Workspace reset to initial baseline repository state.' }
    ]);
    setReflog([
      { action: 'commit (initial)', hash: 'a1b2c3d', msg: 'HEAD -> main' },
      { action: 'commit', hash: 'e4f5a6b', msg: 'HEAD -> main' },
      { action: 'commit', hash: 'f9c8d7e', msg: 'HEAD -> main' },
    ]);
    if (soundEnabled) playSound('enter');
  };

  // Copy Terminal Output
  const copyTerminalOutput = () => {
    const plainText = history.map(h => h.text).join('\n');
    navigator.clipboard.writeText(plainText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Save Nano Editor File
  const handleSaveNano = () => {
    const fname = nanoState.fileName;
    const content = nanoState.content;
    setVirtualFiles(prev => ({ ...prev, [fname]: content }));
    setState(prev => {
      if (!prev.workingDir.includes(fname) && !prev.stagingArea.includes(fname)) {
        return { ...prev, workingDir: [...prev.workingDir, fname] };
      }
      return prev;
    });
    sys(`[nano] Saved changes to file '${fname}'.`);
    setNanoState({ isOpen: false, fileName: '', content: '' });
  };

  // Run guided mission step directly
  const runStepCommand = (cmd) => {
    processCommand(cmd);
    if (inputRef.current) inputRef.current.focus();
  };

  // ─── COMPUTE VISUAL DATA ──────────────────────────────
  const allBranchNames = Object.keys(state.branches).sort();
  const commitBranchTips = {};
  Object.entries(state.branches).forEach(([b, h]) => {
    if (!commitBranchTips[h]) commitBranchTips[h] = [];
    commitBranchTips[h].push(b);
  });
  const commitTags = {};
  Object.entries(state.tags).forEach(([t, h]) => {
    if (!commitTags[h]) commitTags[h] = [];
    commitTags[h].push(t);
  });

  const dirtySymbol = (state.workingDir.length > 0 || state.stagingArea.length > 0) ? ' ⚡' : '';

  // Preset commands for quick action chips
  const PRESET_CHIPS = [
    'git status', 'git add .', 'git commit -m "feat: new component"',
    'git log --oneline', 'git branch feature/login', 'git switch feature/login',
    'touch src/Header.js', 'nano README.md', 'ls -la', 'git diff', 'clear'
  ];

  const currentStep = BEGINNER_STEPS[currentStepIdx] || BEGINNER_STEPS[0];

  // ═════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0' }}>

      {/* Nano Modal Editor */}
      {nanoState.isOpen && (
        <div className="nano-modal-backdrop">
          <div className="nano-editor-card">
            <div style={{ background: '#00f2fe', color: '#000', padding: '0.4rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <span>GNU nano 7.2 — File: {nanoState.fileName}</span>
              <span>^X Exit | ^O Save</span>
            </div>
            <textarea
              value={nanoState.content}
              onChange={e => setNanoState(prev => ({ ...prev, content: e.target.value }))}
              rows={12}
              style={{
                width: '100%', background: '#050914', color: '#00dfa2',
                fontFamily: 'var(--font-mono)', fontSize: '0.9rem', border: 'none',
                outline: 'none', padding: '1rem', resize: 'vertical'
              }}
              autoFocus
            />
            <div style={{ background: '#0c1525', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setNanoState({ isOpen: false, fileName: '', content: '' })}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              >
                Discard & Cancel
              </button>
              <button
                onClick={handleSaveNano}
                style={{ background: '#00f2fe', border: 'none', color: '#000', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              >
                Save File & Exit (^O)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar with Control Tools */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={22} color="var(--primary-cyan)" /> Authentic Git Practice Terminal & Live Visualiser
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Full interactive terminal simulator with 1-click beginner guided missions & live state graph.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Beginner Mode Toggle */}
          <button
            onClick={() => setBeginnerMode(!beginnerMode)}
            style={{ background: beginnerMode ? 'rgba(0, 223, 162, 0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${beginnerMode ? 'rgba(0, 223, 162, 0.4)' : 'var(--border-color)'}`, color: beginnerMode ? '#00dfa2' : 'var(--text-muted)', padding: '0.45rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700' }}
          >
            <BookOpen size={15} />
            Beginner Assistant: {beginnerMode ? 'ON' : 'OFF'}
          </button>

          {/* Window Frame Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.5rem' }}>
            <Layout size={14} color="var(--text-muted)" style={{ marginRight: '0.4rem' }} />
            <select
              value={windowStyle}
              onChange={e => setWindowStyle(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '0.45rem 0', outline: 'none', cursor: 'pointer' }}
            >
              <option value="mac" style={{ background: '#0b1329', color: '#fff' }}>Window: macOS Style 🍎</option>
              <option value="windows" style={{ background: '#0b1329', color: '#fff' }}>Window: Windows Terminal 🪟</option>
              <option value="linux" style={{ background: '#0b1329', color: '#fff' }}>Window: Ubuntu Linux 🐧</option>
            </select>
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Terminal Audio" : "Enable Terminal Audio"}
            style={{ background: soundEnabled ? 'rgba(0,242,254,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${soundEnabled ? 'rgba(0,242,254,0.3)' : 'var(--border-color)'}`, color: soundEnabled ? '#00f2fe' : 'var(--text-muted)', padding: '0.45rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            Sound: {soundEnabled ? 'ON' : 'OFF'}
          </button>

          {/* CRT Scanline FX Toggle */}
          <button
            onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
            title="Toggle CRT Scanline Effect"
            style={{ background: scanlinesEnabled ? 'rgba(0,255,102,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${scanlinesEnabled ? 'rgba(0,255,102,0.4)' : 'var(--border-color)'}`, color: scanlinesEnabled ? '#00ff66' : 'var(--text-muted)', padding: '0.45rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <Tv size={15} />
            CRT FX: {scanlinesEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Theme Selector */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.5rem' }}>
            <Monitor size={14} color="var(--text-muted)" style={{ marginRight: '0.4rem' }} />
            <select
              value={termTheme}
              onChange={e => setTermTheme(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '0.45rem 0', outline: 'none', cursor: 'pointer' }}
            >
              <option value="dark" style={{ background: '#0b1329', color: '#fff' }}>Theme: Dark Modern</option>
              <option value="matrix" style={{ background: '#041f0d', color: '#00ff66' }}>Theme: Matrix Green</option>
              <option value="retro" style={{ background: '#09200f', color: '#33ff33' }}>Theme: Retro Phosphor CRT</option>
              <option value="dracula" style={{ background: '#212234', color: '#bd93f9' }}>Theme: Dracula Cyber</option>
              <option value="ubuntu" style={{ background: '#300a24', color: '#ffb200' }}>Theme: Ubuntu Violet</option>
              <option value="macos" style={{ background: '#e2e8f0', color: '#000' }}>Theme: macOS Light</option>
            </select>
          </div>

          {/* Layout Mode Toggle */}
          <button
            onClick={() => setLayoutMode(prev => prev === 'split' ? 'full-terminal' : 'split')}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.45rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}
          >
            {layoutMode === 'split' ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
            {layoutMode === 'split' ? 'Full Terminal' : 'Split View'}
          </button>

          {/* Reset Button */}
          <button
            onClick={resetAll}
            style={{ background: 'rgba(255,75,75,0.12)', border: '1px solid rgba(255,75,75,0.3)', color: '#fca5a5', padding: '0.45rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* 🌟 BEGINNER INTERACTIVE GUIDED MISSION CARD 🌟 */}
      {beginnerMode && (
        <div style={{ background: 'rgba(0, 242, 254, 0.06)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-lg)', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lightbulb size={20} color="var(--primary-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Beginner Guided Mission ({currentStepIdx + 1}/{BEGINNER_STEPS.length}): {currentStep.title}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-heading)', fontWeight: '600' }}>
                {currentStep.desc}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#00dfa2', background: 'rgba(0, 223, 162, 0.12)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(0, 223, 162, 0.25)' }}>
              {currentStep.cmd}
            </span>
            <button
              onClick={() => runStepCommand(currentStep.cmd)}
              style={{ background: 'var(--primary-cyan)', border: 'none', color: '#000000', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Play size={14} fill="#000" /> Run Step
            </button>
          </div>
        </div>
      )}

      {/* Preset Quick Chips Bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.3rem' }}>
          <Sparkles size={13} color="var(--primary-cyan)" /> Presets:
        </span>
        {PRESET_CHIPS.map(chip => (
          <button
            key={chip}
            className="term-chip-btn"
            onClick={() => runStepCommand(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: layoutMode === 'split' ? '1fr 1fr' : '1fr',
        gap: '1rem',
        height: '72vh',
        minHeight: '540px'
      }}>

        {/* ═══ PRACTICE TERMINAL WINDOW ═══ */}
        <div
          className={`term-theme-${termTheme} ${scanlinesEnabled ? 'term-scanlines' : ''}`}
          style={{
            background: 'var(--term-bg)',
            border: '1px solid var(--term-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            transition: 'all 0.25s ease'
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* WINDOW TITLE BAR: MAC OS vs WINDOWS vs LINUX */}
          {windowStyle === 'mac' && (
            <div style={{ background: 'var(--term-header-bg)', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--term-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
              </div>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--term-text)', opacity: 0.85, fontWeight: '600' }}>
                bash — {currentDir} ({state.currentBranch}){state.detached ? ' [DETACHED]' : ''} — 80x24
              </span>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); copyTerminalOutput(); }}
                  title="Copy Terminal Output"
                  style={{ background: 'transparent', border: 'none', color: 'var(--term-text)', cursor: 'pointer', opacity: 0.7 }}
                >
                  {copiedToast ? <Check size={14} color="#00dfa2" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {windowStyle === 'windows' && (
            <div style={{ background: 'var(--term-header-bg)', padding: '0.35rem 0.5rem 0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--term-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="win-tab">
                  <span style={{ color: '#38bdf8', fontWeight: '800', fontSize: '0.7rem' }}>&gt;_</span>
                  <span>PowerShell — {state.currentBranch}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); copyTerminalOutput(); }}
                  title="Copy Terminal Output"
                  style={{ background: 'transparent', border: 'none', color: 'var(--term-text)', cursor: 'pointer', opacity: 0.7, marginRight: '0.5rem' }}
                >
                  {copiedToast ? <Check size={14} color="#00dfa2" /> : <Copy size={14} />}
                </button>
                <div className="win-control-btn">—</div>
                <div className="win-control-btn">☐</div>
                <div className="win-control-btn win-close">✕</div>
              </div>
            </div>
          )}

          {windowStyle === 'linux' && (
            <div style={{ background: '#300a24', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,178,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffb200' }}></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#ffffff', fontWeight: '700' }}>
                  developer@ubuntu: {currentDir}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); copyTerminalOutput(); }}
                  title="Copy Terminal Output"
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.7 }}
                >
                  {copiedToast ? <Check size={14} color="#00dfa2" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Terminal Transcript Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.65', color: 'var(--term-text)' }}>
            {history.map((line, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {line.type === 'banner' && <span style={{ color: 'var(--term-cmd)', fontWeight: '600' }}>{line.text}</span>}
                {line.type === 'cmd' && <span style={{ color: 'var(--term-cmd)', fontWeight: '700' }}>{line.text}</span>}
                {line.type === 'out' && <span style={{ color: 'var(--term-text)' }}>{line.text}</span>}
                {line.type === 'system' && <span style={{ color: 'var(--term-sys)' }}>{line.text}</span>}
                {line.type === 'error' && <span style={{ color: 'var(--term-error)' }}>{line.text}</span>}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Interactive Shell Prompt Line */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.65rem 1rem',
              background: 'var(--term-header-bg)',
              borderTop: '1px solid var(--term-border)',
              position: 'relative'
            }}
          >
            {/* Prompt String for Windows vs Mac vs Linux */}
            {windowStyle === 'windows' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                <span style={{ color: '#38bdf8' }}>PS</span>
                <span style={{ color: 'var(--term-prompt-path)' }}>C:\Users\developer\project{currentDir.replace('~', '').replace(/\//g, '\\')}</span>
                <span style={{ color: 'var(--term-prompt-branch)', marginLeft: '0.3rem' }}>
                  ({state.detached ? shortHash(state.HEAD) : state.currentBranch}{dirtySymbol})
                </span>
                <span style={{ color: 'var(--term-cmd)', marginLeft: '0.2rem' }}>&gt;</span>
              </div>
            ) : windowStyle === 'linux' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                <span style={{ color: '#4e9a06' }}>developer@ubuntu</span>
                <span style={{ color: 'var(--term-text)' }}>:</span>
                <span style={{ color: '#729fcf' }}>{currentDir}</span>
                <span style={{ color: '#ffb200', marginLeft: '0.3rem' }}>
                  ({state.detached ? shortHash(state.HEAD) : state.currentBranch}{dirtySymbol})
                </span>
                <span style={{ color: 'var(--term-cmd)' }}>$</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                <span style={{ color: 'var(--term-prompt-user)' }}>user@git-mastery</span>
                <span style={{ color: 'var(--term-text)', opacity: 0.5 }}>:</span>
                <span style={{ color: 'var(--term-prompt-path)' }}>{currentDir}</span>
                <span style={{ color: 'var(--term-prompt-branch)' }}>
                  ({state.detached ? shortHash(state.HEAD) : state.currentBranch}{dirtySymbol})
                </span>
                <span style={{ color: 'var(--term-cmd)' }}>$</span>
              </div>
            )}

            {/* Input with Ghost Suggestion */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type git or shell command... (TAB to complete)"
                autoFocus
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--term-cmd)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  zIndex: 2
                }}
              />
              {/* Ghost text overlay */}
              {ghostSuggestion && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    color: 'var(--term-text)',
                    opacity: 0.35,
                    zIndex: 1,
                    whiteSpace: 'pre'
                  }}
                >
                  <span style={{ visibility: 'hidden' }}>{inputVal}</span>
                  {ghostSuggestion}
                </div>
              )}
            </div>
          </form>

          {/* Terminal Footer Status Bar */}
          <div style={{ background: 'var(--term-bg)', padding: '0.3rem 1.0rem', borderTop: '1px solid var(--term-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--term-text)', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
            <span>{windowStyle === 'windows' ? 'Shell: PowerShell 7.4 | UTF-8' : windowStyle === 'linux' ? 'Shell: bash 5.2 | UTF-8' : 'Shell: zsh / bash | UTF-8'}</span>
            <span>Tab: Autocomplete | Ctrl+L / cls: Clear | Ctrl+C: Interrupt</span>
          </div>
        </div>

        {/* ═══ LIVE GIT STATE VISUALISER ═══ */}
        {layoutMode === 'split' && (
          <div style={{ background: '#060b16', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

            {/* Visualiser Header */}
            <div style={{ background: '#0c1525', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GitBranch size={15} color="#00f2fe" /> Live Git State Visualiser
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#00dfa2', fontWeight: '700' }}>
                HEAD → {state.detached ? shortHash(state.HEAD) : state.currentBranch}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

              {/* ── 3 Areas: Working Dir / Staging / Stash ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                {/* Working Directory */}
                <div style={{ background: 'rgba(255,75,75,0.06)', border: '1px solid rgba(255,75,75,0.25)', borderRadius: '10px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ff4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b4b', display: 'inline-block' }}></span>
                    1. Working Tree
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Unsaved local edits</div>
                  {state.workingDir.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Clean</div>
                  ) : state.workingDir.map((f, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#fca5a5', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: '#ff4b4b', fontWeight: '700' }}>M</span> {f}
                    </div>
                  ))}
                </div>

                {/* Staging Area */}
                <div style={{ background: 'rgba(0,223,162,0.06)', border: '1px solid rgba(0,223,162,0.25)', borderRadius: '10px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#00dfa2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00dfa2', display: 'inline-block' }}></span>
                    2. Staging Index
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Ready to commit</div>
                  {state.stagingArea.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Empty</div>
                  ) : state.stagingArea.map((f, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#86efac', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ color: '#00dfa2', fontWeight: '700' }}>A</span> {f}
                    </div>
                  ))}
                </div>

                {/* Stash Stack */}
                <div style={{ background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.25)', borderRadius: '10px', padding: '0.65rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ffb703', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb703', display: 'inline-block' }}></span>
                    Stash Clipboard
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Temporary save stack ({state.stashStack.length})</div>
                  {state.stashStack.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Empty</div>
                  ) : state.stashStack.map((s, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#fde68a', padding: '2px 0' }}>
                      @{'{' + i + '}'} {s.msg}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Branches & Tags Summary ── */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.3rem', alignSelf: 'center' }}>Branches:</span>
                {allBranchNames.map(b => (
                  <span key={b} style={{
                    fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-mono)',
                    padding: '2px 8px', borderRadius: '4px',
                    background: branchColor(allBranchNames, b) + '22',
                    color: branchColor(allBranchNames, b),
                    border: `1px solid ${branchColor(allBranchNames, b)}44`,
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                  }}>
                    {b === state.currentBranch && !state.detached && <span style={{ fontSize: '0.6rem' }}>★</span>}
                    {b}
                  </span>
                ))}
                {Object.keys(state.tags).length > 0 && (
                  <>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginLeft: '0.5rem', alignSelf: 'center' }}>Tags:</span>
                    {Object.keys(state.tags).map(t => (
                      <span key={t} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(250,204,21,0.15)', color: '#fde047', border: '1px solid rgba(250,204,21,0.3)' }}>
                        🏷 {t}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* ── Commit Graph ── */}
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                3. Commit Timeline Graph (Saved Snapshots)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {state.commits.slice().reverse().map((c, rIdx) => {
                  const isHEAD = c.hash === state.HEAD;
                  const tips = commitBranchTips[c.hash] || [];
                  const tags = commitTags[c.hash] || [];
                  const remoteTips = Object.entries(state.remotes).filter(([, h]) => h === c.hash).map(([b]) => b);
                  const color = branchColor(allBranchNames, c.branch);
                  const isMerge = c.parents.length > 1;

                  return (
                    <div key={c.hash} style={{ display: 'flex', alignItems: 'stretch', minHeight: '44px' }}>
                      {/* Rail line */}
                      <div style={{ width: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {rIdx > 0 && <div style={{ width: '2px', flex: '1', background: color + '55' }}></div>}
                        <div style={{
                          width: isMerge ? '16px' : '12px', height: isMerge ? '16px' : '12px', borderRadius: '50%',
                          background: isHEAD ? '#00f2fe' : color, flexShrink: 0,
                          border: isHEAD ? '3px solid #fff' : `2px solid ${color}`,
                          boxShadow: isHEAD ? '0 0 12px rgba(0,242,254,0.6)' : 'none',
                        }}></div>
                        {rIdx < state.commits.length - 1 && <div style={{ width: '2px', flex: '1', background: color + '55' }}></div>}
                      </div>

                      {/* Commit details */}
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0.6rem',
                        background: isHEAD ? 'rgba(0,242,254,0.06)' : 'transparent',
                        borderRadius: '6px', marginLeft: '0.25rem',
                        border: isHEAD ? '1px solid rgba(0,242,254,0.2)' : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: '700', color: '#00f2fe', background: 'rgba(0,242,254,0.1)', padding: '1px 6px', borderRadius: '4px', flexShrink: 0 }}>
                          {shortHash(c.hash)}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.msg}
                        </span>
                        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, flexWrap: 'wrap' }}>
                          {isHEAD && (
                            <span style={{ fontSize: '0.68rem', fontWeight: '800', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: '4px', background: '#dc2626', color: 'white' }}>HEAD</span>
                          )}
                          {tips.map(b => (
                            <span key={b} style={{ fontSize: '0.68rem', fontWeight: '700', fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: '4px', background: branchColor(allBranchNames, b), color: '#000' }}>
                              {b}
                            </span>
                          ))}
                          {remoteTips.map(b => (
                            <span key={`r-${b}`} style={{ fontSize: '0.65rem', fontWeight: '600', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '4px', background: 'rgba(139,92,246,0.3)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)' }}>
                              origin/{b}
                            </span>
                          ))}
                          {tags.map(t => (
                            <span key={t} style={{ fontSize: '0.65rem', fontWeight: '600', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '4px', background: 'rgba(250,204,21,0.15)', color: '#fde047' }}>
                              🏷{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Remote Tracking ── */}
              {Object.keys(state.remotes).length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                    Remote Sync (origin)
                  </div>
                  {Object.entries(state.remotes).map(([b, h]) => (
                    <div key={b} style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#c4b5fd', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#a78bfa' }}>origin/{b}</span>
                      <ChevronRight size={12} color="#64748b" />
                      <span style={{ color: '#94a3b8' }}>{shortHash(h)}</span>
                      {h === state.branches[b] ?
                        <span style={{ fontSize: '0.65rem', color: '#00dfa2', fontWeight: '700' }}>✓ synced</span> :
                        <span style={{ fontSize: '0.65rem', color: '#ffb703', fontWeight: '700' }}>⚠ behind</span>
                      }
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
