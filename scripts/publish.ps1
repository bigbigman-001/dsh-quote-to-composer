<#
publish.ps1 - push this plugin to a fresh GitHub repository in one go.

Usage (from anywhere):

  powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -GitHubUser <your-github-username>

What it does:
  1. writes repository / homepage / bugs into package.json (needed for the npm link later)
  2. git init -b main (if this folder is not a repo yet)
  3. git add -A + git commit
  4. git remote add|set-url origin https://github.com/<user>/<repo>.git
  5. git push -u origin main

It does NOT create the repository on GitHub: create an empty public repo with the same
name first (https://github.com/new, do not add README/.gitignore/license).

Options:
  -RepoName <name>   default: dsh-quote-to-composer
  -Branch <name>     default: main
  -SkipPush          do everything except the push
  -DryRun            print the steps, change nothing
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$GitHubUser,
    [string]$RepoName = 'dsh-quote-to-composer',
    [string]$Branch = 'main',
    [switch]$SkipPush,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Fail([string]$Message) {
    Write-Host ''
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Step([string]$Message) {
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

# --- validate arguments -------------------------------------------------------
if ($GitHubUser -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$') {
    Fail "GitHubUser '$GitHubUser' does not look like a GitHub username (letters, digits, single hyphens)."
}
if ($RepoName -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
    Fail "RepoName '$RepoName' is not a valid repository name (letters, digits, dot, dash, underscore)."
}

$pluginRoot = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $pluginRoot 'package.json'
if (-not (Test-Path -LiteralPath $manifest)) {
    Fail "package.json not found at $manifest (is this script still inside <plugin>/scripts/?)"
}
if (-not (Test-Path -LiteralPath (Join-Path $pluginRoot 'cordis.patch.yml'))) {
    Fail "cordis.patch.yml not found in $pluginRoot - the plugin cannot be installed without it."
}

$repoUrl = "https://github.com/$GitHubUser/$RepoName"
$gitUrl = "$repoUrl.git"

Step "plugin:  $pluginRoot"
Step "repo:    $repoUrl"

foreach ($tool in @('git', 'node')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Fail "'$tool' is not on PATH. Install it first (git: https://git-scm.com/download/win, node: https://nodejs.org)."
    }
}

# --- patch package.json -------------------------------------------------------
Step 'writing repository / homepage / bugs into package.json'
if ($DryRun) {
    Write-Host '  (dry run - package.json will be left untouched)'
}
$patchScript = @'
const fs = require('fs');
const [file, url] = process.argv.slice(1);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.repository = { type: 'git', url: url + '.git' };
pkg.homepage = url + '#readme';
pkg.bugs = { url: url + '/issues' };
if (pkg.private === true) delete pkg.private;
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('  repository -> ' + pkg.repository.url);
'@

if ($DryRun) {
    Write-Host "  [dry-run] node -e <patch package.json> -- '$manifest' '$repoUrl'"
}
else {
    $patchOutput = & node -e $patchScript $manifest $repoUrl 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "patching package.json failed: $patchOutput" }
    $patchOutput | ForEach-Object { Write-Host "  $_" }
    $version = (& node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).version)" $manifest 2>$null)
    if ($LASTEXITCODE -ne 0) { Fail 'could not read the version back from package.json' }
}

# --- git ----------------------------------------------------------------------
Step 'preparing the git repository'
Push-Location -LiteralPath $pluginRoot
try {
    $inside = $null
    try { $inside = (& git rev-parse --is-inside-work-tree 2>$null) } catch { $inside = $null }
    if ($DryRun) {
        Write-Host "  [dry-run] git init -b $Branch (only if not a repo yet)"
    }
    elseif ($inside -ne 'true') {
        & git init -b $Branch
        if ($LASTEXITCODE -ne 0) { Fail 'git init failed' }
        Write-Host "  initialised a new repository on branch $Branch"
    }
    else {
        Write-Host "  already a git repository: $((& git rev-parse --show-toplevel).Trim())"
    }

    if ($DryRun) {
        Write-Host '  [dry-run] git add -A'
    }
    else {
        & git add -A
        if ($LASTEXITCODE -ne 0) { Fail 'git add failed' }
    }

    $identityName = $null
    $identityMail = $null
    try { $identityName = (& git config user.name 2>$null) } catch { $identityName = $null }
    try { $identityMail = (& git config user.email 2>$null) } catch { $identityMail = $null }
    if ($DryRun) {
        Write-Host '  [dry-run] git config user.name / user.email (only if unset)'
    }
    elseif ([string]::IsNullOrWhiteSpace($identityName) -or [string]::IsNullOrWhiteSpace($identityMail)) {
        & git config user.name $GitHubUser
        & git config user.email "$GitHubUser@users.noreply.github.com"
        if ($LASTEXITCODE -ne 0) { Fail 'could not set git user.name / user.email for this repository' }
        Write-Host "  set repository-local git identity: $GitHubUser <$GitHubUser@users.noreply.github.com>"
        Write-Host '  (change it any time with: git config --global user.name "..." ; git config --global user.email "...")'
    }

    $pending = if ($DryRun) { 'dry-run' } else { (& git status --porcelain) }
    if ($DryRun) {
        Write-Host "  [dry-run] git commit -m 'feat: <version>'"
    }
    elseif ([string]::IsNullOrWhiteSpace($pending)) {
        Write-Host '  nothing to commit - working tree already clean'
    }
    else {
        $message = if ($version) { "feat: v$version" } else { 'feat: initial commit' }
        & git commit -m $message
        if ($LASTEXITCODE -ne 0) { Fail 'git commit failed (set user.name / user.email first: git config --global user.name "..." )' }
    }

    $existingRemote = $null
    try { $existingRemote = (& git remote get-url origin 2>$null) } catch { $existingRemote = $null }
    if ($DryRun) {
        Write-Host "  [dry-run] git remote add origin $gitUrl   (or set-url if origin exists)"
    }
    elseif ($existingRemote) {
        & git remote set-url origin $gitUrl
        if ($LASTEXITCODE -ne 0) { Fail 'git remote set-url failed' }
        Write-Host "  origin -> $gitUrl"
    }
    else {
        & git remote add origin $gitUrl
        if ($LASTEXITCODE -ne 0) { Fail 'git remote add failed' }
        Write-Host "  origin -> $gitUrl"
    }

    if ($SkipPush) {
        Step 'skip-push requested - stopping before git push'
    }
    elseif ($DryRun) {
        Write-Host "  [dry-run] git push -u origin $Branch"
    }
    else {
        Step 'pushing to GitHub (a browser window may open and ask you to sign in)'

        # This machine may have a global git url rewrite (e.g. a ghfast.top mirror used
        # for cloning). Such mirrors are usually read-only, so the push is attempted with
        # the global config swapped for a throw-away one *for this single command only*:
        # the real ~/.gitconfig is never modified. If that direct push fails, retry with
        # the normal config (through the mirror).
        $rewriteKey = $null
        $rewriteValue = $null
        try {
            $rewriteLines = & git config --global --get-regexp '^url\..*\.insteadof$' 2>$null
            foreach ($line in $rewriteLines) {
                $parts = $line -split '\s+', 2
                if ($parts.Count -eq 2 -and $parts[1].Trim() -eq 'https://github.com/') {
                    $rewriteKey = $parts[0].Trim()
                    $rewriteValue = $parts[1].Trim()
                    break
                }
            }
        }
        catch { $rewriteKey = $null }

        $pushed = $false
        $sandboxConfig = $null
        $previousGlobal = $env:GIT_CONFIG_GLOBAL
        $proxyArgs = @()

        # git does not read the Windows proxy settings, so a machine that reaches
        # GitHub only through its system proxy would fail on the direct attempt.
        try {
            $inet = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction Stop
            if ($inet.ProxyEnable -eq 1 -and -not [string]::IsNullOrWhiteSpace($inet.ProxyServer)) {
                $proxy = ([string]$inet.ProxyServer).Split(';')[0].Trim()
                if ($proxy -match '=') { $proxy = $proxy.Split('=')[-1] }
                if ($proxy -notmatch '^[a-z]+://') { $proxy = 'http://' + $proxy }
                if ($proxy -match '^https?://[^/]+:\d+$') {
                    $proxyArgs = @('-c', "http.proxy=$proxy")
                    Write-Host "  using the system proxy for git: $proxy"
                }
            }
        }
        catch { $proxyArgs = @() }

        try {
            if ($rewriteKey) {
                Write-Host "  mirror rewrite detected ($rewriteKey) - trying a direct connection first"
                $sandboxConfig = Join-Path ([System.IO.Path]::GetTempPath()) ("dqc-gitconfig-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
                # system config stays in effect, so the credential helper still works.
                # an empty file (no BOM) hides the global rewrite without touching it
                New-Item -ItemType File -Path $sandboxConfig -Force | Out-Null
                $env:GIT_CONFIG_GLOBAL = $sandboxConfig
            }

            & git @proxyArgs push -u origin $Branch
            if ($LASTEXITCODE -eq 0) { $pushed = $true }
            elseif ($rewriteKey) {
                $env:GIT_CONFIG_GLOBAL = $previousGlobal
                if ([string]::IsNullOrEmpty($previousGlobal)) { Remove-Item Env:\GIT_CONFIG_GLOBAL -ErrorAction SilentlyContinue }
                Write-Host '  direct push failed - retrying through the configured mirror' -ForegroundColor Yellow
                & git push -u origin $Branch
                if ($LASTEXITCODE -eq 0) { $pushed = $true }
            }
        }
        finally {
            if ([string]::IsNullOrEmpty($previousGlobal)) { Remove-Item Env:\GIT_CONFIG_GLOBAL -ErrorAction SilentlyContinue }
            else { $env:GIT_CONFIG_GLOBAL = $previousGlobal }
            if ($sandboxConfig) { Remove-Item -LiteralPath $sandboxConfig -Force -ErrorAction SilentlyContinue }
        }

        if (-not $pushed) {
            $hintKey = 'url.<mirror>.insteadof'
            if ($rewriteKey) { $hintKey = $rewriteKey }
            Fail "git push failed. Check that $repoUrl exists, is public and empty, and that you can sign in to GitHub. A global url.<mirror>.insteadOf rewrite can also block pushes; you can bypass it for one command with: `$env:GIT_CONFIG_GLOBAL='' ; git push   (or remove it: git config --global --unset $hintKey)"
        }
        Write-Host "  pushed: $repoUrl" -ForegroundColor Green
    }
}
finally {
    Pop-Location
}

if ($DryRun) {
    Write-Host ''
    Write-Host 'Dry run finished - nothing was changed.' -ForegroundColor Yellow
    exit 0
}

# --- what is left -------------------------------------------------------------
Write-Host ''
Write-Host 'Done. Remaining steps (manual, GitHub web UI):' -ForegroundColor Green
Write-Host "  1. add the topic 'dsh-plugin'  -> $repoUrl  (About > gear > Topics)"
Write-Host '  2. wait until the repository is 24 hours old (CI requirement)'
Write-Host '  3. fork https://github.com/awesome-dsh-plugin/awesome-dsh-plugin'
Write-Host "     add data/plugins/$($GitHubUser)__$RepoName.yml with:"
Write-Host "       url: $repoUrl"
Write-Host "       name: $GitHubUser/$RepoName"
Write-Host '       category: ui'
Write-Host '       description: { en: ..., zh: ... }   (template: docs/awesome-dsh-plugin-entry.yml)'
Write-Host '     then open the pull request.'
Write-Host ''
Write-Host "  4. install from GitHub:  dsh plugin --profile desktop add github:$GitHubUser/$RepoName"
Write-Host '  5. optional (npm):       npm login ; npm publish'
Write-Host ''
Write-Host "Full walkthrough: $([System.IO.Path]::Combine($pluginRoot, 'docs', 'PUBLISH.md'))"
