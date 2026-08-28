export const gitModules = [
  {
    id: "module-1",
    title: "1. Core Mechanics & Architecture",
    level: "Basic",
    description: "Understand how Git stores data, object structure, the 4 states, and essential daily commands.",
    lessons: [
      {
        id: "git-architecture",
        title: "Git Architecture & The 4 Areas",
        summary: "Understand Working Directory, Staging Area (Index), Local Repository, and Remote Repository.",
        content: `
### How Git Works Under the Hood
Unlike traditional VCS (like SVN) that store file deltas, **Git stores complete snapshots** of your project over time. Every time you commit, Git takes a picture of what all your files look like at that moment and stores a reference to that snapshot.

#### The 4 Git Storage Areas
1. **Working Directory**: The actual files on your filesystem where you make edits.
2. **Staging Area (Index)**: A draft area where you assemble changes before committing. Only changes added here will go into the next snapshot.
3. **Local Repository (\`.git/\`)**: Your local database of object snapshots, refs, branches, and commit history.
4. **Remote Repository (e.g., GitHub, GitLab, Bitbucket)**: Hosted repository for team collaboration.

#### The 4 Git Objects inside \`.git/objects/\`
* **Blob**: Raw binary content of a file (independent of filename or permissions).
* **Tree**: Represents a directory, linking filenames to Blob hashes or sub-Trees.
* **Commit**: Points to a top-level Tree object, author/committer metadata, timestamp, log message, and zero or more parent commit hashes.
* **Annotated Tag**: A named pointer with signature, date, and tagger message pointing directly to a specific commit.
        `,
        commands: [
          { cmd: "git init", desc: "Initialize a new local Git repository (.git directory)" },
          { cmd: "git clone <url>", desc: "Clone a remote repository to local machine" },
          { cmd: "git status", desc: "Show status of working directory & staging area" },
          { cmd: "git add <file>", desc: "Move file changes from Working Directory to Staging Area" },
          { cmd: "git commit -m \"msg\"", desc: "Create a new snapshot commit from Staging Area" }
        ],
        proTip: "Use `git cat-file -p <hash>` to inspect any object in `.git/objects` and see raw Git internals in action!",
        productionUse: "Always review `git status` and `git diff --staged` before running `git commit` to avoid accidentally committing secret tokens or unwanted files."
      },
      {
        id: "git-diff-status",
        title: "Inspecting Changes & File Status",
        summary: "Mastering status checks, unstaged vs staged diffs, and log views.",
        content: `
### File Lifecycle in Git
Files in your working directory exist in one of two states: **Tracked** or **Untracked**.
Tracked files can be:
* **Unmodified**: Identical to last commit.
* **Modified**: Edited locally, not staged yet.
* **Staged**: Marked to go into the next commit snapshot.

### Differentiating Diffs
* \`git diff\`: Compares **Working Directory** vs **Staging Area** (Unstaged changes).
* \`git diff --staged\` (or \`--cached\`): Compares **Staging Area** vs **Last Commit (HEAD)**.
* \`git diff HEAD\`: Compares **Working Directory** vs **Last Commit**.
        `,
        commands: [
          { cmd: "git status -s", desc: "Short status view (M = modified, A = added, ?? = untracked)" },
          { cmd: "git diff", desc: "View unstaged changes" },
          { cmd: "git diff --staged", desc: "View staged changes ready for commit" },
          { cmd: "git log --oneline --graph --all", desc: "View clean, compact visual commit tree" }
        ],
        proTip: "Set up a global git alias for a rich visual log: `git config --global alias.lg \"log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit\"`.",
        productionUse: "Production teams enforce `git diff --check` before commits to detect trailing whitespace or broken formatting."
      },
      {
        id: "gitignore-rules",
        title: "Ignoring Files with .gitignore",
        summary: "How to prevent junk, secrets, build artifacts, and node_modules from polluting Git.",
        content: `
### Rules of .gitignore
A \`.gitignore\` file specifies intentionally untracked files that Git should ignore.
* Pattern matching rules:
  * \`node_modules/\`: Ignores directory and all contents.
  * \`*.log\`: Ignores all files ending in \`.log\`.
  * \`!.env.example\`: Exclamation mark negates ignore (tracks this file even if \`*.env\` is ignored).
  * \`build/**/temp*\`: Recursive wildcards.

### Fixing Files Already Tracked
If a file was committed BEFORE adding it to \`.gitignore\`, Git will continue tracking it!
To stop tracking without deleting the file from your local disk:
\`\`\`bash
git rm --cached <file>
# Or for a folder:
git rm -r --cached node_modules/
git commit -m "chore: stop tracking ignored folder"
\`\`\`
        `,
        commands: [
          { cmd: "git check-ignore -v <filepath>", desc: "Debug which .gitignore rule is ignoring a specific file" },
          { cmd: "git rm --cached <file>", desc: "Untrack file from Git while keeping it on local disk" }
        ],
        proTip: "Create a global ignore file for OS/IDE trash (`.DS_Store`, `.idea`, `.vscode`): `git config --global core.excludesfile ~/.gitignore_global`.",
        productionUse: "NEVER commit `.env` or credential files. Use gitleaks or pre-commit hooks to automatically prevent secrets from leaking into Git history."
      }
    ]
  },
  {
    id: "module-2",
    title: "2. Branching, Merging & Stashing",
    level: "Intermediate",
    description: "Branch pointers, Fast-Forward vs 3-Way Merges, Rebasing vs Merging, and Conflict Resolution.",
    lessons: [
      {
        id: "branching-mechanics",
        title: "Branch Mechanics & Modern Switch/Restore",
        summary: "What a branch really is (a 41-byte pointer) and how to navigate branches safely.",
        content: `
### What is a Branch in Git?
A branch in Git is simply a lightweight, movable pointer to a commit hash stored in \`.git/refs/heads/\`.
Creating a branch takes less than a millisecond because Git only writes a 40-character SHA hash to a file!

\`HEAD\` is a special pointer that references the current branch you are checked out on.

### Modern Commands: \`git switch\` & \`git restore\`
Historically \`git checkout\` did everything (switching branches AND discarding file changes), causing confusion.
In Git 2.23+, Git introduced dedicated commands:
* **\`git switch\`**: Branch navigation.
* **\`git restore\`**: File restoration & unstaging.
        `,
        commands: [
          { cmd: "git branch <branch-name>", desc: "Create a new branch pointer" },
          { cmd: "git switch <branch-name>", desc: "Switch to existing branch" },
          { cmd: "git switch -c <branch-name>", desc: "Create AND switch to new branch" },
          { cmd: "git restore <file>", desc: "Discard uncommitted working directory changes" },
          { cmd: "git restore --staged <file>", desc: "Unstage file back to working directory" },
          { cmd: "git branch -d <branch-name>", desc: "Safely delete merged branch" },
          { cmd: "git branch -D <branch-name>", desc: "Force delete unmerged branch" }
        ],
        proTip: "Use `git switch -` to toggle instantly back to your previous branch!",
        productionUse: "Naming convention matters: Use prefix standard `feature/AUTH-101-login`, `bugfix/PAY-404-stripe-timeout`, `hotfix/v1.2.1`."
      },
      {
        id: "merging-vs-rebasing",
        title: "Fast-Forward vs 3-Way Merge vs Rebase",
        summary: "When to merge, when to rebase, and keeping a clean linear project history.",
        content: `
### Merge Strategies
1. **Fast-Forward Merge (\`git merge --ff-only\`)**:
   * Occurs when target branch has no new commits since feature branch was created.
   * Git simply moves the target branch pointer forward to the feature branch's latest commit. No merge commit created.

2. **3-Way Merge (\`git merge --no-ff\`)**:
   * Occurs when target branch AND feature branch have diverged.
   * Git creates a dedicated **Merge Commit** with 2 parent commits, joining both histories.

3. **Rebase (\`git rebase main\`)**:
   * Re-applies your feature branch commits one by one on top of the latest \`main\` branch.
   * Eliminates unnecessary merge commits, creating a **clean, linear history**.

#### The Golden Rule of Rebasing
> ⚠️ **NEVER rebase commits that have been pushed to a public/shared branch!**
> Rebasing rewrites commit SHA hashes. If team members built work off the old SHA hashes, rebasing public branches will cause severe team conflicts.
        `,
        commands: [
          { cmd: "git merge <feature-branch>", desc: "Merge feature branch into current branch" },
          { cmd: "git merge --no-ff <feature-branch>", desc: "Force creation of a merge commit (preserves context)" },
          { cmd: "git rebase main", desc: "Rebase current feature branch onto latest main" },
          { cmd: "git rebase --abort", desc: "Cancel an ongoing rebase operation" }
        ],
        proTip: "Configure git to auto-rebase on pull: `git config --global pull.rebase true` to avoid messy 'Merge branch main into main' commits.",
        productionUse: "Trunk-based teams enforce 'Rebase & Merge' or 'Squash & Merge' on Pull Requests to keep main branch commit history 100% linear."
      },
      {
        id: "conflict-resolution",
        title: "Mastering Conflict Resolution",
        summary: "Understanding conflict markers, using 3-way merge tools, and stepping through conflicts cleanly.",
        content: `
### How Conflicts Happen
When Git cannot automatically reconcile differences between 2 commits (e.g., both modified the exact same line in a file), Git pauses the merge/rebase and inserts conflict markers:

\`\`\`
<<<<<<< HEAD (Current Branch / Ours)
const API_URL = "https://api.production.com/v2";
=======
const API_URL = "https://api.staging.com/v1";
>>>>>>> feature/new-api (Incoming Branch / Theirs)
\`\`\`

### Resolution Workflow
1. Run \`git status\` to see unmerged paths.
2. Open files and decide which code to keep, then remove markers (\`<<<<<<<\`, \`=======\`, \`>>>>>>>\`).
3. Run \`git add <file>\` to mark conflict as resolved.
4. Complete operation:
   * For merge: \`git commit\`
   * For rebase: \`git rebase --continue\`
        `,
        commands: [
          { cmd: "git status", desc: "Show conflicting files during active merge/rebase" },
          { cmd: "git diff", desc: "See conflict markers and surrounding code" },
          { cmd: "git add <file>", desc: "Mark resolved file as staged" },
          { cmd: "git merge --abort", desc: "Safely exit merge and return to pre-merge state" },
          { cmd: "git config --global rerere.enabled true", desc: "Enable Reuse Recorded Resolution (Rerere)" }
        ],
        proTip: "Enable `rerere` (Reuse Recorded Resolution). Git will remember how you resolved a conflict and automatically re-apply the same resolution if that conflict appears again!",
        productionUse: "In production, use VS Code / JetBrains built-in 3-way conflict diff visualizer or `git mergetool` to avoid human syntax errors during manual marker deletion."
      },
      {
        id: "stashing-mastery",
        title: "Stashing Uncommitted Work",
        summary: "Shelving dirty working directory changes temporarily to switch contexts or pull urgent hotfixes.",
        content: `
### What is Git Stash?
Git Stash takes your modified tracked files and staged changes, saves them on a stack of uncommitted changes, and reverts your working directory back to the clean \`HEAD\` commit.

### Advanced Stash Tricks
* **Named stashes**: Always name your stash so you know what it contains!
* **Include untracked files**: Standard stash ignores untracked files. Use \`-u\` (or \`--include-untracked\`).
* **Stash to branch**: Stash changes, create a new branch from stash directly.
        `,
        commands: [
          { cmd: "git stash push -m \"WIP login refactor\" -u", desc: "Save working dir & untracked files with custom message" },
          { cmd: "git stash list", desc: "View all stashed snapshots on the stack" },
          { cmd: "git stash pop", desc: "Apply latest stash (stash@{0}) and remove it from stack" },
          { cmd: "git stash apply stash@{2}", desc: "Apply specific stash without deleting it from stack" },
          { cmd: "git stash drop stash@{0}", desc: "Delete specific stash item" }
        ],
        proTip: "Use `git stash show -p stash@{0}` to see exact diff of what is inside a stash before popping it!",
        productionUse: "Use stash when interrupted by an urgent hotfix: `git stash push -u -m 'WIP'`, switch to main, apply hotfix, switch back, `git stash pop`."
      }
    ]
  },
  {
    id: "module-3",
    title: "3. Advanced History Surgery & Rescue",
    level: "Advanced",
    description: "Interactive Rebase, Cherry-Pick, Reset modes (--soft, --mixed, --hard), Reflog, and Bisect debugging.",
    lessons: [
      {
        id: "interactive-rebase",
        title: "Interactive Rebase (git rebase -i)",
        summary: "Squashing, rewording, editing, dropping, and reordering commits like a surgeon.",
        content: `
### Interactive Rebase Commands
Running \`git rebase -i HEAD~n\` opens your editor with a list of the last \`n\` commits and actionable commands:

* **\`pick\`** (\`p\`): Keep commit as is.
* **\`reword\`** (\`r\`): Keep commit content, but edit commit message.
* **\`edit\`** (\`e\`): Pause rebase at this commit to amend code/files.
* **\`squash\`** (\`s\`): Combine commit into previous commit AND concatenate commit messages.
* **\`fixup\`** (\`f\`): Combine commit into previous commit AND discard this commit's log message.
* **\`drop\`** (\`d\`): Delete commit entirely from history.
* **\`exec\`** (\`x\`): Run shell command (e.g. \`npm test\`) after this commit.

### Example Interactive Rebase Script:
\`\`\`text
pick a1b2c3d feat(auth): add login component
fixup e4f5g6h fix typo in login component
squash i7j8k9l feat(auth): add password validation
reword m0n1o2p docs: update README
\`\`\`
        `,
        commands: [
          { cmd: "git rebase -i HEAD~5", desc: "Start interactive rebase for last 5 commits" },
          { cmd: "git rebase --continue", desc: "Proceed to next commit after fixing edit/conflict" },
          { cmd: "git commit --amend", desc: "Quickly modify message/files of the VERY LAST commit" }
        ],
        proTip: "Use `git commit --fixup <commit-hash>` followed by `git rebase -i --autosquash main` to automatically pair fixup commits without manual reordering!",
        productionUse: "Before requesting PR code review, interactive rebase to squash 15 WIP commits into 1-2 clean, semantic commits."
      },
      {
        id: "cherry-picking",
        title: "Cherry-Picking Commits",
        summary: "Extracting specific individual commits from any branch and applying them to current HEAD.",
        content: `
### When to Cherry-Pick
Cherry-picking takes the patch introduced by a specific commit from anywhere in your repository and applies it to your currently checked-out branch.

#### Common Scenarios:
1. Accidental commit on wrong branch: Cherry-pick hash onto right branch, reset wrong branch.
2. Backporting a bugfix: Taking a fix from \`main\` and applying it to a release branch \`release/v1.0\`.
3. Extracting feature snippet: Grabbing 1 finished commit from an uncompleted feature branch.
        `,
        commands: [
          { cmd: "git cherry-pick <commit-hash>", desc: "Apply single commit patch to current branch" },
          { cmd: "git cherry-pick <hash1> <hash2>", desc: "Apply multiple commits" },
          { cmd: "git cherry-pick -x <hash>", desc: "Append '(cherry picked from commit ...)' to log for traceability" },
          { cmd: "git cherry-pick --abort", desc: "Cancel cherry-pick operation" }
        ],
        proTip: "Use `git cherry-pick -n <hash>` (no-commit) to apply the changes to your working directory/staging area without automatically committing!",
        productionUse: "Enterprise hotfix strategy: Fix bug in `main`, then `git cherry-pick -x <hash>` into `release/v2.1` and `release/v2.2`."
      },
      {
        id: "reset-modes-revert",
        title: "Git Reset (--soft, --mixed, --hard) vs Git Revert",
        summary: "Mastering the matrix of reset flags and knowing when to revert pushed commits safely.",
        content: `
### Git Reset Modes Deep Dive
\`git reset\` moves the current branch pointer backward to a target commit. The flags control what happens to your **Staging Area** and **Working Directory**:

| Flag | HEAD Pointer | Staging Area (Index) | Working Directory |
| :--- | :---: | :---: | :---: |
| **\`--soft\`** | Moved to target | ❌ **Preserved** (Staged) | ❌ **Preserved** (Unchanged) |
| **\`--mixed\`** *(Default)* | Moved to target | ⚠️ **Reset** (Unstaged) | ❌ **Preserved** (Unchanged) |
| **\`--hard\`** | Moved to target | ⚠️ **Reset** | ⚠️ **WIPED CLEAN** (Lost forever*) |

*Uncommitted changes wiped by \`--hard\` are unrecoverable. Committed changes can be recovered via Reflog.

### Git Revert: Safe Undo for Public History
Unlike \`git reset\` (which deletes history), \`git revert <hash>\` creates a **NEW commit** that performs the exact inverse of the target commit.
        `,
        commands: [
          { cmd: "git reset --soft HEAD~1", desc: "Undo commit, keep changes staged in Index" },
          { cmd: "git reset --mixed HEAD~1", desc: "Undo commit, unstage changes to working dir" },
          { cmd: "git reset --hard HEAD~1", desc: "DANGER: Move HEAD back & discard all local changes" },
          { cmd: "git revert <commit-hash>", desc: "Create inverse commit to undo a public commit safely" }
        ],
        proTip: "To uncommit the last commit but keep all work ready to edit: `git reset --soft HEAD~1`.",
        productionUse: "Rule of thumb: Use `git reset` ONLY on local un-pushed branches. Use `git revert` on public/production branches (`main`)."
      },
      {
        id: "reflog-rescue",
        title: "Git Reflog: The Ultimate Safety Net",
        summary: "How to recover deleted branches, lost commits, and disastrous rebases using Git reference logs.",
        content: `
### What is Reflog?
Git Reflog (\`reference log\`) records every single movement of \`HEAD\` in your local repository for the last 90 days.
Even if you run \`git reset --hard\` or delete a branch with \`git branch -D\`, the commits still exist in \`.git/objects/\` until garbage collection (\`git gc\`) runs!

### How to Rescue Lost Work
1. Run \`git reflog\` to view HEAD movement history.
2. Find the SHA hash or reflog identifier (e.g. \`HEAD@{3}\`) right before the mistake happened.
3. Reset back to that point or branch from it:
   \`\`\`bash
   git reset --hard HEAD@{3}
   # Or create branch from lost commit:
   git branch recovered-feature HEAD@{3}
   \`\`\`
        `,
        commands: [
          { cmd: "git reflog", desc: "Show complete audit trail of local HEAD movements" },
          { cmd: "git reflog show <branch-name>", desc: "Show history of specific branch pointer" },
          { cmd: "git reset --hard HEAD@{n}", desc: "Restore state to exact reflog entry n" }
        ],
        proTip: "Git never deletes commits immediately! If you ran `git reset --hard` by accident 5 minutes ago, `git reflog` will save your job.",
        productionUse: "Reflog is local to your machine. Teach your dev team about reflog to eliminate code loss panics in enterprise environments."
      },
      {
        id: "git-bisect",
        title: "Git Bisect: Automated Bug Hunting",
        summary: "Using binary search algorithms in Git history to pinpoint exact bug-introducing commits.",
        content: `
### What is Git Bisect?
When a regression bug is found in production but nobody knows which commit introduced it among 200 commits, **Git Bisect** performs a binary search through history to isolate the culprit commit in \`log2(N)\` steps (e.g., 200 commits takes only ~7 checks!).

### Bisect Workflow
1. Start bisect: \`git bisect start\`
2. Mark current broken commit: \`git bisect bad\`
3. Mark old known working commit: \`git bisect good <v1.0-hash>\`
4. Git checks out middle commit. Test the app.
   * If broken: run \`git bisect bad\`
   * If working: run \`git bisect good\`
5. Git pinpoints exact commit hash, author, date, and commit message!
6. Reset when done: \`git bisect reset\`

### Automated Bisect
You can even automate testing with a script!
\`\`\`bash
git bisect run npm test
\`\`\`
        `,
        commands: [
          { cmd: "git bisect start", desc: "Initialize binary search debugging session" },
          { cmd: "git bisect bad", desc: "Mark current commit as broken/buggy" },
          { cmd: "git bisect good <hash>", desc: "Mark known good historical commit" },
          { cmd: "git bisect run <script>", desc: "Fully automate binary search using test command exit code" },
          { cmd: "git bisect reset", desc: "Finish bisect and return to original branch state" }
        ],
        proTip: "If `npm test` returns exit code 0 on good and non-zero on bad, `git bisect run npm test` will find the exact breaking commit 100% automatically in under 30 seconds!",
        productionUse: "Used heavily in CI/CD triage pipelines to find breaking performance or memory leak regressions across large monolith codebases."
      }
    ]
  },
  {
    id: "module-4",
    title: "4. Production Workflows & Automation",
    level: "Production Level",
    description: "Git Flow vs Trunk-Based, Conventional Commits, Git Hooks (Husky), and Enterprise Configuration.",
    lessons: [
      {
        id: "production-workflows",
        title: "Enterprise Git Workflows",
        summary: "Comparing Git Flow, GitHub Flow, and Trunk-Based Development for production teams.",
        content: `
### Choosing the Right Workflow
Different team sizes and deployment speeds require different Git branching models:

#### 1. Git Flow (Scheduled Releases & Legacy Products)
* **Branches**: \`main\` (production), \`develop\` (staging), \`feature/*\`, \`release/*\`, \`hotfix/*\`.
* **Best for**: Mobile apps, desktop software, or products with rigid quarterly/monthly release cycles.

#### 2. GitHub Flow (Continuous Delivery Web Apps)
* **Branches**: \`main\` (always deployable), short-lived \`feature/*\` branches.
* **Flow**: Create branch → Submit Pull Request → Code Review & CI checks → Merge to main → Auto-deploy.
* **Best for**: SaaS web applications, microservices.

#### 3. Trunk-Based Development (High Velocity Modern Tech Giants)
* **Branches**: Everyone commits directly to \`main\` (or very short-lived <24 hour feature branches).
* **Core Requirement**: Heavy use of **Feature Flags** (Feature Toggles) and automated CI/CD test suites.
* **Best for**: Google, Meta, Netflix - shipping code to production dozens of times per day.
        `,
        commands: [
          { cmd: "git checkout -b release/v2.0.0 develop", desc: "Cut a release branch in Git Flow" },
          { cmd: "git push origin --delete feature/old-login", desc: "Clean up remote feature branch post-PR" }
        ],
        proTip: "Auto-delete merged remote feature branches in GitHub repository settings under Options -> Automatically delete head branches.",
        productionUse: "Modern engineering orgs favor GitHub Flow or Trunk-Based Development with branch protection rules on `main`."
      },
      {
        id: "conventional-commits",
        title: "Conventional Commits Specification",
        summary: "Standardizing commit messages for automated changelogs, semantic versioning, and clean logs.",
        content: `
### Conventional Commit Format
\`\`\`text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
\`\`\`

#### Allowed Commit Types
* **\`feat\`**: A new feature for the user (bumps MINOR version: \`v1.1.0\`).
* **\`fix\`**: A bug fix for the user (bumps PATCH version: \`v1.0.1\`).
* **\`docs\`**: Documentation changes only.
* **\`style\`**: Code formatting, missing semi-colons (no code logic change).
* **\`refactor\`**: Code change that neither fixes a bug nor adds a feature.
* **\`perf\`**: Performance optimization.
* **\`test\`**: Adding or correcting unit/integration tests.
* **\`chore\`**: Build script, package dependency, or config updates.

#### Breaking Changes
Adding \`!\` after type/scope or adding \`BREAKING CHANGE:\` in footer bumps MAJOR version (\`v2.0.0\`).

\`\`\`text
feat(api)!: drop support for v1 authentication endpoints
\`\`\`
        `,
        commands: [
          { cmd: "git commit -m \"feat(auth): implement Google OAuth2 SSO flow\"", desc: "Standard Conventional Commit" },
          { cmd: "git commit -m \"fix(payment): resolve currency rounding bug\"", desc: "Bug fix commit" }
        ],
        proTip: "Integrate `@commitlint/cli` and `husky` to reject non-conventional commit messages at the git hook layer!",
        productionUse: "Enables tools like standard-version or release-please to automatically parse commit history and generate `CHANGELOG.md` and npm/GitHub releases."
      },
      {
        id: "git-hooks-husky",
        title: "Git Hooks & Husky Automation",
        summary: "Automating linting, formatting, security scanning, and commit validation before code hits remote.",
        content: `
### What are Git Hooks?
Git hooks are scripts executed automatically when specific Git events occur (e.g. before commit, before push, commit message check).
Located in \`.git/hooks/\`.

#### Key Client-Side Hooks
1. **\`pre-commit\`**: Runs linters (ESLint, Prettier), security scanners (Gitleaks), and unit tests. If script exits with non-zero code, commit is blocked!
2. **\`commit-msg\`**: Validates commit message against Conventional Commit rules.
3. **\`pre-push\`**: Runs full integration test suite before pushing to remote repository.

#### Husky + lint-staged in Node.js
Husky allows sharing git hooks across team members via source control.

\`\`\`json
// package.json with lint-staged
"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.json": ["prettier --write"]
}
\`\`\`
        `,
        commands: [
          { cmd: "npx husky init", desc: "Set up Husky git hooks in a JavaScript project" },
          { cmd: "echo \"npx lint-staged\" > .husky/pre-commit", desc: "Add pre-commit hook rule" },
          { cmd: "git commit -m \"test\" --no-verify", desc: "Bypass git hooks in extreme emergencies (-n)" }
        ],
        proTip: "Use `lint-staged` to ONLY lint modified/staged files, keeping pre-commit checks fast (<2 seconds) even on giant repositories!",
        productionUse: "Prevents broken code, unformatted syntax, or leaked AWS secrets from ever entering your team's Git history."
      },
      {
        id: "git-config-hacks",
        title: "Enterprise .gitconfig Setup",
        summary: "Power user aliases, rerere, global defaults, and security configurations.",
        content: `
### Ultimate Production .gitconfig Template
Add these configuration blocks to your \`~/.gitconfig\` file to maximize CLI speed and safety:

\`\`\`ini
[user]
    name = Your Name
    email = your.email@company.com
    signingkey = ~/.ssh/id_ed25519.pub

[core]
    autocrlf = input # Use 'input' on Mac/Linux, 'true' on Windows
    editor = code --wait
    excludesfile = ~/.gitignore_global

[pull]
    rebase = true

[rebase]
    autoStash = true
    autoSquash = true

[rerere]
    enabled = true

[init]
    defaultBranch = main

[alias]
    st = status -s
    co = checkout
    sw = switch
    br = branch
    lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
    amend = commit --amend --no-edit
    discard = checkout -- .
\`\`\`
        `,
        commands: [
          { cmd: "git config --global --list", desc: "List all active global git configurations" },
          { cmd: "git config --global alias.undo \"reset --soft HEAD~1\"", desc: "Set quick global undo alias" }
        ],
        proTip: "Set `rebase.autoStash = true` globally so Git automatically stashes your uncommitted changes before rebasing and pops them after!",
        productionUse: "Enforce GPG or SSH commit signing (`commit.gpgsign = true`) in enterprise environments so attackers cannot forge commit author signatures."
      }
    ]
  }
];

export const gitScenarios = [
  {
    id: "scenario-1",
    title: "Scenario 1: Leaked API Secret Key Emergency",
    difficulty: "Advanced",
    category: "Security & History",
    problem: "You accidentally committed `.env` containing `AWS_SECRET_ACCESS_KEY` 3 commits ago and pushed to origin. You need to purge the secret from Git history without deleting local files.",
    steps: [
      "1. Add `.env` to `.gitignore` so it isn't tracked again.",
      "2. Run `git rm --cached .env` to untrack it while preserving local file.",
      "3. Perform `git rebase -i HEAD~4` or use `git-filter-repo` / BFG Repo-Cleaner to strip secret from historical commits.",
      "4. Force push safely using `git push origin main --force-with-lease`.",
      "5. MANDATORY: Immediately rotate the compromised AWS key in AWS IAM Console!"
    ],
    goldenRule: "Force push with `--force-with-lease` instead of plain `--force` to ensure you don't overwrite teammates' work!"
  },
  {
    id: "scenario-2",
    title: "Scenario 2: Accidental 'git reset --hard' Recovery",
    difficulty: "Intermediate",
    category: "Disaster Recovery",
    problem: "You executed `git reset --hard HEAD~2` and lost two days of committed feature work. You need to restore the lost commits immediately.",
    steps: [
      "1. Run `git reflog` to view recent local HEAD actions.",
      "2. Locate the commit hash or reflog position (e.g. `HEAD@{1}`) right before the reset.",
      "3. Run `git reset --hard HEAD@{1}` or create a recovery branch: `git branch recovery-branch HEAD@{1}`.",
      "4. Verify all files and commit history are completely restored!"
    ],
    goldenRule: "Git reflog retains local commit actions for 90 days. As long as you committed your work, it is almost impossible to lose!"
  },
  {
    id: "scenario-3",
    title: "Scenario 3: PR Cleanup - 10 Messy Commits to 1 Conventional Commit",
    difficulty: "Intermediate",
    category: "Code Review",
    problem: "Your feature branch has 10 messy commits like 'wip', 'fix typo', 'working now'. Your tech lead requested 1 clean Conventional Commit before merging.",
    steps: [
      "1. Ensure working directory is clean (`git status`).",
      "2. Option A (Soft Reset): Run `git reset --soft main`, then `git commit -m \"feat(payment): add Stripe webhook handler\"`.",
      "3. Option B (Interactive Rebase): Run `git rebase -i main`, set top commit to `pick` and remaining 9 commits to `squash` or `fixup`.",
      "4. Push updated clean history: `git push origin feature/stripe-webhook --force-with-lease`."
    ],
    goldenRule: "Soft reset to main is the fastest way to squash ALL commits on a feature branch into a single fresh commit!"
  },
  {
    id: "scenario-4",
    title: "Scenario 4: Production Bug Triage with Git Bisect",
    difficulty: "Advanced",
    category: "Debugging",
    problem: "A critical bug exists in `main`. The app worked fine on version `v2.4.0` (120 commits ago), but is broken now. Find the breaking commit.",
    steps: [
      "1. Run `git bisect start`",
      "2. Run `git bisect bad` (current HEAD is broken)",
      "3. Run `git bisect good v2.4.0` (known good release tag)",
      "4. Test each checkout Git presents and mark `git bisect good` or `git bisect bad`.",
      "5. Once isolated, inspect author and diff. Run `git bisect reset` when done."
    ],
    goldenRule: "Automate bisect with `git bisect run npm test` to let Git test and isolate the exact bad commit autonomously."
  }
];

export const cheatSheetCategories = [
  {
    category: "Essential Daily Commands",
    items: [
      { cmd: "git init", desc: "Initialize a new local repository" },
      { cmd: "git clone <url>", desc: "Clone a remote repository" },
      { cmd: "git status -s", desc: "Short status summary of modified/staged files" },
      { cmd: "git add .", desc: "Stage all modified and new files" },
      { cmd: "git commit -m \"<msg>\"", desc: "Commit staged changes with message" },
      { cmd: "git push origin <branch>", desc: "Push local commits to remote branch" },
      { cmd: "git pull --rebase origin <branch>", desc: "Fetch remote commits and rebase local commits on top" }
    ]
  },
  {
    category: "Branching & Switching",
    items: [
      { cmd: "git branch", desc: "List local branches (* indicates current branch)" },
      { cmd: "git switch <branch>", desc: "Switch to target branch" },
      { cmd: "git switch -c <new-branch>", desc: "Create and switch to new branch" },
      { cmd: "git branch -d <branch>", desc: "Safely delete merged branch" },
      { cmd: "git branch -m <old> <new>", desc: "Rename branch" }
    ]
  },
  {
    category: "History Surgery & Undo",
    items: [
      { cmd: "git commit --amend --no-edit", desc: "Add staged files to previous commit without changing message" },
      { cmd: "git reset --soft HEAD~1", desc: "Undo last commit; keep files staged" },
      { cmd: "git reset --mixed HEAD~1", desc: "Undo last commit; unstage files to working dir" },
      { cmd: "git reset --hard HEAD~1", desc: "Wipe last commit and discard all uncommitted changes" },
      { cmd: "git revert <commit-hash>", desc: "Safely create inverse commit for pushed history" },
      { cmd: "git rebase -i HEAD~n", desc: "Interactively edit, squash, reword, or drop last n commits" },
      { cmd: "git cherry-pick <hash>", desc: "Apply single commit patch from another branch" }
    ]
  },
  {
    category: "Rescue & Emergency Toolkit",
    items: [
      { cmd: "git reflog", desc: "Show complete audit trail of local HEAD movements (safety net)" },
      { cmd: "git stash push -u -m \"<msg>\"", desc: "Stash working dir and untracked files with message" },
      { cmd: "git stash pop", desc: "Apply and remove top stash from stack" },
      { cmd: "git bisect start / bad / good", desc: "Binary search history to find regression commit" },
      { cmd: "git push origin <branch> --force-with-lease", desc: "Safe force push (aborts if remote has updates you lack)" },
      { cmd: "git check-ignore -v <filepath>", desc: "Debug why file is ignored by .gitignore" }
    ]
  }
];
