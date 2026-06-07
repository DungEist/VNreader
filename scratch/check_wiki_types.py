import urllib.request
import re
import json

url = 'https://huaxu.app/ap/wiki/stories/1/1031/zx04801ba'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

def deserializeNuxtData(dataList):
    resolved = {}
    def resolve(index, pathStack=[]):
        if index is None: return None
        if not isinstance(index, int): return index
        if index in resolved: return resolved[index]
        if index in pathStack: return f'[Circular reference to {index}]'
        
        if index >= len(dataList):
            return f'[Index {index} out of bounds]'
            
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

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        scriptMatch = re.search(r'id="__NUXT_DATA__"[^>]*>([\s\S]*?)</script>', html)
        if scriptMatch:
            nuxtData = json.loads(scriptMatch.group(1))
            root = deserializeNuxtData(nuxtData)
            
            actions = None
            fetchedData = root.get('data', [])
            if isinstance(fetchedData, list) and len(fetchedData) > 1:
                reactiveObj = fetchedData[1]
                if isinstance(reactiveObj, dict):
                    for key, val in reactiveObj.items():
                        if isinstance(val, dict) and 'movie' in val:
                            actions = val['movie'].get('actions', [])
                            break
            
            if actions:
                print('Found actions list! Count:', len(actions))
                types = {}
                for act in actions:
                    act_type = act.get('type')
                    types[act_type] = types.get(act_type, 0) + 1
                print('Action Types in wiki:', types)
                print('\nSample action structures:')
                seen_types = set()
                for act in actions:
                    act_type = act.get('type')
                    if act_type not in seen_types:
                        seen_types.add(act_type)
                        print(f'Type {act_type}:', act)
            else:
                print('No actions found in Nuxt data.')
        else:
            print('NUXT_DATA script tag not found.')
except Exception as e:
    print('Error:', e)
