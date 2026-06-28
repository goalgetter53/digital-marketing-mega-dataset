import sys, os, bz2, re, json, xml.sax, time

MARKETING_KEYWORDS = [
    'marketing', 'seo', 'advertising', 'brand', 'social media', 'copywriting',
    'conversion', 'analytics', 'ppc', 'email marketing', 'content marketing',
    'growth hacking', 'digital marketing', 'ecommerce', 'e-commerce',
    'sales funnel', 'lead generation', 'customer retention', 'market research',
    'consumer behavior', 'branding', 'public relations', 'affiliate',
    'influencer', 'viral', 'neuromarketing', 'crm', 'marketing automation',
    'landing page', 'a/b testing', 'keyword research', 'link building',
    'on-page seo', 'off-page seo', 'google analytics', 'google ads',
    'facebook ads', 'instagram marketing', 'tiktok marketing', 'linkedin marketing',
    'twitter marketing', 'youtube marketing', 'content strategy',
    'brand strategy', 'go-to-market', 'product launch', 'market segmentation',
    'target audience', 'buyer persona', 'customer journey', 'marketing funnel',
    'lifecycle marketing', 'drip campaign', 'newsletter', 'subscriber',
    'churn rate', 'customer lifetime value', 'cac', 'roi', 'kpi',
    'growth strategy', 'viral coefficient', 'network effect', 'freemium',
    'pricing strategy', 'market sizing', 'competitive analysis',
    'swot analysis', 'unique selling proposition', 'value proposition',
    'positioning', 'differentiation', 'brand awareness', 'brand equity',
    'brand loyalty', 'brand identity', 'visual identity', 'logo design',
    'packaging design', 'product design', 'user experience', 'ux',
    'customer experience', 'cx', 'customer satisfaction', 'nps',
    'customer support', 'community management', 'social listening',
    'sentiment analysis', 'market trends', 'industry analysis',
    'b2b marketing', 'b2c marketing', 'd2c', 'direct-to-consumer',
    'omnichannel', 'multichannel', 'cross-channel', 'marketing mix',
    '4 ps', '7 ps', 'marketing plan', 'marketing strategy',
    'digital strategy', 'online marketing', 'web marketing',
    'search engine marketing', 'sem', 'local seo', 'mobile marketing',
    'app marketing', 'aso', 'app store optimization', 'video marketing',
    'podcast marketing', 'webinar', 'event marketing', 'trade show',
    'direct mail', 'outdoor advertising', 'billboard', 'guerrilla marketing',
    'ambient marketing', 'experiential marketing', 'word of mouth',
    'referral marketing', 'loyalty program', 'rewards program',
    'subscription model', 'membership', 'retention marketing',
    'win-back', 're-engagement', 'personalization', 'hyper-personalization',
    'marketing analytics', 'data-driven marketing', 'marketing attribution',
    'multi-touch attribution', 'marketing roi', 'marketing budget',
    'marketing technology', 'martech', 'adtech', 'programmatic advertising',
    'display advertising', 'native advertising', 'retargeting',
    'remarketing', 'lookalike audience', 'custom audience', 'audience segmentation',
    'customer data platform', 'cdp', 'data management platform', 'dmp',
    'demand generation', 'lead scoring', 'lead nurturing', 'sales enablement',
    'account-based marketing', 'abm', 'content management system', 'cms',
    'wordpress', 'hubspot', 'salesforce', 'marketo', 'pardot',
    'mailchimp', 'convertkit', 'activecampaign', 'shopify', 'woocommerce',
    'magento', 'bigcommerce', 'wix', 'squarespace'
]

SEEN_TITLES = set()

class WikiHandler(xml.sax.ContentHandler):
    def __init__(self, out_dir, chunk_id):
        self.out_dir = out_dir
        self.chunk_id = chunk_id
        self.current_tag = ""
        self.current_text = ""
        self.in_page = False
        self.in_title = False
        self.in_text = False
        self.in_revision = False
        self.page_title = ""
        self.page_text = ""
        self.page_count = 0
        self.match_count = 0
        self.target = None

    def startElement(self, name, attrs):
        self.current_tag = name
        if name == "page":
            self.in_page = True
            self.page_title = ""
            self.page_text = ""
        elif name == "title" and self.in_page:
            self.in_title = True
            self.current_text = ""
        elif name == "revision" and self.in_page:
            self.in_revision = True
        elif name == "text" and self.in_revision:
            self.in_text = True
            self.current_text = ""

    def endElement(self, name):
        if name == "title" and self.in_title:
            self.page_title = self.current_text.strip()
            self.in_title = False
        elif name == "text" and self.in_text:
            if self.in_page:
                self.page_text = self.current_text
            self.in_text = False
        elif name == "revision":
            self.in_revision = False
        elif name == "page":
            self.in_page = False
            self.page_count += 1
            if self.page_text and self._is_marketing(self.page_title, self.page_text):
                self.match_count += 1
                self._save_article()
                if self.match_count % 10 == 0:
                    sys.stderr.write(f"  chunk {self.chunk_id}: {self.page_count} pages, {self.match_count} matches\n")
            self.page_title = ""
            self.page_text = ""

    def characters(self, content):
        if self.in_title or self.in_text:
            self.current_text += content

    def _is_marketing(self, title, text):
        title_lower = title.lower()
        if title_lower in SEEN_TITLES:
            return False
        title_check = any(kw in title_lower for kw in MARKETING_KEYWORDS)
        if title_check:
            SEEN_TITLES.add(title_lower)
            return True
        text_start = text[:2000].lower()
        text_check = any(kw in text_start for kw in MARKETING_KEYWORDS)
        if text_check:
            SEEN_TITLES.add(title_lower)
            return True
        return False

    def _save_article(self):
        safe_title = re.sub(r'[^\w\s-]', '', self.page_title).strip()[:80]
        safe_title = re.sub(r'[-\s]+', '_', safe_title)
        filename = f"{self.chunk_id:03d}_{safe_title}.md"
        filepath = os.path.join(self.out_dir, filename)
        content = f"# {self.page_title}\n\n{self.page_text.strip()}\n"
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        except:
            pass
        self.target = None

def main():
    chunk_url = sys.argv[1]
    chunk_id = int(sys.argv[2])
    out_dir = sys.argv[3]
    temp_dir = sys.argv[4]

    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    compressed_path = os.path.join(temp_dir, f"wiki_chunk_{chunk_id}.bz2")
    decompressed_path = os.path.join(temp_dir, f"wiki_chunk_{chunk_id}.xml")

    if not os.path.exists(compressed_path):
        sys.stderr.write(f"Downloading chunk {chunk_id}...\n")
        import subprocess
        result = subprocess.run([
            "curl.exe", "-s", "-L", "-o", compressed_path, chunk_url
        ], capture_output=True, text=True)
        if result.returncode != 0:
            sys.stderr.write(f"Download failed: {result.stderr}\n")
            return

    sys.stderr.write(f"Decompressing chunk {chunk_id}...\n")
    with bz2.BZ2File(compressed_path, 'r') as f_in:
        with open(decompressed_path, 'wb') as f_out:
            chunk_size = 64 * 1024 * 1024  # 64MB chunks
            while True:
                data = f_in.read(chunk_size)
                if not data:
                    break
                f_out.write(data)

    sys.stderr.write(f"Parsing chunk {chunk_id}...\n")
    handler = WikiHandler(out_dir, chunk_id)
    parser = xml.sax.make_parser()
    parser.setContentHandler(handler)
    parser.parse(decompressed_path)

    sys.stderr.write(f"Chunk {chunk_id} done: {handler.match_count} marketing articles from {handler.page_count} pages\n")

    os.remove(compressed_path)
    os.remove(decompressed_path)

    meta = {
        "chunk_id": chunk_id,
        "pages": handler.page_count,
        "matches": handler.match_count
    }
    with open(os.path.join(out_dir, f"chunk_{chunk_id}_meta.json"), 'w') as f:
        json.dump(meta, f)

if __name__ == "__main__":
    main()
