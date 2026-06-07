import urllib.request
import re
import json

url = "https://huaxu.app/ap/wiki/stories"
print(f"Fetching story list from {url}...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    js_files = list(set(re.findall(r'/_nuxt/([a-zA-Z0-9_-]+\.js)', html)))
    print("Found Nuxt JS files:", js_files)
    
    for filename in js_files:
        js_url = f"https://huaxu.app/_nuxt/{filename}"
        print(f"Checking {js_url}...")
        try:
            req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_js) as response_js:
                content = response_js.read().decode('utf-8')
            
            # Look for common BGM folder names like avg_beforebattle or avg_spaceship
            if "avg_beforebattle" in content or "avg_spaceship" in content or "avg_daily" in content:
                print(f"\n!!! MATCH FOUND IN {filename} !!!")
                # Print a few matches or write a snippet
                for match in re.finditer(r"avg_beforebattle|avg_spaceship", content):
                    start = max(0, match.start() - 300)
                    end = min(len(content), match.end() + 300)
                    print(f"--- Snippet around match ---")
                    print(content[start:end])
                    print("-----------------------------")
        except Exception as e:
            print(f"Error checking {filename}: {e}")
            
except Exception as e:
    print(f"Failed to fetch story list: {e}")
