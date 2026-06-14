import urllib.request
import json
import re
import time

ALL_CATS = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 1000]

def fetch_html(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# Load local wiki_db
try:
    with open('/home/deist/Downloads/Work/PGR_reader/wiki_db.json', 'r') as f:
        local_db = json.load(f)
except Exception as e:
    print(f"Error loading local wiki_db.json: {e}")
    local_db = []

# Get unique (catId, chapId) from local_db
local_chapters = set()
for item in local_db:
    local_chapters.add((int(item['category']), int(item['chapterId'])))

print(f"Loaded {len(local_db)} stages across {len(local_chapters)} chapters from local wiki_db.json.")

missing_chapters = []

for cat in ALL_CATS:
    print(f"Checking category {cat} on huaxu.app...")
    html = fetch_html(f"https://huaxu.app/ap/wiki/stories/{cat}")
    if not html:
        continue
    
    # Extract chapter IDs using regex
    chap_regex = re.compile(rf"/ap/wiki/stories/{cat}/(\d+)(?=['\"\s>])")
    chaps = set(int(m) for m in chap_regex.findall(html))
    
    print(f"Huaxu category {cat} has {len(chaps)} chapters.")
    
    for chap in chaps:
        if (cat, chap) not in local_chapters:
            print(f"  MISSING: Category {cat}, Chapter {chap}")
            missing_chapters.append((cat, chap))
            
    time.sleep(0.3)

print(f"\nVerification complete. Found {len(missing_chapters)} missing chapters on huaxu.app:")
for cat, chap in missing_chapters:
    print(f"  - Category {cat}, Chapter {chap} (URL: https://huaxu.app/ap/wiki/stories/{cat}/{chap})")
