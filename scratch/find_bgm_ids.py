import json
import os
import re

movies_dir = "/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies"
bgm_ids = set()

def parse_params(param_str):
    if not param_str:
        return {}
    s = param_str.strip()
    if s.startswith('{'): s = s[1:]
    if s.endswith('}'): s = s[:-1]
    
    result = {}
    tokens = []
    in_quote = False
    quote_char = None
    current = ""
    for char in s:
        if char in ("'", '"'):
            if not in_quote:
                in_quote = True
                quote_char = char
            elif char == quote_char:
                in_quote = False
                quote_char = None
            current += char
        elif char == ',' and not in_quote:
            tokens.append(current.strip())
            current = ""
        else:
            current += char
    if current:
        tokens.append(current.strip())
        
    for token in tokens:
        if ':' not in token:
            continue
        colon_idx = token.find(':')
        key = token[:colon_idx].strip()
        val = token[colon_idx+1:].strip()
        if (key.startswith("'") and key.endswith("'")) or (key.startswith('"') and key.endswith('"')):
            key = key[1:-1]
        if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
            val = val[1:-1]
        result[key] = val
    return result

for filename in os.listdir(movies_dir):
    if not filename.endswith(".json"):
        continue
    filepath = os.path.join(movies_dir, filename)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        for node in data:
            if node.get("Type") == 401:
                params = parse_params(node.get("Params", ""))
                bgm_id = params.get("2")
                if bgm_id:
                    bgm_ids.add(bgm_id)
    except Exception:
        pass

print("All BGM IDs found:")
print(sorted(list(bgm_ids), key=int))
