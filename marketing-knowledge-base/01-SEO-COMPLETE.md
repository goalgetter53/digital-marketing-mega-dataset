# SEO COMPLETE KNOWLEDGE BASE - RAW DATA

## SOURCE 1: Backlinko - Off-Page SEO Complete Guide 2026
AUTHOR: Brian Dean (Backlinko/Semrush)
URL: https://backlinko.com/off-page-seo-guide
DATE: Dec 29, 2025

### KEY FRAMEWORKS & STRATEGIES:

**Off-Page SEO Fundamentals:**
- Off-page SEO = activities done off your website to increase search rankings
- Includes: backlinks, branded searches, social engagement/shares, E-E-A-T signals
- Google QRG emphasizes "Reputation Research" - looks beyond what sites claim about themselves
- YMYL topics require reputation info from expert sources
- LLM citations heavily favor publications (Wikipedia, Forbes, NerdWallet, Bankrate, TechRadar, etc.)

**Backlink Strategies (Chapter 2):**
1. BE A DATA SOURCE - Create original stats that journalists cite (e.g., email marketing stats page)
2. BROKEN CONTENT BUILDING - Use Semrush Site Audit as broken link search engine, find dead pages, offer replacement
3. INFORMATION GAIN - Unique insights, analysis, perspectives not available elsewhere; original methodologies, firsthand testing
4. STRATEGIC GUEST POSTING - Gets brand in front of new audiences, leads to unlinked brand mentions and backlinks

**Brand Signals (Chapter 3):**
- Audit branded searches in GSC Performance Report
- Invest in YouTube - correlates with branded searches
- Set up brand tracking (Semrush Brand Monitoring)
- Publish research-backed content (case study: 72.9K backlinks from 5.6K domains)

**E-E-A-T Improvement (Chapter 4):**
1. Brand mentions on authority sites (links AND unlinked mentions help)
2. Links from trusted "seed sites" (sites that have links from NY Times etc.)
3. Positive online reviews (critical for local SEO and E-E-A-T)
4. Awards and expert recognition

**Bonus Techniques (Chapter 5):**
- Distribute press releases
- Participate in roundup posts
- Get interviewed on podcasts
- Partner with bigger brands
- Create visuals other blogs can use

**Case Studies:**
1. Josh Howarth - Broken link building for SaaS (ExplodingTopics)
2. Daniel Daines-Hutt - Podcast outreach: DA0 to DA48 in 90 days via 60 podcasts
3. Ash Turner - BankMyCell: surveys + press releases earned links from Forbes, NYT, Guardian

---

## SOURCE 2: BrimCove - Google Ranking Factors Complete SEO Guide 2026
AUTHOR: Muhammad Zain Shabbir (Founder & CEO)
URL: https://brimcove.com/google-ranking-factors-complete-seo-guide-2026/
DATE: April 21, 2026

### KEY DATA POINTS:
- March 2026 Core Update: 79.5% of top-three positions shifted
- Over 90% of top ten moved
- Sites with original data saw avg visibility jumps of ~22%
- Thin/templated content dropped 30-50%

### RANKING FACTOR CATEGORIES:
1. Content (35% of weighting) - Quality, relevance, intent matching, E-E-A-T, freshness
2. Technical SEO - Core Web Vitals (LCP <2.5s, INP <200ms, CLS <0.1), mobile-first, HTTPS, crawlability
3. On-Page SEO - Title tags, headings, content structure, schema markup, image optimization, internal linking
4. Backlinks - Quality over quantity, natural anchor text, contextual placement
5. UX/Behavioral Signals - Bounce rate, dwell time, scroll depth, CTR
6. Local/Entity Signals - GBP activity, NAP consistency, entity clarity

### 2026 EMERGING TRENDS:
- Semantic search & entity understanding
- AI content without human oversight = penalized
- User satisfaction signals weighted heavier
- Original research/case studies outperforming generic listicles

### ACTIONABLE CHECKLIST:
1. Confirm page matches current search intent
2. Add/strengthen author bio with credentials
3. Test Core Web Vitals
4. Refresh 3+ stats/examples with 2026 data
5. Check internal links
6. Add relevant schema markup
7. Optimize every image with alt text
8. Flag anything unclear or generic

---

## SOURCE 3: ClickRank - SEO Ranking Factors 2026
AUTHOR: Ola Adebulu
URL: https://www.clickrank.ai/seo-ranking-factors
DATE: March 6, 2026

### THREE CORE PILLARS OF SEO:
1. On-Page Relevance - intent match, content quality, E-E-A-T
2. Off-Page Authority - backlinks, brand mentions, digital PR
3. Technical Health - crawlability, indexing, Core Web Vitals

### CONTENT & E-E-A-T QUALITY SIGNALS:
- Helpful content = answers query fully, without padding, practical understanding
- Intent match = first gate for ranking
- Depth signals topical authority
- Semantic search rewards varied vocabulary
- User satisfaction: dwell time, bounce rate, CTR, repeat visits
- Internal linking + content clusters improve session depth

### TECHNICAL SEO FOUNDATION:
- LCP (loading speed), INP (interaction responsiveness), CLS (layout stability)
- INP replaced FID (captures broader interaction quality throughout session)
- Mobile-first indexing critical
- Clean HTML, proper status codes, logical internal linking
- XML sitemaps list only canonical URLs
- Correct use of robots.txt
- Canonical tags prevent duplicate content issues
- HTTPS non-negotiable
- Short, descriptive URLs

### OFF-PAGE AUTHORITY:
- Backlinks still core ranking pillar
- Link quality > quantity
- One editorial link from trusted niche-relevant site > 50 low-context directory links
- Anchor text over-optimization triggers spam signals
- Digital PR, original research, tools, expert-led content = king
- Brand signals: branded searches, unlinked mentions, reviews, social proof, GBP

### PRIORITIZATION STRATEGY:
1. Fix technical blockers first (indexing, CWV, duplicates)
2. Lock intent match + E-E-A-T-driven content
3. Build authority through links and brand
- Typical timeline: 3-6 months for on-page/technical, longer for authority/link building

---

## SOURCE 4: Yotpo - Full Technical SEO Checklist 2026
AUTHOR: Amit Bachbut (VP Growth Marketing, Yotpo)
URL: https://www.yotpo.com/blog/full-technical-seo-checklist/
DATE: June 2, 2026

### KEY TAKEAWAYS:
- Dec 2025 Rendering Shift: non-200 status codes may be excluded from rendering queue
- Bot Governance: differentiate retrieval agents (OAI-SearchBot) from training scrapers (GPTBot)
- INP Supremacy: FID deprecated, optimize for Interaction to Next Paint
- GEO & Entities: Structured data = language of LLMs; use BLUF (Bottom Line Up Front) formatting
- AI Overviews trigger for ~18.57% of commercial queries

### ADVANCED CRAWLABILITY & BOT GOVERNANCE:
- OAI-SearchBot: ALLOW (surfaces content in ChatGPT Search)
- GPTBot: OPTIONAL BLOCK (prevents data from training future models)
- Google-Extended: STRATEGIC DECISION (controls Gemini training data)
- Log file analysis = source of truth for bot interaction
- "Invisible 500 Error": client-side catches server error, serves 200 OK with error page
- Verify 100% of high-value crawls using Googlebot Smartphone user agent

### INDEXING STRATEGY:
- Index Budget management critical (not just Crawl Budget)
- Faceted navigation "Combinatorial Explosion" problem
- Crawlability Matrix:
  - Broad Category: Index & Follow
  - Specific Filter: Index & Follow w/ unique H1
  - Granular Filter: Canonicalize or Noindex
  - Sort & Session Parameters: Block via robots.txt
- Soft 404s: permanently gone = 404/410; temporarily OOS = 200 OK with "Similar Items"
- Pruning: remove/block low-quality pages to concentrate link equity

### JAVASCRIPT SEO & RENDERING:
- CSR = liability for PDPs (indexing delays)
- SSR = ensures bots see content immediately
- ISR (Incremental Static Regeneration) = preferred for e-commerce 2026
- Island Architecture: hydrate only interactive elements, improves INP scores

### CORE WEB VITALS DEEP DIVE:
- INP: <200ms good, >500ms poor
- INP phases: Input Delay → Processing Time → Presentation Delay
- LCP optimization: fetchpriority="high" on LCP image, AVIF format, WebP fallback
- content-visibility: auto for below-fold elements

### STRUCTURED DATA:
- Shipping & Returns: must include shippingDetails and hasMerchantReturnPolicy
- Combating "Schema Drift": automated testing pipelines (Puppeteer/Cypress)
- SameAs: link to official verified profiles on LinkedIn, Crunchbase, Wikipedia
- ProfilePage schema for author bios

### GENERATIVE ENGINE OPTIMIZATION (GEO):
- RAG (Retrieval Augmented Generation): content must be easy to "chunk"
- BLUF Method (Bottom Line Up Front): core answer in first sentence
- Definition lists (<dl>,<dt>,<dd>) = 30-40% more likely to be cited
- Statistic-heavy sections with distinct <h2>
- Semantic hierarchy with H1-H6 tags

### INTERNATIONAL & REAL-TIME INDEXING:
- Hreflang: self-referencing tags required, Return Tag Rule, x-default
- IndexNow: push protocol for Bing, Yandex, ChatGPT - instant inventory updates
- Cloudflare/Akamai have one-click IndexNow integration

---

## SOURCE 5: CorgenX - On-Page vs Off-Page SEO Complete Guide 2026
AUTHOR: Saravana Karthik
URL: https://www.corgenx.com/blog/on-page-off-page-seo-complete-guide
DATE: April 26, 2026

### 8 ON-PAGE ELEMENTS:
1. Title tag (50-60 char, primary keyword near front)
2. Meta description (150-160 char, value proposition)
3. Header structure (1 H1, H2s for sections, H3s for sub-topics)
4. Keyword placement (first 100 words, in at least one H2)
5. Image alt text (descriptive, keyword where natural)
6. Internal links (2-3 per page, descriptive anchor text)
7. Page speed (CWV: LCP <2.5s, CLS <0.1, INP <200ms)
8. Content quality (comprehensive, original, E-E-A-T, 1500+ words for competitive topics)

### THREE TYPES OF SEARCH INTENT:
- Informational: user wants to learn
- Navigational: user wants to find a specific site
- Transactional: user wants to take action

### 9 OFF-PAGE ELEMENTS:
1. Backlink acquisition (quality > quantity)
2. Digital PR (most scalable off-page strategy)
3. Brand mentions
4. Social signals (indirect but real)
5. Local SEO signals (GBP, NAP consistency)
6. Forum and community participation
7. Influencer and podcast collaboration
8. Directory listings
9. Customer reviews

### COMPARISON TABLE:
- On-Page: on website, relevance, fully controllable, faster (weeks-months), moderate difficulty
- Off-Page: outside website, authority/trust, partially controllable, slower (months-year), harder

### 90-DAY SEO ROADMAP:
Days 1-30: Technical audit, title/meta optimization, schema, images, internal linking, CWV
Days 31-60: Identify 3-5 high-priority keywords, create pillar content (2000+ words), cluster content
Days 61-90: Analyze competitor backlinks, launch digital PR asset, guest posting, local citations, HARO

### WEIGHT COMPARISON TABLE:
Factor | On-Page SEO | Off-Page SEO
Location | Directly on website | Outside your website
Primary Goal | Relevance & quality | Authority & trust
Control | Fully controllable | Partially controllable
Speed | Faster (weeks-months) | Slower (months-year)
Difficulty | Moderate | Hard
