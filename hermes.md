# Hermes Agent — Complete Reference

**Developer:** Nous Research  
**Repository:** [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)  
**License:** MIT  
**Language:** Python (85%), TypeScript (11%)  
**Latest Version:** v0.15.2 (May 29, 2026)  
**GitHub Stars:** 203,300+ (as of June 27, 2026)  
**First Release:** February 2026 (v0.2.0)  
**Documentation:** https://hermes-agent.nousresearch.com/docs/  
**Discord:** https://discord.gg/NousResearch  
**Skills Hub:** https://agentskills.io

---

## 1. Overview — What Is Hermes Agent?

Hermes Agent is an open-source, self-improving autonomous AI agent built by Nous Research. It is the only agent with a **built-in learning loop** — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions.

It is **not** a coding copilot tethered to an IDE or a chatbot wrapper around a single API. It is an autonomous agent that lives on your infrastructure (a $5 VPS, GPU cluster, or serverless on Daytona/Modal), remembers what it learns, and gets more capable the longer it runs.

**TL;DR identity:**
- Self-hosted, open-source (MIT), model-agnostic
- Persistent memory across sessions
- Creates and improves its own skills autonomously
- 20+ messaging platforms from one gateway
- 60+ built-in tools
- 6 terminal backends
- MCP client + server support
- RL training & trajectory export for research

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| **Self-Improving Learning Loop** | Creates skills from experience, improves them during use, persists knowledge across sessions |
| **Persistent Memory** | FTS5 search + LLM summarization across sessions; pluggable memory providers (Honcho, Mem0, etc.) |
| **60+ Built-in Tools** | web_search, x_search, terminal, patch, browser_navigate, vision_analyze, cronjob, memory, delegate_task, and more |
| **20+ Messaging Platforms** | CLI, Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Mattermost, Email, SMS, DingTalk, Feishu, WeCom, Weixin, QQ Bot, LINE, Teams, Google Chat, and more |
| **6 Terminal Backends** | Local, Docker, SSH, Daytona, Singularity, Modal |
| **Skills System** | Auto-created skills, self-improvement during use, compatible with agentskills.io open standard |
| **MCP Support** | Native MCP client + server mode; connect any MCP server |
| **Scheduled Automations** | Built-in cron scheduler with delivery to any platform |
| **Parallel Subagents** | Spawn isolated subagents for parallel workstreams |
| **Voice Mode** | Real-time voice in CLI, Telegram, Discord, Discord VC |
| **Model-Agnostic** | Works with 200+ LLMs via OpenRouter, Nous Portal, OpenAI, Anthropic, local vLLM, and any OpenAI-compatible endpoint |
| **Research-Ready** | Batch processing, trajectory export, RL training with Atropos |
| **Full Web Control** | Search, extract, browse, vision, image generation, TTS |
| **Computer Use** | cua-driver for non-Anthropic providers, macOS background execution (5-20ms/event) |

---

## 3. Installation & Setup

### 3.1 Quick Install

**Linux / macOS / WSL2 / Android (Termux):**
```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

**Windows (native PowerShell):**
```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

**macOS (Homebrew):**
```bash
brew install hermes-agent
```

**Desktop Installer:**
Download from https://hermes-agent.nousresearch.com/ (Windows or macOS GUI)

### 3.2 Post-Install

```bash
source ~/.bashrc   # or source ~/.zshrc
hermes setup       # Run the full setup wizard
hermes             # Start the CLI
```

### 3.3 Fastest Path to a Working Agent

```bash
hermes setup --portal
```
One OAuth covers a model plus all four Tool Gateway tools (web search, image generation, TTS, browser).

### 3.4 Requirements

- **macOS:** 13 Ventura or newer (Apple Silicon or Intel)
- **Linux:** Ubuntu 22.04+, Debian 12, Fedora 39+, Arch (glibc 2.35+)
- **Windows:** WSL2 with Ubuntu/Debian (road-tested), or native Windows beta via PowerShell
- No sudo needed for install; the installer handles uv, Python 3.11, and everything else

### 3.5 CLI Commands

| Command | Description |
|---------|-------------|
| `hermes` | Start interactive CLI conversation |
| `hermes model` | Choose LLM provider and model |
| `hermes tools` | Configure which tools are enabled |
| `hermes config set` | Set individual config values |
| `hermes config show` | Display current config |
| `hermes gateway` | Start messaging gateway (Telegram, Discord, etc.) |
| `hermes setup` | Run full setup wizard |
| `hermes update` | Update to latest version |
| `hermes doctor` | Diagnose any issues |
| `hermes claw migrate` | Migrate from OpenClaw |
| `hermes memory setup` | Configure memory provider |
| `hermes proxy` | Start OpenAI-compatible local proxy for OAuth providers |

---

## 4. Configuration

### 4.1 Config File Location

`~/.hermes/config.yaml` — YAML-based configuration for providers, models, tools, memory, MCP servers, and more.

### 4.2 Environment Variables

Stored in `~/.hermes/.env` — API keys, secrets, and provider tokens.

### 4.3 Key Configuration Areas

- **Provider settings:** model provider, API endpoint, model name
- **Tool settings:** enabled/disabled tools, tool-specific config
- **Memory settings:** provider selection (built-in, Honcho, Mem0, etc.), char limits, write approval
- **MCP servers:** external MCP server definitions
- **Messaging:** platform tokens, allowed users, working directory
- **Skills:** external skill directories, write approval, guard settings
- **Cron:** scheduled job definitions

### 4.4 Skill Settings

Skills can declare their own config via SKILL.md frontmatter. Managed under `skills.config` namespace:
```bash
hermes config set skills.config.myplugin.path ~/myplugin-data
hermes config migrate   # Scans all enabled skills for unconfigured settings
```

### 4.5 Memory Configuration

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200    # ~800 tokens
  user_char_limit: 1375      # ~500 tokens
  write_approval: false      # Gate memory writes behind approval
```

### 4.6 Skill Write Guard

```yaml
skills:
  guard_agent_created: false    # Scan agent-created skills for dangerous patterns
  write_approval: false         # Gate every skill write behind approval
```

---

## 5. Skills System

### 5.1 What Skills Are

Skills are on-demand procedural memory documents (SKILL.md files) that the agent loads when relevant. They use a three-level Progressive Disclosure scheme (metadata → body → references/templates) to stay context-efficient (~3k tokens base load). The system is compatible with the agentskills.io open standard.

**The distinction:** Skills = "what to do" (procedural docs), Tools = "how to execute it" (callable functions).

### 5.2 How Skills Work

- **Auto-creation:** When Hermes solves a hard problem, it writes a reusable skill
- **Self-improvement:** Skills improve during use; the agent patches/edits/deletes them as needed
- **Community hub:** 19,932+ skills across 4 registries (72 built-in, 59 optional, 521 community, and growing)
- **Portable:** Standard SKILL.md format — share, reuse across any Hermes installation
- **Discovery:** Browse via `/skills` in CLI or messaging, or `hermes skills` commands

### 5.3 Skills Hub

Official registry at https://agentskills.io with 19,932+ entries across categories:
- MLOps & AI training
- GitHub automation
- Diagramming & note-taking
- Web development
- Data analysis
- Security testing
- Social media management
- And more

### 5.4 Installing Skills

```bash
# From the skills hub
npx skills add <username>/<skill-name>

# From GitHub
npx skills add https://github.com/user/repo --skill <skill-name>

# Browse available skills
/skills
```

### 5.5 New: /learn Command (June 24, 2026)

Nous Research added `/learn` to Hermes Agent's skills system. This command authors a standards-compliant SKILL.md from:
- A local directory
- A doc URL
- A past conversation
- Pasted notes

The live agent sources the material with its own tools, then writes the skill — no hand-writing and no separate ingestion engine. This makes skill creation as simple as: `/learn from [source]`.

### 5.6 Creating Custom Skills

Skills live in `~/.hermes/skills/`. Custom directories can be added via `external_dirs` in `config.yaml`. Skills use a standard SKILL.md format with YAML frontmatter for metadata.

---

## 6. Memory System

### 6.1 Two-Layer Architecture

**Layer 1 — Native files (always on):**
- `MEMORY.md` — recurring facts the agent curates (max ~2200 chars, refreshed every N turns)
- `USER.md` — user profile, preferences, and environment (max ~1375 chars)
- **Session database** — SQLite + FTS5 (full-text search) storing every conversation, reasoning step, and tool call with economic data. Searchable on demand via FTS5 and trigram search.

**Layer 2 — Pluggable MemoryProvider (optional, one at a time):**

| Provider | Description |
|----------|-------------|
| **Honcho** (Plastic Labs) | Dialectic user modeling — models *how* you think, not just what you said. Multi-pass reasoning, session summaries, bidirectional peer tools |
| **Mem0** | Hybrid search (semantic + keyword + entity boosting). Extracts facts automatically, builds user profiles |
| **Supermemory** | Knowledge graph-based memory |
| **GBrain** | Graph-based long-term memory |
| **Mnemosyne** | Semantic memory with embeddings |
| **Hindsight** | Retrospective memory extraction |

### 6.2 Memory Injection

Context is injected into the **user message** at API-call time (not system prompt) to preserve prompt caching. Two independent layers, each on its own cadence, wrapped in `<memory-context>` fences.

### 6.3 Memory Write Approval

```yaml
memory:
  write_approval: false   # true = require approval before any memory write
```
Writes staged under `~/.hermes/pending/memory/` when enabled.

---

## 7. Tools & Toolsets (60+ Built-in)

### 7.1 Tool Categories

| Category | Tools |
|----------|-------|
| **Web** | web_search, x_search (X/Twitter), browser_navigate, browser_click, browser_type, browser_screenshot, page_extract |
| **File System** | read_file, write_file, edit_file, patch, list_directory, grep, glob |
| **Terminal** | terminal (with 6 backends), execute_code |
| **Vision** | vision_analyze, image_generate, video_generate |
| **Voice** | text_to_speech, voice_transcribe, voice_mode |
| **Memory** | memory_search, memory_write, memory_read |
| **Scheduling** | cronjob, cron_list, cron_remove |
| **Delegation** | delegate_task (spawn subagents) |
| **Skills** | skill_manage (create/edit/patch/delete skills) |
| **MCP** | mcp_discover, mcp_call_tool |
| **System** | hermes_tool_use (diagnostics), compress, usage, insights |
| **Multi-Model** | multi_model_reasoning (ensemble across providers) |
| **Computer Use** | computer_use (cua-driver for screen control) |

### 7.2 Tool Configuration

Tools can be enabled/disabled per-session or globally. Tool-specific settings (like browser viewport, terminal working directory, search engine) are configurable in `config.yaml`.

### 7.3 Execution Environments

| Backend | Use Case | Security |
|---------|----------|----------|
| **Local** | Direct command execution on host | Full system access |
| **Docker** | Isolated container | Read-only root, dropped capabilities, PID limits |
| **SSH** | Remote server execution | Key-based auth |
| **Daytona** | Serverless dev environments | Ephemeral, hibernates when idle |
| **Singularity** | HPC container runtime | Compatible with SLURM clusters |
| **Modal** | Cloud serverless functions | Pay-per-use, near-zero idle cost |

---

## 8. MCP Integration

### 8.1 MCP Client Mode (Connect External Tools)

Hermes connects to any MCP server natively. Tools from MCP servers appear alongside built-in tools.

**Configuration in `config.yaml`:**
```yaml
mcp_servers:
  composio:
    url: "https://connect.composio.dev/mcp"
    headers:
      x-consumer-api-key: "YOUR_KEY"
    connect_timeout: 60
    timeout: 180
  github:
    command: "npx"
    args: ["@modelcontextprotocol/server-github"]
```

### 8.2 MCP Server Mode (Expose Hermes to Other Clients)

Run `hermes mcp serve` to expose Hermes conversations and session data to clients like Claude Desktop, Cursor, and other MCP-compatible tools.

### 8.3 Tool Filtering

Filter which tools from MCP servers are available to the agent — security-critical when connecting to production infrastructure.

### 8.4 Recommended MCP Servers for Hermes

- **Composio Connect** — 200+ integrations (GitHub, Gmail, Slack, Linear, Notion, Instagram, etc.)
- **GitHub MCP** — repository management, PRs, issues, code review
- **Browserbase** — cloud browser automation
- **Postiz** — social media scheduling
- **Mem0** — memory and knowledge graph

---

## 9. Messaging Gateway (20+ Platforms)

### 9.1 Supported Platforms

| Platform | Support |
|----------|---------|
| **CLI** | Full TUI with rich features |
| **Telegram** | Full messaging, voice, commands |
| **Discord** | Full messaging, voice, Discord VC |
| **Slack** | Full messaging, channels |
| **WhatsApp** | Full messaging |
| **Signal** | Full messaging |
| **Email** | Send/receive via IMAP/SMTP |
| **SMS** | Via Twilio integration |
| **Microsoft Teams** | Full messaging |
| **Google Chat** | Full messaging |
| **Matrix** | Full messaging |
| **Mattermost** | Full messaging |
| **LINE** | Full messaging |
| **DingTalk** | Chinese enterprise messaging |
| **Feishu** | ByteDance enterprise platform |
| **WeCom (WeChat Work)** | Enterprise WeChat |
| **Weixin** | Personal WeChat |
| **QQ Bot** | Tencent QQ |
| **BlueBubbles** | iMessage bridge |
| **Home Assistant** | Smart home integration |
| **SimpleX Chat** | Privacy-focused messaging |

### 9.2 Setup

```bash
hermes gateway setup    # Interactive configuration
hermes gateway start    # Start the gateway process
```

### 9.3 Cross-Platform Continuation

Start a conversation on Telegram, pick it up in CLI, continue on Discord — all context preserved. Voice memo transcription works across platforms.

---

## 10. LLM Providers

### 10.1 Supported Providers

| Provider | Models | Auth |
|----------|--------|------|
| **Nous Portal** | 300+ models, Tool Gateway (search, image, TTS, browser) | OAuth |
| **OpenRouter** | 200+ models (Claude, GPT, Gemini, Llama, DeepSeek, etc.) | API Key |
| **OpenAI** | GPT-4o, GPT-4.1, GPT-5.x, o-series | API Key |
| **Anthropic** | Claude 3.5/4/4.5/Opus 4.8 | API Key |
| **Google/Gemini** | Gemini 2.5 Pro, Gemini 3 | API Key / OAuth |
| **xAI/SuperGrok** | Grok-3, Grok-4 (since v0.14.0) | OAuth |
| **GitHub Copilot** | Copilot models | OAuth |
| **NVIDIA NIM** | Nemotron, Llama, Mistral | API Key |
| **Xiaomi MiMo** | MiMo V2.5 | API Key |
| **z.ai/GLM** | GLM-5, GLM-6 | API Key |
| **Kimi/Moonshot** | Kimi models | API Key |
| **MiniMax** | MiniMax models | API Key |
| **DeepSeek** | DeepSeek-V3, DeepSeek-R1 | API Key |
| **Qwen Cloud** | Qwen 3, Qwen 4 | API Key |
| **Hugging Face** | Community models | API Key / Token |
| **NovitaAI** | 200+ models, GPU Cloud | API Key |
| **Local vLLM** | Self-hosted open models | Custom endpoint |
| **Ollama** | Local models | Custom endpoint |
| **Custom Endpoint** | Any OpenAI-compatible API | Custom |

### 10.2 Switching Models

```bash
hermes model                        # Interactive picker
/model provider:model-name          # In conversation
```

No code changes required — models are interchangeable at runtime.

---

## 11. Use Cases

### 11.1 Research & Analysis
- Web research with citation gathering
- Competitive analysis reports
- Market trend monitoring (scheduled daily)
- Academic paper analysis and summarization
- Social listening across platforms

### 11.2 Coding & Development
- Multi-file code generation and refactoring
- Git workflow automation (PRs, code review, CI/CD)
- Bug investigation and fix implementation
- Documentation generation
- Codebase knowledge extraction

### 11.3 Content Creation
- Blog post drafting and editing
- Social media content scheduling (via Postiz MCP)
- Newsletter generation
- Video script writing
- Image generation with prompts

### 11.4 Automation & Operations
- Email triage and response (via MCP)
- Calendar management
- Customer support triage
- Data pipeline monitoring
- Nightly backup verification
- Weekly audit reports

### 11.5 Business & Finance
- Financial research with live data (Dexter-style agents)
- Competitor price tracking
- Lead qualification from web forms
- Invoice processing
- Market analysis reports

### 11.6 Personal Productivity
- Daily briefing generation
- Meeting notes and action items
- Task management across projects
- Learning material curation
- Personal finance tracking

### 11.7 MLOps & AI Research
- Training data generation (batch trajectory processing)
- RL fine-tuning with Atropos integration
- Model evaluation and comparison
- Experiment tracking
- Dataset curation

### 11.8 Security & Compliance
- Log analysis and anomaly detection
- Container hardening validation
- Compliance report generation
- Vulnerability scanning orchestration
- Incident response playbook execution

---

## 12. Architecture

### 12.1 Project Structure

```
hermes-agent/
├── agent/                    # Core agent logic
│   ├── conversation_loop.py  # ~4200-line turn lifecycle
│   ├── tool_executor.py      # Sequential/concurrent tool dispatch
│   └── ...
├── tools/                    # Built-in tool implementations
│   ├── registry.py
│   └── ...
├── providers/                # LLM provider adapters
│   ├── base.py
│   └── ...
├── gateway/                  # Multi-platform messaging
│   └── run.py
├── apps/                     # Desktop (Electron) & bootstrap installer
├── web/                      # Web UI / dashboard
├── hermes_cli/               # CLI framework & mixins
├── plugins/                  # Memory providers (Honcho), integrations
├── skills/                   # Built-in and optional skills
├── environments/             # RL training (Atropos integration)
├── hermes_state.py           # SQLite + FTS5 state store
├── hermes_constants.py       # Shared constants & HERMES_HOME resolution
├── trajectory_compressor.py  # Training data compression
├── pyproject.toml            # Exact-pinned dependencies
├── Dockerfile                # Container image
└── docker-compose.yml        # s6-overlay multi-service composition
```

### 12.2 The Conversation Loop (Agent Turn Lifecycle)

1. **Prompt assembly** — System prompt built once per conversation, byte-stable. Tool schemas, memory context blocks, and skill metadata injected.
2. **Model call** — Message history sent to provider with full tool definitions. Streaming supported across all providers.
3. **Tool dispatch** — Tool calls executed sequentially or concurrently (up to 8 parallel workers). Results appended to conversation.
4. **Memory update** — After turn completion, agent may curate MEMORY.md, update USER.md, or write to session database.
5. **Skill improvement** — Agent may patch existing skills or create new ones based on successful workflows.

### 12.3 Learning Loop Components

- **Agent-curated memory** with periodic nudges
- **Autonomous skill creation** from completed tasks
- **Skill self-improvement** during subsequent use
- **FTS5 cross-session recall** with LLM summarization
- **Honcho dialectic user modeling** (deepening understanding of user preferences, goals, working style)

---

## 13. Security

### 13.1 Data Privacy

- **Zero telemetry, zero data collection** by default
- All memory stored in `~/.hermes/` on your machine
- Data leaks only as much as your model provider sees (hosted API vs local model)
- MIT License — fully auditable codebase

### 13.2 Container Hardening

For Docker backend:
- Read-only root filesystem
- Dropped Linux capabilities
- PID and memory limits
- Namespace isolation
- No network access by default (configurable)

### 13.3 Command Approval

- Dangerous commands prompt for approval
- Configurable allowlist via `~/.hermes/config.yaml`
- Per-backend approval policies

### 13.4 Skill Write Protection

```yaml
skills:
  guard_agent_created: true    # Scan for credential harvesting, prompt injection, exfil
  write_approval: true         # Every skill write requires approval
```

When enabled, skill writes are staged under `~/.hermes/pending/skills/` and reviewed with:
- `/skills pending` — view pending writes
- `/skills diff <id>` — see proposed changes
- `/skills approve <id>` — accept write
- `/skills reject <id>` — deny write

### 13.5 Memory Write Protection

Same gating mechanism for memory writes via `memory.write_approval: true`.

---

## 14. Community & Ecosystem

### 14.1 Official Channels

- **Discord:** https://discord.gg/NousResearch — primary community hub
- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** Q&A, show and tell
- **Skills Hub:** https://agentskills.io — browse and share skills

### 14.2 Community Resources

| Resource | URL | Description |
|----------|-----|-------------|
| **Hermes Atlas** | https://hermesatlas.com | Ecosystem map, 175+ repo catalog, beginner's guide |
| **Hermes Handbook** | https://hermesatlas.com/guide | Complete beginner's guide by Kevin Simback |
| **Practitioner's Reference** | https://blakecrosley.com/guides/hermes | 18,800-word technical reference |
| **Hermes Agent (fan site)** | https://hermes-agent.ai | Community docs, comparisons, blog |
| **reddit/r/hermesagent** | Reddit | Active community with daily posts |
| **OpenClaw Launch** | https://openclawlaunch.com/guides/hermes-agent-skills | Skills & migrations guide |

### 14.3 Ecosystem Projects

- **Hermes WebUI** (nesquena) — Lightweight browser interface for Hermes Agent
- **HermesClaw** (AaronWong1999) — WeChat bridge for running Hermes + OpenClaw on same account
- **Mem0 integration** — Memory provider with hybrid search
- **Postiz Agent** — Social media automation skill
- **Composio Connect** — 200+ MCP integrations

### 14.4 Migration from OpenClaw

```bash
hermes claw migrate              # Interactive migration
hermes claw migrate --dry-run    # Preview what would be migrated
hermes claw migrate --preset user-data   # Migrate without secrets
```

Migrates: SOUL.md, memories, skills, command allowlist, messaging settings, API keys, TTS assets, workspace instructions.

---

## 15. Comparisons

### 15.1 Hermes Agent vs Claude Code

| Aspect | Hermes Agent | Claude Code |
|--------|-------------|-------------|
| **Type** | Autonomous agent runtime | CLI coding copilot |
| **Memory** | Persistent cross-session | Per-session only |
| **Skills** | Auto-created, self-improving | Manual rules only |
| **Messaging** | 20+ platforms (Telegram, Discord, etc.) | Terminal only |
| **Autonomy** | Scheduled tasks, background operation | Interactive session only |
| **Deployment** | Self-hosted ($5 VPS to GPU cluster) | Local or cloud |
| **Model** | Any LLM provider | Claude models only |
| **Learning Loop** | Built-in | None |
| **MCP** | Client + server | Client only |

### 15.2 Hermes Agent vs OpenClaw

| Aspect | Hermes Agent | OpenClaw |
|--------|-------------|----------|
| **GitHub Stars** | 203k+ | ~50k |
| **Learning Loop** | Built-in (skills + memory + user model) | Basic memory only |
| **Skills System** | Progressive disclosure, 19,932+ skills | Standard skills |
| **Messaging** | 20+ platforms | ~10 platforms |
| **Tools** | 60+ built-in | ~30 built-in |
| **MCP** | Client + server | Client only |
| **Migration Path** | `hermes claw migrate` (full import) | N/A |
| **Providers** | 20+ first-class | ~10 |
| **RL/MLOps** | Built-in batch processing, trajectory export | Not available |

### 15.3 Hermes Agent vs Cursor

| Aspect | Hermes Agent | Cursor |
|--------|-------------|--------|
| **Type** | Server-based autonomous agent | IDE-integrated copilot |
| **Persistence** | Always-on server | Requires IDE open |
| **Scope** | General-purpose (research, automation, coding) | Code editor focused |
| **Memory** | Cross-session, cross-platform | Per-file context |
| **Scheduling** | Built-in cron | None |

---

## 16. Pricing

| Plan | Cost | What You Get |
|------|------|-------------|
| **Self-Hosted (Free)** | $0 | Full agent, all 60+ tools, messaging gateway, skills, cron, memory. You pay only for model inference |
| **Nous Portal** | $5/month | 300+ models, Tool Gateway (web search, image gen, TTS, cloud browser) — one subscription |
| **OpenRouter** | Pay-per-token | 200+ models, pay for what you use |
| **Cloud VPS** | ~$5/month | Deploy on a $5 VPS for 24/7 availability |

---

## 17. FAQ & Troubleshooting

### What is Hermes Agent?
An open-source autonomous AI agent by Nous Research with persistent memory, self-improving skills, multi-platform messaging, and 60+ built-in tools. Runs on your own infrastructure.

### How is it different from ChatGPT/Claude?
ChatGPT and Claude are stateless — every conversation starts fresh. Hermes Agent maintains persistent memory, creates skills from experience, runs scheduled automations, and operates independently on your own infrastructure.

### Is Hermes Agent really free?
Yes — fully open source (MIT), free to self-host. No subscriptions, no usage limits, no vendor lock-in. You only pay for model inference (API costs).

### Does Hermes leak my data?
Only as much as your model provider does. With a hosted API, prompts go to that provider. With a local model (vLLM, Ollama), nothing leaves your machine. Memory and conversation logs stay on your hardware.

### Can I use Hermes Agent offline?
Yes — run a local model via vLLM or Ollama. All tools work locally. Only web search and messaging platforms need internet.

### What hardware do I need?
A $5 VPS is enough for the agent runtime. Model inference depends on your provider — use cloud APIs for small hardware or local vLLM with a GPU for on-premise.

### Is the learning loop real model improvement or just RAG?
Closer to "RAG plus skills." The agent writes named procedures (skills) it can recall and persists user-model facts. Model weights don't change; the surrounding scaffold does. This is still a meaningful jump over single-turn chat.

### Can I use my own LLM?
Yes — any OpenAI-compatible endpoint. Set up in config.yaml or use `hermes model` to select from 20+ providers.

### Does Hermes support MCP?
Yes — native MCP client + server mode since v0.2.0.

### How do I update?
`hermes update` — checks for latest release and updates the installation.

### Troubleshooting
| Issue | Solution |
|-------|----------|
| Install fails on macOS | Ensure Rosetta 2 is installed (`softwareupdate --install-rosetta`) |
| WSL2 issues | Run `wsl --install -d Ubuntu` first, then install inside WSL |
| "hermes: command not found" | Run `source ~/.bashrc` or `source ~/.zshrc` after install |
| Provider auth errors | Run `hermes doctor` to diagnose, then `hermes setup --portal` for OAuth |
| Memory not persisting | Check `memory.memory_enabled: true` in config; run `hermes memory setup` |
| Gateway won't start | Check platform tokens in `~/.hermes/.env`; run `hermes doctor` |
| Agent not using tools | Run `hermes tools` to check enabled tools; verify MCP servers are running |

---

## 18. Quick Reference — Slash Commands

| Command | CLI | Messaging |
|---------|-----|-----------|
| Start fresh | `/new` or `/reset` | `/new` or `/reset` |
| Change model | `/model provider:model` | `/model provider:model` |
| Set personality | `/personality [name]` | `/personality [name]` |
| Retry last turn | `/retry` | `/retry` |
| Undo last turn | `/undo` | `/undo` |
| Compress context | `/compress` | `/compress` |
| Check usage | `/usage` | `/usage` |
| View insights | `/insights [--days N]` | `/insights [days]` |
| Browse skills | `/skills` | `/skills` |
| Run a skill | `/<skill-name>` | `/<skill-name>` |
| Interrupt | `Ctrl+C` | `/stop` or new message |
| Platform status | `/platforms` | `/status`, `/sethome` |
| View pending skill writes | — | `/skills pending` |

---

## 19. YouTube Video Resources

### 19.1 Tutorial Videos

| # | Video Title | Creator | Views | Duration | Key Takeaways |
|---|-------------|---------|-------|----------|--------------|
| 1 | **Hermes Agent Tutorial: Beginner to Pro In 13 Minutes** | (YT) | — | 13min | Full setup walkthrough — install, configure, first conversation, key commands |
| 2 | **Hermes Agent Full Tutorial for Beginners \| Setup Guide** | Tech With Tim | 13.1K | 28min | VPS or local install, OpenRouter/OpenAI/Firecrawl, Telegram bot, cron jobs, security best practices |
| 3 | **Hermes Agent: Zero to Personal AI Assistant (1 Hour Course)** | Nate Herk \| AI Automation | 271K | 58min | Five pillars (Memory, Skills, Soul, Crons, Self-Improving Loop); Docker-based VPS on Hostinger; code `NATEHERK` for discount; comparison vs Claude Code/OpenClaw; Telegram setup; GitHub backup |
| 4 | **Master Hermes Agent in 4 HOURS** | (YT) | — | 4hr | Comprehensive deep-dive into every feature, config option, and use case pattern |
| 5 | **Hermes Agent - Full Course & Setup Guide - For COMPLETE Beginners** | Tech With Tim | 7.2K | 59min | Step-by-step from zero: install → provider → messaging → skills → cron → security |
| 6 | **The VIRAL Hermes Agent: Full Free Setup (Live Demo)** | (YT) | — | — | Live demo of full setup with real-time walkthrough |
| 7 | **Hermes Agent: The Ultimate Beginner's Guide** | Metics Media | 101K | 33min | Deploy on Hostinger VPS with one-click template; OpenRouter setup; Telegram bot; create custom skills; set up Honcho memory; schedule jobs in natural language; switch models per task; security; voice mode |
| 8 | **Hermes Agent Tutorial for Beginners (Full Step-by-Step Setup)** | Metics Media | 70K | 34min | Complete beginner walkthrough covering install, configuration, and first workflow |
| 9 | **Hermes Agent Desktop: Full Setup + Real Use Cases** | Greg Isenberg w/ Alex Finn | 102K | 44min | Desktop app tour: sessions, profiles (model-based vs role-based), artifacts as second brain, skills, tools, cron, sub-agents vs profiles, daily business opportunity scanning, local models (Mac Studio vs DGX Spark), reframing AI cost as investment |
| 10 | **6 Hermes Agent use cases I promise will change your life** | Alex Finn | 121K | 15min | Six practical use cases: 24/7 AI employee, running 5 parallel Hermes agents, productivity workflows, automation patterns |
| 11 | **Hermes Agent Setup With Use Cases** | (YT) | — | — | Setup guide combined with practical use case demonstrations |

### 19.2 Key Lessons from Videos

**Nate Herk's Five Pillars of Hermes:**
1. **Memory** — Durable context in `USER.md` (preferences/style) and `MEMORY.md` (projects/business context)
2. **Skills** — Procedural recipes in `SKILL.md` for consistent task execution
3. **Soul** — `SOUL.md` defining agent personality and tone
4. **Crons** — Scheduled automations for proactive (not just reactive) operation
5. **Self-Improving Loop** — Agent learns by persisting successful workflows into memory and skills

**Greg Isenberg / Alex Finn Desktop Key Insights:**
- Sessions, profiles, artifacts, skills, and cron jobs pulled into polished Apple-style UI
- Smart session/context management keeps costs low
- Profiles can map to different models per task (Opus 4.8 for strategy, GPT-5.x for coding)
- Artifacts serve as a "second brain" for saving and retrieving work
- Sub-agents vs Profiles: profiles are persistent personas, sub-agents are ephemeral workers
- Daily business opportunity scanning is a high-value first use case
- Local models (Mac Studio with 128GB unified memory, DGX Spark) can replace API calls
- Best way to make money: aim agents at other people's challenges

**Metics Media Beginner's Guide Topics:**
- One-click VPS deploy on Hostinger (Ubuntu 24.04 LTS)
- OpenRouter gives 200+ models under one API key
- Telegram Bot via BotFather for mobile access
- Custom skills from scratch (Markdown + YAML frontmatter)
- Honcho memory upgrade for persistent user modeling
- Natural language cron scheduling ("send me daily briefing at 8am")
- Model cost management — assign cheaper models to simpler tasks
- Security: dedicated VPS, limited bot access, command approval

**Tech With Tim's Setup Priorities:**
1. VPS (Hostinger) or local Mac for 24/7 operation
2. OpenRouter or OpenAI as model provider
3. Firecrawl API for web search
4. Telegram bot for anywhere-access
5. Cron jobs for automated workflows
6. Security: dedicated hardware, restrict bot to sensitive data

**Alex Finn's 6 Use Cases Summary:**
- Use case 1: 24/7 AI employee running tasks autonomously
- Use case 2: Multiple parallel Hermes agents for different domains
- Use cases 3-6: Content creation, research, development, and monitoring workflows
- Key insight: Hermes compounds in value — the longer it runs, the more skills it accumulates

### 19.3 Top Hermes Agent YouTube Channels

| Channel | Subscribers | Notable Videos | Focus |
|---------|-------------|----------------|-------|
| **Nate Herk \| AI Automation** | 823K | Zero to Personal AI Assistant (271K views), Master 95% of Claude Code Skills (200K views) | AI automation, Hermes setup, Claude Code |
| **Greg Isenberg** | 660K | Hermes Agent Desktop w/ Alex Finn (102K views), How AI agents work (536K views) | Startup AI, agent use cases, founder perspectives |
| **Alex Finn** | 212K | 6 Hermes Agent use cases (121K views), Hermes is greatest AI tool (97K views) | Hermes setups, use cases, money-making with AI |
| **Tech With Tim** | 7M+ | Hermes Agent Full Tutorial (13K views), Full Course for Beginners (7.2K views) | Developer tutorials, AI agents |
| **NetworkChuck** | 4M+ | Use Hermes RIGHT NOW!! (1.1M views) | AI tools, networking, tech tutorials |
| **Jack Roberts** | 200K+ | Every Hermes Concept for Normal People (71K views), Hermes + Ollama Private OS (51K views) | Hermes concepts simplified, local LLMs |
| **Metics Media** | 50K+ | Ultimate Beginner's Guide (101K views), Tutorial for Beginners (70K views) | Hermes tutorials, beginner guides |
| **Julian Goldie SEO** | 399K | Agent OS + Obsidian + Kanban (653 views), Build Your Own Agent OS | Hermes dashboards, multi-agent systems |
| **Rick Mulready** | 200K+ | 7 Mind-Blowing Use Cases for Hermes Agent (30K views) | AI use cases, marketing |

### 19.4 Notable Hermes Agent YouTube Videos Beyond the List

| Video | Creator | Views | Key Topic |
|-------|---------|-------|-----------|
| "you need to use Hermes RIGHT NOW!! (goodbye OpenClaw!!)" | NetworkChuck | 1.1M | OpenClaw migration, Hermes superiority |
| "Hermes Agent is the greatest AI tool ever made. Here's how to set it up" | Alex Finn | 109K | Full setup guide with enthusiasm |
| "Every Hermes Concept explained for Normal People" | Jack Roberts | 71K | Plain-English Hermes explanation |
| "Hermes Agent + Ollama = 100% Private OS" | Jack Roberts | 51K | Local model setup, privacy-focused |
| "Hermes Agent under Claude Code Is Insane" | AI LABS | 22K | Using Hermes as Claude Code skill |
| "7 Mind-Blowing Use Cases for Hermes Agent" | Rick Mulready | 30K | Practical use case deep-dives |
| "I Ran Hermes Agent on a Local Model Instead of GPT-5.5" | Nemanja Mirkovic | 12K | Cost comparison, local vs API |
| "I Built an AI Hacking Team with Hermes Agent" | zSecurity | 98K | Security and pentesting use cases |

---

*Compiled on June 27, 2026 from official documentation (hermes-agent.nousresearch.com/docs/), GitHub repository (NousResearch/hermes-agent), community resources (Hermes Atlas, Practitioner's Reference), published reviews, and YouTube video descriptions/transcripts. Instagram search found no dedicated content about Hermes Agent — only unrelated brand pages with the "Hermes" name.*
