import os, subprocess, time

OUT = r'C:\Users\Admin\AppData\Local\Temp\opencode\gutenberg_books'
os.makedirs(OUT, exist_ok=True)

# Marketing, advertising, psychology, business books on Project Gutenberg
# (id, title)
BOOKS = [
    # Advertising & Marketing Classics
    (7190, "Scientific Advertising - Claude Hopkins"),
    (20436, "The Psychology of Advertising - Walter Dill Scott"),
    (14326, "How to Write Advertisements - Various"),
    (13241, "The Art of Advertising - Various"),
    (17491, "The Man Who Sold the Earth"),
    (25725, "Advertising and Its Mental Laws"),
    (21076, "The Business of Advertising"),
    (12703, "The Theory of Advertising"),
    (16229, "The History of Advertising"),
    (20569, "The Principles of Advertising"),
    (28358, "Advertising, Its Principles and Practice"),
    (19143, "How to Become an Expert in Advertising"),
    
    # Consumer Psychology
    (24844, "The Theory of the Leisure Class - Thorstein Veblen"),
    (25832, "The Psychology of Salesmanship"),
    (12889, "The Psychology of Selling"),
    (27313, "The Mind in Business"),
    (27894, "The Psychology of Management"),
    (17141, "The Will to Believe - William James"),
    (12131, "How We Think - John Dewey"),
    (22735, "The Power of the Will"),
    (26873, "The Psychology of Peoples"),
    
    # Business & Management
    (26208, "The Art of Money Getting - P.T. Barnum"),
    (24444, "How to Succeed - Orison Swett Marden"),
    (24445, "The Secret of Achievement - Marden"),
    (24446, "An Iron Will - Marden"),
    (25641, "The Way to Prosperity"),
    (21079, "The Young Man's Guide"),
    (16389, "Self-Help - Samuel Smiles"),
    (22180, "Character - Samuel Smiles"),
    (27604, "The Richest Man in Babylon"),
    (20287, "Acres of Diamonds"),
    (25727, "As a Man Thinketh - James Allen"),
    (27525, "The Science of Getting Rich"),
    (20920, "The Art of Success"),
    (18546, "The Golden Fountain"),
    
    # Sales & Persuasion
    (17023, "The Art of Public Speaking"),
    (27209, "How to Speak Effectively"),
    (22075, "The Power of Concentration"),
    (20199, "Self Mastery Through Conscious Autosuggestion"),
    (25762, "The Power of Thought"),
    (27665, "The Art of Conversation"),
    (21415, "How to Attract and Hold an Audience"),
    (22118, "The Influence of the Crowd"),
    
    # Mass Psychology & Influence
    (24554, "The Crowd - Gustave Le Bon"),
    (16462, "Psychology of the Unconscious - Jung"),
    (23169, "The Psychology of Revolution - Le Bon"),
    (16824, "Group Psychology and the Analysis of the Ego - Freud"),
    (25298, "The Analysis of Mind - Bertrand Russell"),
    
    # Economics & Market Behavior  
    (18771, "The Wealth of Nations - Adam Smith (Book I)"),
    (7551, "The Wealth of Nations (Complete)"),
    (28221, "The Theory of Moral Sentiments - Adam Smith"),
    (23040, "Principles of Economics - Carl Menger"),
    (43319, "The Economic Consequences of the Peace - Keynes"),
    (25642, "Common Sense Economics"),
    (19962, "The Economics of War"),
    (20286, "Political Economy"),
    
    # Biographies of Marketing/Business Figures
    (26318, "The Autobiography of Benjamin Franklin"),
    (24855, "The Autobiography of Andrew Carnegie"),
    (21569, "The Life of P.T. Barnum"),
    (24564, "My Life and Work - Henry Ford"),
    (27770, "The Story of My Life - Helen Keller"),
    (22036, "The Autobiography of John D. Rockefeller"),
    
    # Writing & Communication
    (521, "The Elements of Style - Strunk"),
    (22317, "The Art of Writing"),
    (24818, "How to Write Clearly"),
    (23028, "The English Language"),
    
    # Additional Marketing/Business
    (20786, "The Art of Business"),
    (26866, "The Business Man's Library"),
    (25640, "How to Start in Business"),
    (21685, "The Principles of Scientific Management"),
    (24856, "The Philosophy of Wealth"),
    (20777, "Getting Gold - A Mining Business Guide"),
    (21064, "Business Organization"),
    (20572, "The Stock Exchange"),
    (24578, "The Law of Success"),
    (27295, "Thoughts on Business"),
]

def download_book(book_id, title):
    fname = f'{book_id}_{title[:50].replace("/","_").replace(" ","_")}.txt'
    fpath = os.path.join(OUT, fname)
    
    if os.path.exists(fpath):
        return os.path.getsize(fpath)
    
    url = f'https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt'
    try:
        r = subprocess.run(
            ['curl.exe', '-L', '--max-time', '30', '-s', url],
            capture_output=True, timeout=35
        )
        if r.returncode == 0 and len(r.stdout) > 1000:
            text = r.stdout.decode('utf-8', errors='replace')
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(text)
            return len(r.stdout)
        else:
            url2 = f'https://www.gutenberg.org/ebooks/{book_id}.txt.utf-8'
            r = subprocess.run(
                ['curl.exe', '-L', '--max-time', '30', '-s', url2],
                capture_output=True, timeout=35
            )
            if r.returncode == 0 and len(r.stdout) > 1000:
                text = r.stdout.decode('utf-8', errors='replace')
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(text)
                return len(r.stdout)
            return 0
    except:
        return 0

total_size = 0
total_count = 0

for bid, title in BOOKS:
    size = download_book(bid, title)
    if size > 0:
        total_size += size
        total_count += 1
        mb = total_size / (1024*1024)
        print(f'[{total_count}] {title[:60]} - {size/1024:.0f}KB (total: {mb:.1f}MB)')
    else:
        print(f'[FAIL] {bid} - {title[:50]}')
    time.sleep(1)  # Be polite

print(f'\n=== FINAL: {total_count} books, {total_size/1024/1024:.1f}MB ===')
