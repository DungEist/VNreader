import json
import os
import re

movie_path = "/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies/MovieHD03101BA.json"
audio_root = "/home/deist/Downloads/Work/pgr_extracted/audio"
voiceLanguage = "ja"

voiceFolderMap = {
  'v215alpha': 'v_luciaalpha',
  'v211lamiya': 'v_lamiya',
  'v320luxiya': 'v_lucia',
  'v360selena': 'v_selenasups',
  'v420bianka': 'v_biankasuper'
}

with open(movie_path, "r", encoding="utf-8") as f:
    movie_data = json.load(f)

def parse_params(param_str):
    if not param_str:
        return {}
    s = param_str.strip()
    if s.startswith('{'): s = s[1:]
    if s.endswith('}'): s = s[:-1]
    
    result = {}
    # Use split by comma outside quotes
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

for i, node in enumerate(movie_data):
    if node.get("Type") == 301:
        params = parse_params(node.get("Params", ""))
        cue_id = params.get("18")
        param19 = params.get("19")
        voice_folder = params.get("21")
        speaker = params.get("2")
        text = params.get("3")
        
        if cue_id and voice_folder:
            baseFolder = voiceFolderMap.get(voice_folder, re.sub(r'^v\d+', 'v_', voice_folder))
            idStr = str(cue_id)
            last2 = idStr[-2:]
            last3 = idStr[-3:]
            last2Num = int(last2)
            
            candidates = []
            if param19:
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last3}_{param19}.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_1.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_2.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_1_1.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_1_2.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_2_1.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_{last2}_{param19}_2_2.mp3")
            
            candidates.append(f"{baseFolder}/{baseFolder}_{last2}.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last3}.mp3")
            
            if last2Num >= 71 and last2Num <= 90:
                candidates.append(f"{baseFolder}/{baseFolder}_9_{last2Num - 70}.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_9_{last2Num - 70}_1.mp3")
            if last2Num >= 25 and last2Num <= 45:
                candidates.append(f"{baseFolder}/{baseFolder}_9_{last2Num - 24}.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_9_{last2Num - 24}_1.mp3")
            if last2Num >= 41 and last2Num <= 49:
                candidates.append(f"{baseFolder}/{baseFolder}_18_{last2Num - 40}.mp3")
                candidates.append(f"{baseFolder}/{baseFolder}_18_{last2Num - 40}_1.mp3")
                
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_1.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_2.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_1_1.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_1_2.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_2_1.mp3")
            candidates.append(f"{baseFolder}/{baseFolder}_{last2Num}_2_2.mp3")
            
            found = None
            for cand in candidates:
                full_path = os.path.join(audio_root, voiceLanguage, cand)
                if os.path.exists(full_path):
                    found = cand
                    break
            
            print(f"Node {i} | Speaker: {speaker} | Folder: {voice_folder} | Cue: {cue_id} | Match: {found}")
