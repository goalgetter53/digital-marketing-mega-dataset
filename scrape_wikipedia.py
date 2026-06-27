import os, json, time, urllib.request, urllib.parse

OUT = r'C:\Users\Admin\AppData\Local\Temp\opencode\wiki_marketing'
os.makedirs(OUT, exist_ok=True)

# Marketing-related Wikipedia article titles to fetch
TOPICS = [
    "Digital_marketing", "Marketing", "Social_media_marketing", "Search_engine_optimization",
    "Content_marketing", "Email_marketing", "Affiliate_marketing", "Influencer_marketing",
    "Viral_marketing", "Guerrilla_marketing", "Direct_marketing", "Brand_management",
    "Advertising", "Public_relations", "Market_research", "Consumer_behaviour",
    "Marketing_strategy", "Product_management", "Pricing_strategies", "Distribution_(marketing)",
    "Promotion_(marketing)", "Marketing_mix", "Marketing_communications", "Integrated_marketing_communications",
    "Copywriting", "AIDA_(marketing)", "Unique_selling_proposition", "Value_proposition",
    "Brand_equity", "Brand_loyalty", "Customer_relationship_management", "Customer_lifetime_value",
    "Marketing_analytics", "A/B_testing", "Conversion_rate_optimization", "Landing_page",
    "Call_to_action_(marketing)", "Lead_generation", "Sales_funnel", "Customer_journey",
    "Search_engine_marketing", "Pay-per-click", "Google_Ads", "Facebook_Ads",
    "Display_advertising", "Programmatic_advertising", "Retargeting", "Native_advertising",
    "Content_creation", "User-generated_content", "Storytelling_(marketing)", "Brand_storytelling",
    "Neuromarketing", "Color_psychology", "Emotional_marketing", "Scarcity_(marketing)",
    "Social_proof", "Reciprocity_(social_psychology)", "Persuasion_technologies",
    "Growth_hacking", "Product-led_growth", "Go-to-market_strategy",
    "Audience_(target_market)", "Persona_(marketing)", "Market_segmentation",
    "Niche_market", "Mass_marketing", "Microtargeting",
    "Omnichannel", "Multichannel_marketing", "Cross-channel_marketing",
    "Marketing_automation", "Customer_data_platform", "Demand_generation",
    "Thought_leadership", "Personal_branding", "Online_reputation_management",
    "Web_analytics", "Google_Analytics", "Heat_map", "Click-through_rate",
    "Bounce_rate", "Engagement_marketing", "Social_media_analytics",
    "Instagram", "TikTok", "LinkedIn", "Facebook", "Twitter", "YouTube",
    "E-commerce", "Dropshipping", "Conversion_marketing", "Sales",
    "Business-to-business", "Business-to-consumer", "Direct-to-consumer",
    "Podcast", "Webinar", "Online_advertising", "Mobile_marketing",
    "SMS_marketing", "Chatbot", "Customer_service", "Sales_management",
    "Freemium", "Subscription_business_model", "Case_study",
    "Marketing_ethics", "Advertising_standards", "Data_privacy_in_marketing",
    "The_Psychology_of_Persuasion", "Predictive_analytics_in_marketing",
    "Customer_success", "Referral_marketing", "Word-of-mouth_marketing",
    "Inbound_marketing", "Outbound_marketing", "Permission_marketing",
    "Marketing_plan", "Marketing_budget", "Return_on_marketing_investment",
    "Cialdini's_principles_of_persuasion", "Seth_Godin", "Philip_Kotler",
    "David_Ogilvy", "Claude_Hopkins", "John_Caughey",
    "Marketing_warfare_strategies", "Diffusion_of_innovations",
    "Adoption_curve", "Crossing_the_Chasm",
    "Content_management_system", "Customer_experience", "User_experience",
    "AIDA_model", "DAGMAR_model", "RACE_(marketing)", "SOSTAC",
    "PEST_analysis", "SWOT_analysis", "Porter's_five_forces_analysis",
    "BCG_matrix", "Ansoff_matrix", "Marketing_strategies_of_Apple",
    "Marketing_strategies_of_Nike", "Marketing_strategies_of_Coca-Cola"
]

def get_wiki_text(title):
    """Get full Wikipedia article text for a given title"""
    url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exlimit=1&titles={urllib.parse.quote(title)}&explaintext=1&format=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        pages = data.get('query', {}).get('pages', {})
        for page_id, page in pages.items():
            if 'extract' in page and page['extract']:
                return page['extract']
        return None
    except Exception as e:
        print(f'  Error: {e}')
        return None

def main():
    total_size = 0
    total_count = 0
    
    for i, topic in enumerate(TOPICS):
        fpath = os.path.join(OUT, f'{topic}.txt')
        if os.path.exists(fpath):
            total_size += os.path.getsize(fpath)
            total_count += 1
            continue
        
        print(f'[{i+1}/{len(TOPICS)}] {topic}...', end=' ')
        text = get_wiki_text(topic)
        
        if text and len(text) > 100:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(f'Source: Wikipedia\nTitle: {topic.replace("_", " ")}\nURL: https://en.wikipedia.org/wiki/{topic}\n\n{text}')
            size = len(text)
            total_size += size
            total_count += 1
            mb = total_size / (1024*1024)
            print(f'{size/1024:.0f}KB (total: {mb:.2f}MB)')
        else:
            print('no content')
        
        time.sleep(0.3)  # Rate limit
    
    print(f'\n=== Wikipedia: {total_count} articles, {total_size/1024/1024:.2f}MB ===')

if __name__ == '__main__':
    main()
