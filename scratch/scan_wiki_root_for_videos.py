import json
import urllib.request
import re
import random
import time

with open('/home/deist/Downloads/Work/PGR_reader/wiki_db.json', 'r') as f:
    db = json.load(f)

stories = []
for entry in db:
    catId = entry['category']
    chapId = entry['chapterId']
    for sid in entry['storyIds']:
        stories.append((catId, chapId, sid.lower()))

# Let's take a larger sample of 50 stories
sample_stories = random.sample(stories, min(50, len(stories)))

def deserializeNuxtData(dataList):
    resolved = {}
    def resolve(index, pathStack=[]):
        if index is None: return None
        if not isinstance(index, int): return index
        if index in resolved: return resolved[index]
        if index in pathStack: return '[Circular]'
        if index >= len(dataList): return '[OutOfBounds]'
        val = dataList[index]
        if val is None: return val
        if isinstance(val, list):
            arr = []
            resolved[index] = arr
            for item in val:
                arr.append(resolve(item, pathStack + [index]))
            return arr
        if isinstance(val, dict):
            obj = {}
            resolved[index] = obj
            for key, k_idx in val.items():
                obj[key] = resolve(k_idx, pathStack + [index])
            return obj
        resolved[index] = val
        return val
    return resolve(1)

def find_video_keys(obj, path=''):
    results = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_path = f'{path}.{k}' if path else k
            if 'video' in k.lower() or (isinstance(v, str) and ('.mp4' in v.lower() or 'video' in v.lower())):
                results.append((new_path, v))
            results.extend(find_video_keys(v, new_path))
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            new_path = f'{path}[{idx}]'
            results.extend(find_video_keys(item, new_path))
    return results

found_video_metadata = []

for cat, chap, sid in sample_stories:
    url = f'https://huaxu.app/ap/wiki/stories/{cat}/{chap}/{sid}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    print(f'Scanning: {url} ...')
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            scriptMatch = re.search(r'id="__NUXT_DATA__"[^>]*>([\s\S]*?)</script>', html)
            if scriptMatch:
                nuxtData = json.loads(scriptMatch.group(1))
                root = deserializeNuxtData(nuxtData)
                results = find_video_keys(root)
                if results:
                    print(f'  FOUND video reference in {sid}:')
                    for p, val in results:
                        print(f'    Path: {p} -> {val}')
                        found_video_metadata.append((sid, p, val))
            time.sleep(0.15)
    except Exception as e:
        pass

print(f'\nScan complete. Found {len(found_video_metadata)} video references.')
