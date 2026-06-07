import json
import urllib.request
import re
import random
import time

with open('/home/deist/Downloads/Work/PGR_reader/wiki_db.json', 'r') as f:
    db = json.load(f)

# Collect all story IDs
stories = []
for entry in db:
    catId = entry['category']
    chapId = entry['chapterId']
    for sid in entry['storyIds']:
        stories.append((catId, chapId, sid.lower()))

print(f'Total stories in db: {len(stories)}')

# Select a sample of 40 stories, prioritizing ones with 'EX' or ending chapters which often have video cutscenes
sample_stories = []
for cat, chap, sid in stories:
    if 'ex' in sid or 'ea' in sid or cat in ['8', '14']:
        sample_stories.append((cat, chap, sid))
if len(sample_stories) < 40:
    sample_stories += [s for s in stories if s not in sample_stories]

sample_stories = random.sample(sample_stories, min(40, len(sample_stories)))

def deserializeNuxtData(dataList):
    resolved = {}
    def resolve(index, pathStack=[]):
        if index is None: return None
        if not isinstance(index, int): return index
        if index in resolved: return resolved[index]
        if index in pathStack: return f'[Circular]'
        if index >= len(dataList): return f'[OutOfBounds]'
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

video_actions = []

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
                fetchedData = root.get('data', [])
                actions = None
                if isinstance(fetchedData, list) and len(fetchedData) > 1:
                    reactiveObj = fetchedData[1]
                    if isinstance(reactiveObj, dict):
                        for key, val in reactiveObj.items():
                            if isinstance(val, dict) and 'movie' in val:
                                actions = val['movie'].get('actions', [])
                                break
                if actions:
                    for act in actions:
                        act_str = json.dumps(act).lower()
                        if 'video' in act_str or '.mp4' in act_str or 'playvideo' in act_str:
                            video_actions.append((sid, act))
                            print(f'  FOUND video action in {sid}: {act}')
            time.sleep(0.2)
    except Exception as e:
        print(f'  Error scanning {sid}: {e}')

print(f'\nScan complete. Found {len(video_actions)} video actions.')
for sid, act in video_actions:
    print(f'Story {sid}: {act}')
