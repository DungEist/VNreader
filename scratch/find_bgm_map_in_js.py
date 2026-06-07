import urllib.request
import re
import json

js_files = [
    "hV9Ww6fr.js",
    "DX14hhsE.js",
    "OJQuSTvy.js",
    "Di9-gNSS.js",
    "CRl0puWv.js",
    "BwFd-4DC.js",
    "dLgCVWRs.js",
    "OyCX9lXy.js",
    "DG1GIIQ1.js",
    "Bz8M3gAv.js",
    "pjn8NRh5.js"
]

found_matches = []

for filename in js_files:
    url = f"https://huaxu.app/_nuxt/{filename}"
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
        
        # Search for BGM mapping keywords
        if "avg_beforebattle" in content or "avg_general" in content or "BGM-" in content:
            print(f"!!! Found keywords in {filename} !!!")
            # Let's save a snippet around the matches
            for match in re.finditer(r"avg_beforebattle|avg_general", content):
                start = max(0, match.start() - 200)
                end = min(len(content), match.end() + 200)
                print(f"Snippet in {filename}:")
                print(content[start:end])
                print("-" * 50)
                found_matches.append((filename, content[start:end]))
    except Exception as e:
        print(f"Error fetching {filename}: {e}")

print("Done searching.")
