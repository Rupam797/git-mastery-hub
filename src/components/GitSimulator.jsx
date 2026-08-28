import React, { useState, useRef, useEffect } from 'react';
import { Terminal, GitBranch, RefreshCw, HelpCircle, ChevronRight } from 'lucide-react';

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

// ─── INITIAL STATE FACTORY ───────────────────────────────
function makeInitial() {
  return {
    commits: [
      { hash: 'a1b2c3d', msg: 'Initial commit',           branch: 'main', parents: [] },
      { hash: 'e4f5a6b', msg: 'Add README.md',            branch: 'main', parents: ['a1b2c3d'] },
      { hash: 'f9c8d7e', msg: 'feat: project structure',  branch: 'main', parents: ['e4f5a6b'] },
    ],
    branches: { main: 'f9c8d7e' },
    currentBranch: 'main',
    HEAD: 'f9c8d7e',
    detached: false,
    workingDir: [],        // file names with status
    stagingArea: [],       // file names staged
    stashStack: [],        // { id, msg, branch }
    tags: {},              // tag -> hash
    remotes: { main: 'f9c8d7e' },   // remote branch -> hash
    commandHistory: [],    // for up arrow
  };
}

// ─── SUPPORTED COMMANDS LIST ─────────────────────────────
const HELP_TEXT = `
 Supported commands:
 ─────────────────────────────────────────
  git init                    Initialize repository
  git status                  Show working tree status
  git add <file|.>            Stage files
  git commit -m "<msg>"       Commit staged changes
  git log [--oneline]         Show commit history
  git diff                    Show unstaged changes
  git diff --staged           Show staged changes
  ─────────────────────────────────────────
  git branch [name]           List / create branch
  git branch -d <name>        Delete branch
  git branch -m <old> <new>   Rename branch
  git switch <branch>         Switch branch
  git switch -c <branch>      Create & switch branch
  git checkout <branch>       Switch branch (legacy)
  git checkout -b <branch>    Create & switch (legacy)
  git merge <branch>          Merge branch into current
  git rebase <branch>         Rebase onto branch
  ─────────────────────────────────────────
  git stash [push -m "msg"]   Stash changes
  git stash pop               Pop latest stash
  git stash list              List stash entries
  git stash drop              Drop latest stash
  ─────────────────────────────────────────
  git reset --soft HEAD~N     Undo N commits, keep staged
  git reset --mixed HEAD~N    Undo N commits, unstage
  git reset --hard HEAD~N     Undo N commits, discard all
  git revert <hash>           Create inverse commit
  git cherry-pick <hash>      Apply commit to current branch
  ─────────────────────────────────────────
  git tag <name> [hash]       Create tag
  git tag                     List tags
  git remote -v               Show remote info
  git push                    Push to remote
  git pull                    Pull from remote
  git fetch                   Fetch remote changes
  git reflog                  Show HEAD movement log
  ─────────────────────────────────────────
  touch <file>                Create a file (simulate edit)
  rm <file>                   Remove a file
  clear                       Clear terminal
  help                        Show this help
`.trim();

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function GitSimulator() {
  const init = makeInitial();
  const [state, setState] = useState(init);
  const [history, setHistory] = useState([
    { type: 'system', text: '  Git Mastery – Interactive Practice Terminal v2.0' },
    { type: 'system', text: '  Type "help" for all supported commands. Type any git command to see the visualiser update live!' },
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

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ─── add output lines helper ──────────────────────────
  const out = (...lines) => setHistory(p => [...p, ...lines.map(l => (typeof l === 'string' ? { type: 'out', text: l } : l))]);
  const err = (text) => setHistory(p => [...p, { type: 'error', text }]);
  const sys = (text) => setHistory(p => [...p, { type: 'system', text }]);

  // ─── COMMAND PROCESSOR ────────────────────────────────
  const processCommand = (raw) => {
    const cmdStr = raw.trim();
    if (!cmdStr) return;

    setHistory(p => [...p, { type: 'cmd', text: `$ ${cmdStr}` }]);
    setState(prev => ({ ...prev, commandHistory: [...prev.commandHistory, cmdStr] }));
    setHistoryIdx(-1);

    if (cmdStr === 'clear') { setHistory([]); return; }
    if (cmdStr === 'help') { out(HELP_TEXT); return; }

    // touch / rm (simulated file ops)
    if (cmdStr.startsWith('touch ')) {
      const fname = cmdStr.slice(6).trim();
      if (!fname) { err('usage: touch <filename>'); return; }
      setState(prev => {
        if (prev.workingDir.includes(fname)) { err(`File '${fname}' already exists in working directory.`); return prev; }
        out(`Created file '${fname}' in working directory.`);
        return { ...prev, workingDir: [...prev.workingDir, fname] };
      });
      return;
    }
    if (cmdStr.startsWith('rm ')) {
      const fname = cmdStr.slice(3).trim();
      setState(prev => {
        if (!prev.workingDir.includes(fname) && !prev.stagingArea.includes(fname)) { err(`File '${fname}' not found.`); return prev; }
        out(`Removed file '${fname}'.`);
        return { ...prev, workingDir: prev.workingDir.filter(f => f !== fname), stagingArea: prev.stagingArea.filter(f => f !== fname) };
      });
      return;
    }

    // Must start with git
    if (!cmdStr.startsWith('git ')) {
      err(`Command not found: ${cmdStr}. Type "help" for available commands.`);
      return;
    }

    const parts = cmdStr.split(/\s+/);
    const action = parts[1];

    // ─── GIT INIT ───────────────────────────────────────
    if (action === 'init') {
      sys('Reinitialized existing Git repository.');
      return;
    }

    // ─── GIT STATUS ─────────────────────────────────────
    if (action === 'status') {
      setState(prev => {
        const lines = [`On branch ${prev.currentBranch}`];
        if (prev.stagingArea.length) {
          lines.push('Changes to be committed:');
          prev.stagingArea.forEach(f => lines.push(`  \x1b[32m  new file:   ${f}\x1b[0m`));
        }
        if (prev.workingDir.length) {
          lines.push('Untracked / modified files:');
          prev.workingDir.forEach(f => lines.push(`  \x1b[31m  ${f}\x1b[0m`));
        }
        if (!prev.stagingArea.length && !prev.workingDir.length) {
          lines.push('nothing to commit, working tree clean');
        }
        out(...lines);
        return prev;
      });
      return;
    }

    // ─── GIT ADD ────────────────────────────────────────
    if (action === 'add') {
      const target = parts[2];
      if (!target) { err('Nothing specified, nothing added. Use "git add <file>" or "git add ."'); return; }
      setState(prev => {
        if (target === '.' || target === '-A') {
          if (prev.workingDir.length === 0) { out('Nothing to add.'); return prev; }
          out(`Added ${prev.workingDir.length} file(s) to staging area.`);
          return { ...prev, stagingArea: [...new Set([...prev.stagingArea, ...prev.workingDir])], workingDir: [] };
        }
        if (!prev.workingDir.includes(target)) { err(`pathspec '${target}' did not match any files`); return prev; }
        out(`Added '${target}' to staging area.`);
        return { ...prev, stagingArea: [...prev.stagingArea, target], workingDir: prev.workingDir.filter(f => f !== target) };
      });
      return;
    }

    // ─── GIT DIFF ───────────────────────────────────────
    if (action === 'diff') {
      setState(prev => {
        if (parts[2] === '--staged' || parts[2] === '--cached') {
          if (prev.stagingArea.length === 0) { out('No staged changes.'); return prev; }
          out('Staged changes (Index vs HEAD):');
          prev.stagingArea.forEach(f => out(`  + ${f}  (new file)`));
        } else {
          if (prev.workingDir.length === 0) { out('No unstaged changes.'); return prev; }
          out('Unstaged changes (Working Dir vs Index):');
          prev.workingDir.forEach(f => out(`  M ${f}  (modified/untracked)`));
        }
        return prev;
      });
      return;
    }

    // ─── GIT COMMIT ─────────────────────────────────────
    if (action === 'commit') {
      const isAmend = cmdStr.includes('--amend');
      const msgMatch = cmdStr.match(/-m\s+["'](.+?)["']/);
      const msgMatch2 = cmdStr.match(/-m\s+([^\s"']+)/);

      setState(prev => {
        if (!isAmend && prev.stagingArea.length === 0) {
          err('nothing to commit (create / add files first, then "git add", then "git commit")');
          return prev;
        }

        if (isAmend) {
          const lastCommit = prev.commits[prev.commits.length - 1];
          const newMsg = msgMatch ? msgMatch[1] : msgMatch2 ? msgMatch2[1] : lastCommit.msg;
          const amended = prev.commits.map((c, i) => i === prev.commits.length - 1 ? { ...c, msg: newMsg } : c);
          out(`[${prev.currentBranch} ${shortHash(lastCommit.hash)}] ${newMsg} (amended)`);
          setReflog(r => [...r, { action: 'commit (amend)', hash: lastCommit.hash, msg: `HEAD -> ${prev.currentBranch}` }]);
          return { ...prev, commits: amended, stagingArea: [] };
        }

        const msg = msgMatch ? msgMatch[1] : msgMatch2 ? msgMatch2[1] : 'WIP commit';
        const hash = randHash();
        const newCommit = { hash, msg, branch: prev.currentBranch, parents: [prev.HEAD] };
        out(`[${prev.currentBranch} ${shortHash(hash)}] ${msg}`);
        out(` ${prev.stagingArea.length} file(s) changed`);
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

    // ─── GIT LOG ────────────────────────────────────────
    if (action === 'log') {
      const oneline = parts.includes('--oneline');
      setState(prev => {
        const branchCommits = getBranchCommits(prev, prev.currentBranch);
        const lines = [];
        branchCommits.slice().reverse().forEach(c => {
          const refs = [];
          Object.entries(prev.branches).forEach(([b, h]) => { if (h === c.hash) refs.push(b); });
          Object.entries(prev.tags).forEach(([t, h]) => { if (h === c.hash) refs.push(`tag: ${t}`); });
          if (c.hash === prev.HEAD) refs.unshift('HEAD');
          const refStr = refs.length ? ` (${refs.join(', ')})` : '';
          if (oneline) {
            lines.push(`${shortHash(c.hash)}${refStr} ${c.msg}`);
          } else {
            lines.push(`commit ${c.hash}${refStr}`);
            lines.push(`    ${c.msg}`);
            lines.push('');
          }
        });
        out(...lines);
        return prev;
      });
      return;
    }

    // ─── GIT BRANCH ─────────────────────────────────────
    if (action === 'branch') {
      if (parts[2] === '-d' || parts[2] === '-D') {
        const bname = parts[3];
        setState(prev => {
          if (!prev.branches[bname]) { err(`error: branch '${bname}' not found.`); return prev; }
          if (bname === prev.currentBranch) { err(`error: Cannot delete the branch '${bname}' which you are currently on.`); return prev; }
          out(`Deleted branch ${bname} (was ${shortHash(prev.branches[bname])}).`);
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
          out(`Branch '${oldName}' renamed to '${newName}'.`);
          return { ...prev, branches: nb, currentBranch: prev.currentBranch === oldName ? newName : prev.currentBranch };
        });
        return;
      }
      if (!parts[2]) {
        setState(prev => {
          const lines = Object.keys(prev.branches).sort().map(b => b === prev.currentBranch ? `* ${b}` : `  ${b}`);
          out(...lines);
          return prev;
        });
        return;
      }
      // create branch
      const bname = parts[2];
      setState(prev => {
        if (prev.branches[bname]) { err(`fatal: A branch named '${bname}' already exists.`); return prev; }
        out(`Created branch '${bname}' at ${shortHash(prev.HEAD)}.`);
        return { ...prev, branches: { ...prev.branches, [bname]: prev.HEAD } };
      });
      return;
    }

    // ─── GIT SWITCH / CHECKOUT ──────────────────────────
    if (action === 'switch' || action === 'checkout') {
      const createFlag = (action === 'switch' && parts[2] === '-c') || (action === 'checkout' && parts[2] === '-b');
      const target = createFlag ? parts[3] : parts[2];
      if (!target) { err(`error: no branch specified`); return; }
      setState(prev => {
        if (prev.workingDir.length > 0 || prev.stagingArea.length > 0) {
          err(`error: Your local changes would be overwritten. Please commit or stash them.`);
          return prev;
        }
        if (createFlag) {
          if (prev.branches[target]) { err(`fatal: A branch named '${target}' already exists.`); return prev; }
          out(`Switched to a new branch '${target}'`);
          setReflog(r => [...r, { action: `checkout: moving from ${prev.currentBranch} to ${target}`, hash: prev.HEAD, msg: `HEAD -> ${target}` }]);
          return { ...prev, branches: { ...prev.branches, [target]: prev.HEAD }, currentBranch: target, detached: false };
        }
        if (!prev.branches[target]) {
          // check if it's a commit hash (detached HEAD)
          const commitMatch = prev.commits.find(c => c.hash.startsWith(target));
          if (commitMatch) {
            out(`Note: switching to '${target}'. You are in 'detached HEAD' state.`);
            setReflog(r => [...r, { action: `checkout: moving to ${shortHash(commitMatch.hash)}`, hash: commitMatch.hash, msg: `HEAD detached at ${shortHash(commitMatch.hash)}` }]);
            return { ...prev, HEAD: commitMatch.hash, detached: true };
          }
          err(`error: pathspec '${target}' did not match any branch or commit.`);
          return prev;
        }
        out(`Switched to branch '${target}'`);
        setReflog(r => [...r, { action: `checkout: moving from ${prev.currentBranch} to ${target}`, hash: prev.branches[target], msg: `HEAD -> ${target}` }]);
        return { ...prev, currentBranch: target, HEAD: prev.branches[target], detached: false };
      });
      return;
    }

    // ─── GIT MERGE ──────────────────────────────────────
    if (action === 'merge') {
      const target = parts[2];
      if (!target) { err('usage: git merge <branch>'); return; }
      setState(prev => {
        if (!prev.branches[target]) { err(`merge: '${target}' - not something we can merge`); return prev; }
        if (prev.branches[target] === prev.HEAD) { out('Already up to date.'); return prev; }
        // fast-forward check
        const targetHash = prev.branches[target];
        const currentChain = getBranchCommitHashes(prev, prev.currentBranch);
        if (currentChain.includes(targetHash)) { out('Already up to date.'); return prev; }
        const targetChain = getBranchCommitHashes(prev, target);
        if (targetChain.includes(prev.HEAD)) {
          // fast-forward
          out(`Updating ${shortHash(prev.HEAD)}..${shortHash(targetHash)}`);
          out('Fast-forward');
          setReflog(r => [...r, { action: `merge ${target}: Fast-forward`, hash: targetHash, msg: `HEAD -> ${prev.currentBranch}` }]);
          return { ...prev, HEAD: targetHash, branches: { ...prev.branches, [prev.currentBranch]: targetHash } };
        }
        // 3-way merge
        const mergeHash = randHash();
        const mergeCommit = { hash: mergeHash, msg: `Merge branch '${target}' into ${prev.currentBranch}`, branch: prev.currentBranch, parents: [prev.HEAD, targetHash] };
        out(`Merge made by the 'ort' strategy.`);
        out(`  merge commit: ${shortHash(mergeHash)}`);
        setReflog(r => [...r, { action: `merge ${target}`, hash: mergeHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, mergeCommit], HEAD: mergeHash, branches: { ...prev.branches, [prev.currentBranch]: mergeHash } };
      });
      return;
    }

    // ─── GIT REBASE ─────────────────────────────────────
    if (action === 'rebase') {
      const target = parts[2];
      if (!target) { err('usage: git rebase <branch>'); return; }
      setState(prev => {
        if (!prev.branches[target]) { err(`fatal: invalid upstream '${target}'`); return prev; }
        const myCommits = prev.commits.filter(c => c.branch === prev.currentBranch && !getBranchCommitHashes(prev, target).includes(c.hash));
        if (myCommits.length === 0) { out(`Current branch ${prev.currentBranch} is up to date.`); return prev; }
        const targetHash = prev.branches[target];
        const rebasedCommits = myCommits.map(c => ({ ...c, hash: randHash(), parents: [targetHash] }));
        const newAll = [...prev.commits.filter(c => !myCommits.map(m => m.hash).includes(c.hash)), ...rebasedCommits];
        const newHead = rebasedCommits[rebasedCommits.length - 1].hash;
        out(`Successfully rebased and updated refs/heads/${prev.currentBranch}.`);
        out(`  ${myCommits.length} commit(s) re-applied on top of ${shortHash(targetHash)}.`);
        setReflog(r => [...r, { action: `rebase (finish): ${target}`, hash: newHead, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: newAll, HEAD: newHead, branches: { ...prev.branches, [prev.currentBranch]: newHead } };
      });
      return;
    }

    // ─── GIT STASH ──────────────────────────────────────
    if (action === 'stash') {
      const sub = parts[2];
      if (!sub || sub === 'push') {
        const msgMatch2 = cmdStr.match(/-m\s+["'](.+?)["']/);
        setState(prev => {
          if (prev.workingDir.length === 0 && prev.stagingArea.length === 0) { err('No local changes to save'); return prev; }
          const msg = msgMatch2 ? msgMatch2[1] : `WIP on ${prev.currentBranch}`;
          const stashEntry = { id: prev.stashStack.length, msg, branch: prev.currentBranch, files: [...prev.workingDir, ...prev.stagingArea] };
          out(`Saved working directory and index state "${msg}"`);
          return { ...prev, stashStack: [stashEntry, ...prev.stashStack], workingDir: [], stagingArea: [] };
        });
        return;
      }
      if (sub === 'pop') {
        setState(prev => {
          if (prev.stashStack.length === 0) { err('No stash entries found.'); return prev; }
          const [top, ...rest] = prev.stashStack;
          out(`Dropped refs/stash@{0} – restored ${top.files.length} file(s) to working directory.`);
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
          out(`Dropped refs/stash@{0} (${prev.stashStack[0].msg})`);
          return { ...prev, stashStack: prev.stashStack.slice(1) };
        });
        return;
      }
      err(`Unknown stash subcommand: ${sub}`);
      return;
    }

    // ─── GIT RESET ──────────────────────────────────────
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
        } else { // hard
          newWorking = [];
          newStaging = [];
        }
        out(`HEAD is now at ${shortHash(targetCommit.hash)} ${targetCommit.msg}`);
        if (resetMode === 'soft') out('  Changes from reset commits preserved in staging area.');
        if (resetMode === 'mixed') out('  Changes from reset commits moved to working directory.');
        if (resetMode === 'hard') out('  All uncommitted changes discarded permanently.');
        setReflog(r => [...r, { action: `reset: moving to HEAD~${n} (--${resetMode})`, hash: targetCommit.hash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: keptCommits, HEAD: targetCommit.hash, branches: { ...prev.branches, [prev.currentBranch]: targetCommit.hash }, workingDir: newWorking, stagingArea: newStaging };
      });
      return;
    }

    // ─── GIT REVERT ─────────────────────────────────────
    if (action === 'revert') {
      const target = parts[2];
      if (!target) { err('usage: git revert <commit-hash>'); return; }
      setState(prev => {
        const targetCommit = prev.commits.find(c => c.hash.startsWith(target));
        if (!targetCommit) { err(`fatal: bad revision '${target}'`); return prev; }
        const revertHash = randHash();
        const revertCommit = { hash: revertHash, msg: `Revert "${targetCommit.msg}"`, branch: prev.currentBranch, parents: [prev.HEAD] };
        out(`[${prev.currentBranch} ${shortHash(revertHash)}] Revert "${targetCommit.msg}"`);
        setReflog(r => [...r, { action: `revert: ${shortHash(target)}`, hash: revertHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, revertCommit], HEAD: revertHash, branches: { ...prev.branches, [prev.currentBranch]: revertHash } };
      });
      return;
    }

    // ─── GIT CHERRY-PICK ────────────────────────────────
    if (action === 'cherry-pick') {
      const target = parts[2];
      if (!target) { err('usage: git cherry-pick <commit-hash>'); return; }
      setState(prev => {
        const targetCommit = prev.commits.find(c => c.hash.startsWith(target));
        if (!targetCommit) { err(`fatal: bad object '${target}'`); return prev; }
        const newHash = randHash();
        const cpCommit = { hash: newHash, msg: targetCommit.msg, branch: prev.currentBranch, parents: [prev.HEAD] };
        out(`[${prev.currentBranch} ${shortHash(newHash)}] ${targetCommit.msg}`);
        out(`  (cherry picked from commit ${shortHash(targetCommit.hash)})`);
        setReflog(r => [...r, { action: `cherry-pick: ${shortHash(targetCommit.hash)}`, hash: newHash, msg: `HEAD -> ${prev.currentBranch}` }]);
        return { ...prev, commits: [...prev.commits, cpCommit], HEAD: newHash, branches: { ...prev.branches, [prev.currentBranch]: newHash } };
      });
      return;
    }

    // ─── GIT TAG ────────────────────────────────────────
    if (action === 'tag') {
      if (!parts[2]) {
        setState(prev => {
          const tags = Object.keys(prev.tags);
          if (tags.length === 0) { out('No tags.'); return prev; }
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
        out(`Created tag '${tagName}' at ${shortHash(targetHash)}`);
        return { ...prev, tags: { ...prev.tags, [tagName]: targetHash } };
      });
      return;
    }

    // ─── GIT REMOTE ─────────────────────────────────────
    if (action === 'remote') {
      out('origin  https://github.com/user/repo.git (fetch)');
      out('origin  https://github.com/user/repo.git (push)');
      return;
    }

    // ─── GIT PUSH ───────────────────────────────────────
    if (action === 'push') {
      setState(prev => {
        out(`Enumerating objects... done.`);
        out(`Writing objects: 100%, done.`);
        out(`To https://github.com/user/repo.git`);
        out(`   ${shortHash(prev.remotes[prev.currentBranch] || 'new')}..${shortHash(prev.HEAD)}  ${prev.currentBranch} -> ${prev.currentBranch}`);
        return { ...prev, remotes: { ...prev.remotes, [prev.currentBranch]: prev.HEAD } };
      });
      return;
    }

    // ─── GIT PULL / FETCH ───────────────────────────────
    if (action === 'pull' || action === 'fetch') {
      out(`From https://github.com/user/repo.git`);
      out(` * branch            ${state.currentBranch}     -> FETCH_HEAD`);
      if (action === 'pull') out('Already up to date.');
      return;
    }

    // ─── GIT REFLOG ─────────────────────────────────────
    if (action === 'reflog') {
      reflog.slice().reverse().forEach((entry, i) => {
        out(`${shortHash(entry.hash)} HEAD@{${reflog.length - 1 - i}}: ${entry.action}: ${entry.msg}`);
      });
      return;
    }

    err(`git: '${action}' is not recognized in this simulator. Type "help" for available commands.`);
  };

  // ─── HELPERS: walk branch commits ─────────────────────
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

  // ─── KEY HANDLER (history nav) ────────────────────────
  const handleKeyDown = (e) => {
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
    const init = makeInitial();
    setState(init);
    setHistory([{ type: 'system', text: 'Simulator reset to initial state.' }]);
    setReflog([
      { action: 'commit (initial)', hash: 'a1b2c3d', msg: 'HEAD -> main' },
      { action: 'commit', hash: 'e4f5a6b', msg: 'HEAD -> main' },
      { action: 'commit', hash: 'f9c8d7e', msg: 'HEAD -> main' },
    ]);
  };

  // ─── COMPUTE VISUAL DATA ──────────────────────────────
  const allBranchNames = Object.keys(state.branches).sort();
  const headCommit = state.commits.find(c => c.hash === state.HEAD);

  // Map each commit to its latest branch tips
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

  // ═════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0' }}>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Interactive Git Practice Terminal & Live Visualiser</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type any git command in the terminal (left) → See all Git areas and commit graph update in real-time (right)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setHistory(p => [...p, { type: 'cmd', text: '$ help' }]); out(HELP_TEXT); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
            <HelpCircle size={16} /> Help
          </button>
          <button onClick={resetAll} style={{ background: 'rgba(255,75,75,0.15)', border: '1px solid rgba(255,75,75,0.3)', color: '#fca5a5', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>
            <RefreshCw size={16} /> Reset All
          </button>
        </div>
      </div>

      {/* Main 2-panel layout: Terminal | Visualiser */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: '72vh', minHeight: '520px' }}>

        {/* ═══ LEFT: PRACTICE TERMINAL ═══ */}
        <div style={{ background: '#020408', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} onClick={() => inputRef.current?.focus()}>
          {/* Terminal Header */}
          <div style={{ background: '#0c1525', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: '7px' }}>
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ff5f56' }}></span>
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffbd2e' }}></span>
              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#27c93f' }}></span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#64748b' }}>
              ⌨️ bash — ~/project ({state.currentBranch}){state.detached ? ' [DETACHED HEAD]' : ''}
            </span>
          </div>

          {/* Terminal Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: '1.65' }}>
            {history.map((line, i) => (
              <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {line.type === 'cmd' && <span style={{ color: '#00f2fe', fontWeight: '700' }}>{line.text}</span>}
                {line.type === 'out' && <span style={{ color: '#cbd5e1' }}>{line.text}</span>}
                {line.type === 'system' && <span style={{ color: '#00dfa2' }}>{'ℹ '}{line.text}</span>}
                {line.type === 'error' && <span style={{ color: '#ff4b4b' }}>{'✖ '}{line.text}</span>}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#0c1525', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ color: '#00dfa2', fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              {state.detached ? `(${shortHash(state.HEAD)})` : state.currentBranch} $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a git command... (try: git checkout -b feature/auth)"
              autoFocus
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}
            />
          </form>
        </div>

        {/* ═══ RIGHT: LIVE VISUALISER ═══ */}
        <div style={{ background: '#060b16', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>

          {/* Visualiser header */}
          <div style={{ background: '#0c1525', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitBranch size={15} color="#00f2fe" /> Live Git State Visualiser
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#00dfa2', fontWeight: '700' }}>
              HEAD → {state.detached ? shortHash(state.HEAD) : state.currentBranch}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

            {/* ── 3 Areas: Working Dir / Staging / Last Commit ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
              {/* Working Directory */}
              <div style={{ background: 'rgba(255,75,75,0.06)', border: '1px solid rgba(255,75,75,0.25)', borderRadius: '10px', padding: '0.65rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ff4b4b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b4b', display: 'inline-block' }}></span>
                  Working Directory
                </div>
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
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#00dfa2', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00dfa2', display: 'inline-block' }}></span>
                  Staging Area (Index)
                </div>
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
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ffb703', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffb703', display: 'inline-block' }}></span>
                  Stash Stack ({state.stashStack.length})
                </div>
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
              Commit Graph (newest at top)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {state.commits.slice().reverse().map((c, rIdx) => {
                const isHEAD = c.hash === state.HEAD;
                const tips = commitBranchTips[c.hash] || [];
                const tags = commitTags[c.hash] || [];
                const remoteTips = Object.entries(state.remotes).filter(([b, h]) => h === c.hash).map(([b]) => b);
                const color = branchColor(allBranchNames, c.branch);
                const isMerge = c.parents.length > 1;
                return (
                  <div key={c.hash} style={{ display: 'flex', alignItems: 'stretch', minHeight: '44px' }}>
                    {/* Graph rail */}
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
                    {/* Commit info */}
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
                        {isMerge && (
                          <span style={{ fontSize: '0.65rem', fontWeight: '600', fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: '4px', background: 'rgba(236,72,153,0.15)', color: '#f9a8d4' }}>
                            merge
                          </span>
                        )}
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
                  Remote Tracking (origin)
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

      </div>
    </div>
  );
}
