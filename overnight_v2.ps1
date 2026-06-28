param(
    [string]$BaseDir = "C:\Users\Admin\AppData\Local\Temp\opencode",
    [long]$TargetMin = 10GB,
    [long]$TargetMax = 12GB,
    [int]$MaxParallel = 8
)

$ErrorActionPreference = "Continue"
$Token = $env:GH_TOKEN
$RepoDir = "$BaseDir\overnight_gh"
$LogFile = "$BaseDir\overnight_log.txt"
$RepoJson = "$BaseDir\github_repos_found.json"
$SearchScript = "$BaseDir\search_github_repos.py"
$ClonedList = "$BaseDir\cloned_repos.txt"
$FailedList = "$BaseDir\failed_repos.txt"

foreach ($d in @($RepoDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

function Log { param($m) $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts - $m" | Out-File $LogFile -Append; Write-Host "$ts - $m" }

function Get-Size { 
    param($p)
    if (-not (Test-Path $p)) { return 0 }
    return (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
}

Log "=== OVERNIGHT v2 - MARKETING DATASET COLLECTOR ==="
Log "Target: $([math]::Round($TargetMin/1GB,1))GB - $([math]::Round($TargetMax/1GB,1))GB"
Log "Quality filter: ON | Parallel clones: $MaxParallel"

# Load previously cloned/failed
$cloned = @{}
if (Test-Path $ClonedList) { Get-Content $ClonedList -EA 0 | Where-Object {$_ -match '^https?://'} | ForEach-Object { $cloned[$_.Trim()] = $true } }
$failed = @{}
if (Test-Path $FailedList) { Get-Content $FailedList -EA 0 | Where-Object {$_ -match '^https?://'} | ForEach-Object { $failed[$_.Trim()] = $true } }
Log "Previously: $($cloned.Count) cloned, $($failed.Count) failed"

# Phase 1: Search GitHub repos (via Python)
if (-not (Test-Path $RepoJson)) {
    Log "No repo list found. Running Python search..."
    $searchProc = Start-Process -FilePath python -ArgumentList "`"$SearchScript`"" -WindowStyle Hidden -PassThru -NoNewWindow
    $searchProc.WaitForExit()
    Log "Python search exited (code: $($searchProc.ExitCode))"
}

if (Test-Path $RepoJson) {
    $allRepos = Get-Content $RepoJson | ConvertFrom-Json
    Log "Loaded $($allRepos.Count) repos from search results"
} else {
    Log "ERROR: No repo list! Using fallback search..."
    $allRepos = @()
    foreach ($topic in @("marketing","digital-marketing","seo","content-marketing","email-marketing")) {
        try {
            $url = "https://api.github.com/search/repositories?q=topic:$topic&per_page=100&sort=stars&order=desc"
            $resp = curl.exe -s --connect-timeout 10 --max-time 20 -H "Authorization: token $Token" $url
            $json = $resp | ConvertFrom-Json
            if ($json.items) { foreach ($item in $json.items) { $allRepos += [PSCustomObject]@{name=$item.full_name;stars=[int]$item.stargazers_count;clone_url=$item.clone_url} } }
        } catch {}
    }
    Log "Fallback found $($allRepos.Count) repos"
}

# Remove already cloned/failed
$toClone = @()
$dedup = @{}
foreach ($repo in $allRepos) {
    $url = $repo.clone_url
    if (-not $cloned.ContainsKey($url) -and -not $failed.ContainsKey($url) -and -not $dedup.ContainsKey($url)) {
        $dedup[$url] = $true
        $toClone += $repo
    }
}

$toClone = $toClone | Sort-Object -Property stars -Descending
$startTime = Get-Date

if ($toClone.Count -eq 0) {
    Log "ERROR: No repos to clone (all done or failed)"
    exit 1
}

Log "Repos to clone: $($toClone.Count)"

# Phase 2: Clone repos
$cloneScriptBlock = {
    param($Url, $Dest, $Token)
    $r = @{url=$Url; ok=$false; size=0; kept=0; removed=0}
    try {
        $authUrl = $Url -replace 'https://', "https://goalgetter53:${Token}@"
        if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest -EA 0 }
        $env:GIT_PAGER = 'cat'
        $output = & git -c http.lowSpeedLimit=500 -c http.lowSpeedTime=60 clone --depth 1 --single-branch $authUrl $Dest 2>&1
        if ($LASTEXITCODE -eq 0 -and (Test-Path $Dest)) {
            $totalFiles = @(Get-ChildItem $Dest -Recurse -File -EA 0).Count
            # Filter junk
            foreach ($dd in @('node_modules','vendor','bower_components','__pycache__','.git','dist','build','target','bin','obj','coverage','.next','.nuxt','out','.venv','venv','env','.eggs','.mypy_cache','.gradle','Pods')) {
                Get-ChildItem $Dest -Directory -EA 0 -Filter $dd -Recurse -Depth 3 | Remove-Item -Recurse -Force -EA 0
            }
            foreach ($ext in @('*.exe','*.dll','*.so','*.pyc','*.pyo','*.class','*.jar','*.war','*.zip','*.tar','*.tar.gz','*.tgz','*.rar','*.7z','*.bz2','*.gz','*.xz','*.png','*.jpg','*.jpeg','*.gif','*.bmp','*.ico','*.webp','*.mp4','*.avi','*.mov','*.mkv','*.mp3','*.wav','*.flac','*.ogg','*.woff','*.woff2','*.ttf','*.eot','*.otf','*.psd','*.ai','*.sketch','*.fig','*.xd','package-lock.json','yarn.lock','Gemfile.lock','Cargo.lock','go.sum','*.min.js','*.min.css')) {
                Get-ChildItem $Dest -Filter $ext -File -EA 0 -Recurse | Remove-Item -Force -EA 0
            }
            $size = (Get-ChildItem $Dest -Recurse -File -EA 0 | Measure-Object Length -Sum).Sum
            $kept = @(Get-ChildItem $Dest -Recurse -File -EA 0).Count
            $r.ok = $true; $r.size = [long]$size; $r.kept = $kept; $r.removed = $totalFiles - $kept
        }
    } catch { $r.error = $_.Message }
    return $r
}

Log "=== Clone Engine Starting ==="
$jobs = @{}
$idx = 0
$lastCheck = Get-Date

while (($idx -lt $toClone.Count -or $jobs.Count -gt 0) -and (Get-Size $RepoDir) -lt $TargetMax) {
    while ($jobs.Count -lt $MaxParallel -and $idx -lt $toClone.Count -and (Get-Size $RepoDir) -lt $TargetMax) {
        $repo = $toClone[$idx]
        $idx++
        $safe = ($repo.name -replace '[^\w\-\.]', '_')
        if ($safe.Length -gt 120) { $safe = $safe.Substring(0,120) }
        $dest = "$RepoDir\$safe"
        if (Test-Path $dest) {
            $sz = (Get-ChildItem $dest -Recurse -File -EA 0 | Measure-Object Length -Sum).Sum
            if ($sz -gt 0) { $cloned[$repo.clone_url] = $true; $repo.clone_url | Out-File $ClonedList -Append; continue }
        }
        $j = Start-Job -ScriptBlock $cloneScriptBlock -ArgumentList @($repo.clone_url, $dest, $Token)
        if ($j) { $jobs[$j.Id] = @{job=$j; url=$repo.clone_url; name=$repo.name; start=Get-Date} }
    }

    $done = @()
    foreach ($id in $jobs.Keys) {
        $j = $jobs[$id]
        if ($j.job.State -eq 'Completed') {
            $r = Receive-Job $j.job -EA 0
            Remove-Job $j.job -Force -EA 0
            if ($r.ok -and $r.size -gt 0) {
                $cloned[$r.url] = $true; $r.url | Out-File $ClonedList -Append
                Log "OK $($j.name) $([math]::Round($r.size/1MB,1))MB (kept $($r.kept), removed $($r.removed))"
            } else {
                $failed[$j.url] = $true; $j.url | Out-File $FailedList -Append
                $why = if ($r.ok) { "empty" } else { $r.error }
                Log "SK $($j.name): $why"
            }
            $done += $id
        } elseif ($j.job.State -eq 'Failed' -or ((Get-Date)-$j.start).TotalMinutes -gt 10) {
            if ($j.job.State -ne 'Failed') { Stop-Job $j.job -EA 0 }
            Remove-Job $j.job -Force -EA 0
            $failed[$j.url] = $true; $j.url | Out-File $FailedList -Append
            Log "FL $($j.name)"
            $done += $id
        }
    }
    foreach ($id in $done) { $jobs.Remove($id) }

    $now = Get-Date
    if (($now - $lastCheck).TotalSeconds -ge 60) {
        $sz = Get-Size $RepoDir
        $elapsed = [Math]::Max(1, ($now - $startTime).TotalSeconds)
        $sizeGB = [math]::Round($sz/1GB, 2)
        $pct = [math]::Round($sz/$TargetMin*100, 1)
        $rate = [math]::Round(($sz/1MB)/$elapsed, 2)
        Log "PROG ${sizeGB}GB/${pct}% ${rate}MB/s jobs=$($jobs.Count) q=$($toClone.Count-$idx) ok=$($cloned.Count) skip=$($failed.Count)"
        $lastCheck = $now
    }

    Start-Sleep -Seconds 3
}

$fs = Get-Size $RepoDir
$tt = (Get-Date) - $startTime
Log "========================================"
Log "DONE: $([math]::Round($fs/1GB,2))GB in $([math]::Round($tt.TotalHours,2))h"
Log "Cloned: $($cloned.Count) | Failed: $($failed.Count)"
Log "========================================"

# Save results for GitHub push
@{size=$fs; repos=$cloned.Count; hours=[math]::Round($tt.TotalHours,2)} | ConvertTo-Json | Out-File "$BaseDir\overnight_summary.json"
