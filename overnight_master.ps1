param(
    [string]$BaseDir = "C:\Users\Admin\AppData\Local\Temp\opencode",
    [long]$TargetMin = 10GB,
    [long]$TargetMax = 12GB,
    [int]$MaxParallel = 8
)

$ErrorActionPreference = "Continue"
$Token = "GITHUB_TOKEN_HERE"
$RepoDir = "$BaseDir\overnight_gh"
$WikiDir = "$BaseDir\overnight_wiki"
$WikiTemp = "$BaseDir\wiki_temp"
$LogFile = "$BaseDir\overnight_log.txt"

foreach ($d in @($RepoDir, $WikiDir, $WikiTemp)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

$ClonedList = "$BaseDir\cloned_repos.txt"
$FailedList = "$BaseDir\failed_repos.txt"

function Log {
    param($Msg)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts - $Msg" | Out-File -FilePath $LogFile -Append
    Write-Host "$ts - $Msg"
}

function Get-DirSize {
    param($Path)
    if (-not (Test-Path $Path)) { return 0 }
    return (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
}

function Get-TotalSize {
    return (Get-DirSize $RepoDir) + (Get-DirSize $WikiDir)
}

function Invoke-GitHubAPI {
    param($Url, $MaxRetries=3)
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        try {
            $resp = curl.exe -s --connect-timeout 15 --max-time 30 -D "$env:TEMP\gh_headers.txt" -H "Authorization: token $Token" $Url
            if ($LASTEXITCODE -ne 0) { throw "curl exit code $LASTEXITCODE" }
            $headers = Get-Content "$env:TEMP\gh_headers.txt" -ErrorAction SilentlyContinue
            $rateRemaining = ($headers | Select-String -Pattern "X-RateLimit-Remaining" -SimpleMatch) -replace '.*: '
            if ($rateRemaining -eq '0') {
                $resetTime = ($headers | Select-String -Pattern "X-RateLimit-Reset" -SimpleMatch) -replace '.*: '
                if ($resetTime) {
                    $waitSecs = [int]$resetTime - [int](Get-Date -UFormat %s) + 1
                    if ($waitSecs -gt 0 -and $waitSecs -lt 3600) {
                        Log "Rate limited! Waiting $waitSecs seconds..."
                        Start-Sleep -Seconds $waitSecs
                        continue
                    }
                }
            }
            return $resp
        } catch {
            if ($i -lt $MaxRetries - 1) {
                $wait = [Math]::Pow(2, $i) * 5
                Log "API error retry $($i+1): $_ waiting ${wait}s"
                Start-Sleep -Seconds $wait
            } else {
                Log "API failed after $MaxRetries retries: $_"
                return $null
            }
        }
    }
}

Log "=== OVERNIGHT MARKETING DATASET COLLECTOR ==="
Log "Target: $([math]::Round($TargetMin/1GB,1))GB - $([math]::Round($TargetMax/1GB,1))GB"
Log "Quality filter ON: removing binaries, media, archives, deps"
Log "GitHub clone dir: $RepoDir"
Log "Parallel clones: $MaxParallel"

$clonedUrls = @{}
if (Test-Path $ClonedList) {
    Get-Content $ClonedList -ErrorAction SilentlyContinue | Where-Object { $_ -match '^https?://' } | ForEach-Object {
        $clonedUrls[$_.Trim()] = $true
    }
}
Log "Already cloned: $($clonedUrls.Count)"

$failedUrls = @{}
if (Test-Path $FailedList) {
    Get-Content $FailedList -ErrorAction SilentlyContinue | Where-Object { $_ -match '^https?://' } | ForEach-Object {
        $failedUrls[$_.Trim()] = $true
    }
}
Log "Previously failed: $($failedUrls.Count)"

$topics = @(
    "marketing", "digital-marketing", "seo", "content-marketing",
    "growth-hacking", "social-media-marketing", "email-marketing",
    "copywriting", "affiliate-marketing", "branding",
    "conversion-optimization", "marketing-analytics",
    "advertising", "ppc", "marketing-automation", "crm",
    "lead-generation", "saas-marketing", "ecommerce-marketing",
    "video-marketing", "influencer-marketing", "newsletter",
    "product-marketing", "market-research",
    "b2b-marketing", "content-strategy", "brand-strategy",
    "growth-marketing", "community-management", "data-analytics",
    "customer-success", "google-ads", "facebook-ads",
    "instagram-marketing", "tiktok-marketing", "linkedin-marketing",
    "youtube-marketing", "ai-marketing", "chatgpt-marketing"
)

Log "Phase 1: Searching GitHub repos across $($topics.Count) topics..."
$startSearch = Get-Date
$allRepos = @{}
$totalApi = 0

foreach ($topic in $topics) {
    $page = 1
    do {
        $url = "https://api.github.com/search/repositories?q=topic:$topic&per_page=100&page=$page&sort=stars&order=desc"
        $resp = Invoke-GitHubAPI -Url $url
        $totalApi++
        if (-not $resp) { break }
        try { $json = $resp | ConvertFrom-Json } catch { break }
        if (-not $json -or -not $json.items -or $json.items.Count -eq 0) { break }
        foreach ($item in $json.items) {
            $cu = $item.clone_url
            if (-not $allRepos.ContainsKey($cu)) {
                $allRepos[$cu] = @{
                    name = $item.full_name
                    stars = [int]$item.stargazers_count
                    clone_url = $cu
                }
            }
        }
        if ($json.items.Count -lt 100) { break }
        $page++
        Start-Sleep -Milliseconds 100
    } while ($page -le 10)
    if ($totalApi % 20 -eq 0) {
        $searchTime = [math]::Round(((Get-Date) - $startSearch).TotalMinutes, 1)
        Log "Search progress: $($allRepos.Count) unique repos after $totalApi API calls ($searchTime min)"
    }
}

$searchTime = [math]::Round(((Get-Date) - $startSearch).TotalMinutes, 1)
Log "Search complete: $($allRepos.Count) unique repos in $searchTime min ($totalApi API calls)"

$toClone = @{}
foreach ($kv in $allRepos.GetEnumerator()) {
    $url = $kv.Key
    if (-not $clonedUrls.ContainsKey($url) -and -not $failedUrls.ContainsKey($url)) {
        $toClone[$url] = $kv.Value
    }
}
$sortedRepos = $toClone.Values | Sort-Object -Property stars -Descending
Log "Repos to clone: $($sortedRepos.Count)"

if ($sortedRepos.Count -eq 0) { Log "WARNING: No new repos to clone!" }

$cloneScriptBlock = {
    param($CloneUrl, $DestDir, $Token, $RepoName)
    $result = @{ url = $CloneUrl; success = $false; size = 0; error = ''; kept = 0; removed = 0 }
    try {
        $authUrl = $CloneUrl -replace 'https://', "https://goalgetter53:${Token}@"
        if (Test-Path $DestDir) { try { Remove-Item -Recurse -Force $DestDir -ErrorAction Stop } catch {} }
        $env:GIT_PAGER = 'cat'
        $env:PAGER = 'cat'
        $output = & git -c http.lowSpeedLimit=500 -c http.lowSpeedTime=60 clone --depth 1 --single-branch $authUrl $DestDir 2>&1
        $exit = $LASTEXITCODE
        if ($exit -eq 0 -and (Test-Path $DestDir)) {
            $before = (Get-ChildItem -Path $DestDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            $totalFiles = @(Get-ChildItem -Path $DestDir -Recurse -File -ErrorAction SilentlyContinue).Count
            foreach ($delDir in @('node_modules','vendor','bower_components','__pycache__','.git','dist','build','target','bin','obj','coverage','.next','.nuxt','out','.venv','venv','env','.eggs','.mypy_cache','.pytest_cache','.tox','.sass-cache','.gradle','CMakeFiles','.serverless','.terraform','Pods','.dart_tool','.packages','.gitattributes')) {
                Get-ChildItem -Path $DestDir -Directory -ErrorAction SilentlyContinue -Filter $delDir -Recurse -Depth 4 | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            }
            $removeExts = @('*.exe','*.dll','*.so','*.dylib','*.pyc','*.pyo','*.class','*.jar','*.war','*.ear','*.nupkg','*.msi','*.zip','*.tar','*.tar.gz','*.tgz','*.rar','*.7z','*.bz2','*.gz','*.xz','*.zst','*.lz4','*.png','*.jpg','*.jpeg','*.gif','*.bmp','*.ico','*.webp','*.mp4','*.avi','*.mov','*.mkv','*.webm','*.flv','*.wmv','*.mp3','*.wav','*.flac','*.ogg','*.wma','*.aac','*.m4a','*.woff','*.woff2','*.ttf','*.eot','*.otf','*.psd','*.ai','*.sketch','*.fig','*.xd','*.min.js','*.min.css','package-lock.json','yarn.lock','Gemfile.lock','Cargo.lock','composer.lock','poetry.lock','Podfile.lock','go.sum','pnpm-lock.yaml')
            foreach ($ext in $removeExts) {
                Get-ChildItem -Path $DestDir -Filter $ext -File -ErrorAction SilentlyContinue -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
            }
            $after = (Get-ChildItem -Path $DestDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            $keptFiles = @(Get-ChildItem -Path $DestDir -Recurse -File -ErrorAction SilentlyContinue).Count
            $result.success = $true
            $result.size = [long]$after
            $result.kept = $keptFiles
            $result.removed = $totalFiles - $keptFiles
        } else {
            $result.error = "exit:$exit"
        }
    } catch { $result.error = $_.Exception.Message }
    return $result
}

Log "=== Phase 2: Parallel repo cloning ==="
$runningJobs = @{}
$queueIndex = 0
$startTime = Get-Date
$lastCheckTime = Get-Date
$wikiStarted = $false

while (($queueIndex -lt $sortedRepos.Count -or $runningJobs.Count -gt 0) -and (Get-TotalSize) -lt $TargetMax) {
    while ($runningJobs.Count -lt $MaxParallel -and $queueIndex -lt $sortedRepos.Count -and (Get-TotalSize) -lt $TargetMax) {
        $repo = $sortedRepos[$queueIndex]
        $queueIndex++
        $sanitized = $repo.name -replace '[^\w\-\.]', '_'
        $safeName = if ($sanitized.Length -gt 120) { $sanitized.Substring(0, 120) } else { $sanitized }
        $destDir = "$RepoDir\$safeName"
        if (Test-Path $destDir) {
            $sz = (Get-ChildItem -Path $destDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if ($sz -gt 0) {
                $clonedUrls[$repo.clone_url] = $true
                $repo.clone_url | Out-File -FilePath $ClonedList -Append
                continue
            }
        }
        $job = Start-Job -ScriptBlock $cloneScriptBlock -ArgumentList @($repo.clone_url, $destDir, $Token, $repo.name)
        if ($job) {
            $runningJobs[$job.Id] = @{ job = $job; url = $repo.clone_url; name = $repo.name; start = Get-Date }
        }
    }

    $completedIds = @()
    foreach ($id in $runningJobs.Keys) {
        $j = $runningJobs[$id]
        if ($j.job.State -eq 'Completed') {
            $result = Receive-Job -Job $j.job -ErrorAction SilentlyContinue
            Remove-Job -Job $j.job -Force -ErrorAction SilentlyContinue
            if ($result.success -and $result.size -gt 0) {
                $clonedUrls[$result.url] = $true
                $result.url | Out-File -FilePath $ClonedList -Append
                Log "OK $($j.name) $([math]::Round($result.size/1MB,2))MB (kept $($result.kept), removed $($result.removed) junk)"
            } else {
                $failedUrls[$j.url] = $true
                $j.url | Out-File -FilePath $FailedList -Append
                $reason = if ($result.success) { "empty" } else { $result.error }
                Log "SKP $($j.name): $reason"
            }
            $completedIds += $id
        } elseif ($j.job.State -eq 'Failed' -or ((Get-Date) - $j.start).TotalMinutes -gt 10) {
            if ($j.job.State -ne 'Failed') { Stop-Job -Job $j.job -ErrorAction SilentlyContinue }
            Remove-Job -Job $j.job -Force -ErrorAction SilentlyContinue
            $failedUrls[$j.url] = $true
            $j.url | Out-File -FilePath $FailedList -Append
            Log "FL $($j.name)"
            $completedIds += $id
        }
    }
    foreach ($id in $completedIds) { $runningJobs.Remove($id) | Out-Null }

    $now = Get-Date
    if (($now - $lastCheckTime).TotalSeconds -ge 60) {
        $cs = Get-TotalSize
        $elapsed = [Math]::Max(1, ($now - $startTime).TotalSeconds)
        $rateMBs = [math]::Round(($cs / 1MB) / $elapsed, 2)
        $sizeGB = [math]::Round($cs / 1GB, 2)
        $pct = [math]::Round($cs / $TargetMin * 100, 1)
        Log "PROG ${sizeGB}GB/${pct}% rate=${rateMBs}MB/s jobs=$($runningJobs.Count) q=$($sortedRepos.Count - $queueIndex) ok=$($clonedUrls.Count) fail=$($failedUrls.Count)"
        $lastCheckTime = $now
    }

    if (-not $wikiStarted -and ((Get-Date) - $startTime).TotalMinutes -gt 5) {
        $wikiStarted = $true
        Log "Starting Wikipedia module..."
        Start-Job -ScriptBlock {
            param($D, $W, $T, $L)
            function LW { param($m) $ts=Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts - WIKI: $m"|Out-File -FilePath $L -Append }
            $chunks = @(
                @{u="https://dumps.wikimedia.org/enwiki/20260301/enwiki-20260301-pages-articles1.xml-p1p41242.bz2";i=1;m=281},
                @{u="https://dumps.wikimedia.org/enwiki/20260301/enwiki-20260301-pages-articles2.xml-p41243p151573.bz2";i=2;m=376}
            )
            foreach ($c in $chunks) {
                $cp = "$T\wiki_chunk_$($c.i).bz2"
                if (-not (Test-Path $cp)) {
                    LW "Downloading chunk $($c.i) ($($c.m)MB)..."
                    curl.exe -s -L --connect-timeout 15 --max-time 600 -o $cp $c.u 2>&1 | Out-Null
                }
                $mf = "$W\chunk_$($c.i)_meta.json"
                if (-not (Test-Path $mf)) {
                    LW "Extracting chunk $($c.i)..."
                    & python "$D\wiki_extract.py" $c.u $c.i $W $T 2>&1 | Out-Null
                }
                $sz = (Get-ChildItem -Path $W -Recurse -File -EA 0 | Measure-Object Length -Sum).Sum
                LW "Wiki total: $([math]::Round($sz/1GB,2))GB"
            }
        } -ArgumentList @($BaseDir, $WikiDir, $WikiTemp, $LogFile)
    }

    Start-Sleep -Seconds 3
}

$fs = Get-TotalSize
$tt = (Get-Date) - $startTime
Log "========================================"
Log "FINAL: $([math]::Round($fs/1GB,2))GB in $([math]::Round($tt.TotalHours,2))h"
Log "Cloned: $($clonedUrls.Count) repos | Failed: $($failedUrls.Count)"
Log "========================================"
