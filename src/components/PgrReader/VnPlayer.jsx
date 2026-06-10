import { useState, useEffect, useRef } from 'react';
import HistoryLog from './HistoryLog';
import LoreCodex from './LoreCodex';
import { BookOpen, ArrowLeft, Play, FastForward, List, Bookmark, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { parseRichTextToSegments } from './richTextParser';
import audioMapData from './audio_map.json';

const resolveAssetPath = (path) => {
  if (!path) return '';
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron();
  if (isElectron) {
    if (path.startsWith('/pgr_data/')) {
      return `pgr-asset://data/${path.slice(10)}`;
    }
    if (path.startsWith('/pgr_audio/')) {
      return `pgr-asset://audio/${path.slice(11)}`;
    }
    if (path.startsWith('/pgr_assets/')) {
      return `pgr-asset://assets/${path.slice(12)}`;
    }
  }
  return path;
};

const resolveWikiUrl = (subpath) => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron();
  if (isElectron) {
    return `https://huaxu.app${subpath}`;
  }
  return subpath;
};

const voiceFolderMap = {
  'v215alpha': 'v_luciaalpha',
  'v211lamiya': 'v_lamiya',
  'v320luxiya': 'v_lucia',
  'v360selena': 'v_selenasups',
  'v420bianka': 'v_biankasuper'
};

const bgmMap = {
  '10': 'avg_general',
  '18': 'avg_daily',
  '36': 'avg_beforebattle',
  '119': 'avg_sad',
  '215': 'avg_mysterious',
  '558': 'avg_memory',
  '754': 'avg_silence',
  '1508': 'avg_spaceship',
  '1515': 'avg_overlook',
  '2959': 'avg_funny',
  '4331': 'avg_joyofvictory'
};

function deserializeNuxtData(dataList) {
  const resolved = new Map();
  function resolve(index, pathStack = []) {
    if (index === null || index === undefined) return null;
    if (typeof index !== 'number') return index;
    if (resolved.has(index)) return resolved.get(index);
    if (pathStack.includes(index)) return `[Circular reference to ${index}]`;

    const val = dataList[index];
    if (val === null || val === undefined) return val;

    if (Array.isArray(val)) {
      const arr = [];
      resolved.set(index, arr);
      val.forEach(item => {
        arr.push(resolve(item, [...pathStack, index]));
      });
      return arr;
    }

    if (typeof val === 'object') {
      const obj = {};
      resolved.set(index, obj);
      for (const key in val) {
        obj[key] = resolve(val[key], [...pathStack, index]);
      }
      return obj;
    }

    resolved.set(index, val);
    return val;
  }
  return resolve(1);
}


function renderSegmentsIncrementally(segments, charCount) {
  let displayedCount = 0;
  const elements = [];
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (displayedCount >= charCount) break;
    
    const remaining = charCount - displayedCount;
    const textToShow = seg.text.slice(0, remaining);
    displayedCount += textToShow.length;
    
    elements.push(
      <span key={i} style={seg.style}>
        {textToShow}
      </span>
    );
  }
  return elements;
}

function VnCharacter({ bodySprite, faceSprite, facePosX, facePosY, name }) {
  const [bodyDims, setBodyDims] = useState({ width: 1000, height: 1080 });
  const [faceDims, setFaceDims] = useState(null);

  const posX = facePosX !== undefined && facePosX !== null ? facePosX : 500;
  const posY = facePosY !== undefined && facePosY !== null ? facePosY : -540;

  return (
    <div className="pgr-vn-character-wrapper" style={{ position: 'relative', height: '100%', display: 'inline-block' }}>
      <img 
        src={bodySprite} 
        alt={name} 
        onLoad={(e) => {
          setBodyDims({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
          });
        }}
        className="pgr-vn-character-body" 
        style={{ height: '100%', width: 'auto', display: 'block', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))' }}
      />
      {faceSprite && (
        <img 
          src={faceSprite} 
          alt={`${name} face`}
          onLoad={(e) => {
            setFaceDims({
              width: e.target.naturalWidth,
              height: e.target.naturalHeight
            });
          }}
          className="pgr-vn-character-face" 
          style={{
            position: 'absolute',
            left: `${(posX / bodyDims.width) * 100}%`,
            top: `${(Math.abs(posY) / bodyDims.height) * 100}%`,
            width: faceDims ? `${(faceDims.width / bodyDims.width) * 100}%` : '24%',
            transform: 'translate(-50%, -50%)',
            display: 'block'
          }} 
        />
      )}
    </div>
  );
}

const VOICE_STORAGE_KEY = 'pgr_voice_lang';

export default function VnPlayer({ storyId, onBack, onNextStory, initialLang }) {
  const [actors, setActors] = useState([]);
  const [roleFaces, setRoleFaces] = useState([]);
  const [script, setScript] = useState([]);
  const [storyIndex, setStoryIndex] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [background, setBackground] = useState('');
  const [currentMusic, setCurrentMusic] = useState('');
  const [bgOverlays, setBgOverlays] = useState({});
  const [showNextChapterPopup, setShowNextChapterPopup] = useState(false);
  const [slots, setSlots] = useState({
    1: null,
    2: null,
    3: null
  });
  
  const [dialogue, setDialogue] = useState({
    speaker: '',
    text: '',
    activeSlots: []
  });
  const [choices, setChoices] = useState([]);
  const [displayedText, setDisplayedText] = useState('');
  const [textTypingComplete, setTextTypingComplete] = useState(false);

  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [history, setHistory] = useState([]);

  const [showHistory, setShowHistory] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const typingTimerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  const [voiceLanguage, setVoiceLanguageSt] = useState(
    () => initialLang || localStorage.getItem(VOICE_STORAGE_KEY) || 'ja'
  );
  // Wrap setter to also persist
  const setVoiceLanguage = (lang) => {
    setVoiceLanguageSt(lang);
    localStorage.setItem(VOICE_STORAGE_KEY, lang);
  };
  const [isMuted, setIsMuted] = useState(false);
  const [wikiVoiceMap, setWikiVoiceMap] = useState({}); // actionId -> direct voice audio path from wiki
  const [wikiBgMap, setWikiBgMap]       = useState({}); // actionId -> background image path from wiki
  
  const voiceAudioRef = useRef(null);
  const bgmAudioRef = useRef(null);

  const [activeBgmMap, setActiveBgmMap] = useState(() => ({
    ...audioMapData.bgmMap,
    ...bgmMap
  }));
  const [activeSfxMap, setActiveSfxMap] = useState(() => ({
    ...audioMapData.sfxMap
  }));

  const activeSfxRef = useRef({});

  const replacePlayerName = (str) => {
    if (!str) return '';
    const name = localStorage.getItem('pgr_player_name') || 'Commandant';
    return str
      .replace(/【kuroname】/gi, name)
      .replace(/\[kuroname\]/gi, name)
      .replace(/kuroname/gi, name);
  };

  const triggerSfxPlay = (soundId) => {
    if (activeSfxRef.current[soundId]) {
      activeSfxRef.current[soundId].pause();
      delete activeSfxRef.current[soundId];
    }
    const sfxPath = activeSfxMap[soundId];
    if (!sfxPath) {
      console.warn('Unknown SFX ID:', soundId);
      return;
    }
    const audioPath = resolveAssetPath(`/pgr_audio/${sfxPath}.mp3`);
    const audio = new Audio(audioPath);
    audio.volume = 0.65;
    activeSfxRef.current[soundId] = audio;
    audio.onended = () => {
      if (activeSfxRef.current[soundId] === audio) {
        delete activeSfxRef.current[soundId];
      }
    };
    audio.play().catch(err => {
      console.warn('Failed to play SFX:', audioPath, err);
      if (activeSfxRef.current[soundId] === audio) {
        delete activeSfxRef.current[soundId];
      }
    });
  };

  const getAssetUrl = (rawPath) => {
    if (!rawPath) return '';
    let path = rawPath.toLowerCase();
    if (path.startsWith('assets/')) {
      path = path.slice(7);
    }
    if (path.endsWith('.png') || path.endsWith('.jpg')) {
      path = path.slice(0, path.lastIndexOf('.')) + '.webp';
    }
    return resolveAssetPath(`/pgr_assets/${path}`);
  };

  const parseFaceLookArray = (arrayStr) => {
    if (!arrayStr) return [];
    try {
      const normalized = arrayStr.replace(/'/g, '"');
      return JSON.parse(normalized);
    } catch (err) {
      return [];
    }
  };

  const parseParams = (str) => {
    if (!str) return {};
    let s = str.trim();
    if (s.startsWith('{')) s = s.slice(1);
    if (s.endsWith('}')) s = s.slice(0, -1);
    
    const result = {};
    let inQuote = false;
    let quoteChar = null;
    let currentToken = '';
    const tokens = [];
    
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      if ((char === "'" || char === '"') && s[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
          quoteChar = null;
        }
        currentToken += char;
      } else if (char === ',' && !inQuote) {
        tokens.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    if (currentToken) {
      tokens.push(currentToken.trim());
    }
    
    for (const token of tokens) {
      const colonIndex = token.indexOf(':');
      if (colonIndex === -1) continue;
      let key = token.slice(0, colonIndex).trim();
      let val = token.slice(colonIndex + 1).trim();
      
      if ((key.startsWith("'") && key.endsWith("'")) || (key.startsWith('"') && key.endsWith('"'))) {
        key = key.slice(1, -1);
      }
      
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
        val = val.replace(/\\'/g, "'").replace(/\\"/g, '"');
      } else if (val === 'null') {
        val = null;
      }
      
      result[key] = val;
    }
    return result;
  };

  const triggerVoicePlay = (cueId, param19, voiceFolder) => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }

    const baseFolder = voiceFolderMap[voiceFolder] || voiceFolder.replace(/^v\d+/, 'v_');
    const idStr = String(cueId);
    const last2 = idStr.slice(-2);
    const last3 = idStr.slice(-3);
    const last2Num = parseInt(last2);
    
    const candidates = [];
    if (param19) {
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last3}_${param19}.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_1.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_2.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_1_1.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_1_2.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_2_1.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}_${param19}_2_2.mp3`);
    }
    
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2}.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last3}.mp3`);
    
    if (last2Num >= 71 && last2Num <= 90) {
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_9_${last2Num - 70}.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_9_${last2Num - 70}_1.mp3`);
    }
    if (last2Num >= 25 && last2Num <= 45) {
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_9_${last2Num - 24}.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_9_${last2Num - 24}_1.mp3`);
    }
    if (last2Num >= 41 && last2Num <= 49) {
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_18_${last2Num - 40}.mp3`);
      candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_18_${last2Num - 40}_1.mp3`);
    }
    
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_1.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_2.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_1_1.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_1_2.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_2_1.mp3`);
    candidates.push(`/pgr_audio/${voiceLanguage}/${baseFolder}/${baseFolder}_${last2Num}_2_2.mp3`);
    
    const playNext = (index) => {
      if (index >= candidates.length) return;
      const path = candidates[index];
      const audio = new Audio(resolveAssetPath(path));
      audio.volume = 0.85;
      audio.play().then(() => {
        voiceAudioRef.current = audio;
      }).catch(() => {
        playNext(index + 1);
      });
    };

    playNext(0);
  };

  // Play BGM when currentMusic changes
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current = null;
    }

    if (isMuted || !currentMusic) return;

    const match = currentMusic.match(/BGM-(\d+)/);
    if (!match) return;
    const bgmId = match[1];
    const bgmName = activeBgmMap[bgmId];
    if (!bgmName) return;

    let folderName = bgmName;
    if (!/^(g|c|m|mb|me|mo|pgn)_/.test(bgmName)) {
      folderName = `m_${bgmName}`;
    }
    const bgmPath = resolveAssetPath(`/pgr_audio/${folderName}/${folderName}.mp3`);
    const audio = new Audio(bgmPath);
    audio.loop = true;
    audio.volume = 0.4;
    bgmAudioRef.current = audio;
    audio.play().catch(err => {
      console.warn('Failed to play BGM:', bgmPath, err);
      if (bgmAudioRef.current === audio) {
        bgmAudioRef.current = null;
      }
    });

    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
    };
  }, [currentMusic, isMuted, activeBgmMap]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      if (activeSfxRef.current) {
        Object.keys(activeSfxRef.current).forEach(soundId => {
          if (activeSfxRef.current[soundId]) {
            activeSfxRef.current[soundId].pause();
          }
        });
        activeSfxRef.current = {};
      }
    };
  }, []);

  // Stop voice audio when skipping
  useEffect(() => {
    if (isSkipping && voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
  }, [isSkipping]);

  useEffect(() => {
    const loadStory = async () => {
      setIsLoading(true);
      try {
        const actorsRes = await fetch(resolveAssetPath('/pgr_data/MovieActor.json'));
        const actorsData = await actorsRes.json();
        setActors(actorsData);

        const facesRes = await fetch(resolveAssetPath('/pgr_data/MovieRoleFace.json'));
        const facesData = await facesRes.json();
        setRoleFaces(facesData);

        const scriptRes = await fetch(resolveAssetPath(`/pgr_data/movies/Movie${storyId}.json`));
        const scriptData = await scriptRes.json();
        setScript(scriptData);

        try {
          const indexRes = await fetch(resolveAssetPath('/pgr_data/story_index.json'));
          const indexData = await indexRes.json();
          setStoryIndex(indexData);
        } catch (idxErr) {
          console.error('Failed to load story index in VnPlayer:', idxErr);
        }

        // Stop all active SFX on story reload
        if (activeSfxRef.current) {
          Object.keys(activeSfxRef.current).forEach(soundId => {
            if (activeSfxRef.current[soundId]) {
              activeSfxRef.current[soundId].pause();
            }
          });
          activeSfxRef.current = {};
        }

        setStepIndex(0);
        setBackground('');
        setCurrentMusic('');
        setBgOverlays({});
        setShowNextChapterPopup(false);
        setSlots({ 1: null, 2: null, 3: null });
        setDialogue({ speaker: '', text: '', activeSlots: [] });
        setChoices([]);
        setHistory([]);
        setWikiVoiceMap({});
        setWikiBgMap({});

        // Resolve dynamic BGM/SFX mappings from huaxu.app
        try {
          const wikiDbRes = await fetch('./wiki_db.json');
          const wikiDb = await wikiDbRes.json();
          
          const normalizeId = (id) => id.toUpperCase().replace(/^HD/, 'ZX');
          const normalizedTarget = normalizeId(storyId);
          
          let matchedWikiStoryId = null;
          const stageEntry = wikiDb.find(entry => {
            if (!entry.storyIds) return false;
            const match = entry.storyIds.find(id => normalizeId(id) === normalizedTarget);
            if (match) {
              matchedWikiStoryId = match;
              return true;
            }
            return false;
          });
          
          if (stageEntry && matchedWikiStoryId) {
            const catId = stageEntry.category;
            const chapterId = stageEntry.chapterId;
            const wikiUrl = resolveWikiUrl(`/ap/wiki/stories/${catId}/${chapterId}/${matchedWikiStoryId.toLowerCase()}`);
            
            console.log('Fetching dynamic audio map from proxied wiki URL:', wikiUrl);
            const wikiRes = await fetch(wikiUrl);
            if (wikiRes.status === 200) {
              const html = await wikiRes.text();
              const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
              if (scriptMatch) {
                const nuxtData = JSON.parse(scriptMatch[1]);
                const rootResolved = deserializeNuxtData(nuxtData);
                
                let actions = null;
                const fetchedData = rootResolved.data;
                if (Array.isArray(fetchedData)) {
                  const reactiveObj = fetchedData[1];
                  for (const key in reactiveObj) {
                    if (reactiveObj[key] && reactiveObj[key].movie) {
                      actions = reactiveObj[key].movie.actions;
                      break;
                    }
                  }
                }
                
                if (actions) {
                  const newBgmMap   = {};
                  const newSfxMap   = {};
                  const newVoiceMap = {}; // actionId -> voice path
                  const newBgMap    = {}; // actionId -> bg image path

                  actions.forEach(wikiAct => {
                    if (wikiAct.type === 'SoundPlay') {
                      const localAct = scriptData.find(n => n.ActionId === wikiAct.actionId);
                      if (localAct && localAct.Type === 401) {
                        const params = parseParams(localAct.Params);
                        const soundId = params[2];
                        const soundType = params[1];
                        if (soundId && wikiAct.audio) {
                          let cleanPath = wikiAct.audio;
                          if (cleanPath.startsWith('audio/')) cleanPath = cleanPath.slice(6);
                          if (soundType === '1' || wikiAct.soundType === 1) {
                            let bgmName = cleanPath.split('/')[0];
                            if (bgmName.startsWith('m_')) bgmName = bgmName.slice(2);
                            newBgmMap[soundId] = bgmName;
                          } else {
                            newSfxMap[soundId] = cleanPath;
                          }
                        }
                      }
                    }
                    // Map Dialog voice audio: wiki has exact path per actionId
                    else if (wikiAct.type === 'Dialog' && wikiAct.audio) {
                      let voicePath = wikiAct.audio;
                      if (voicePath.startsWith('audio/')) voicePath = voicePath.slice(6);
                      newVoiceMap[wikiAct.actionId] = voicePath;
                    }
                    // Map BgSwitch: wiki has exact image path per actionId
                    else if (wikiAct.type === 'BgSwitch' && wikiAct.image) {
                      // image format: 'image/bgstory/bgstoryXXX' -> prepend 'product/texture/'
                      const imgPath = `product/texture/${wikiAct.image}.webp`;
                      newBgMap[wikiAct.actionId] = resolveAssetPath(`/pgr_assets/${imgPath}`);
                    }
                  });

                  console.log(`Dynamically mapped ${Object.keys(newBgmMap).length} BGMs, ${Object.keys(newSfxMap).length} SFXs, ${Object.keys(newVoiceMap).length} voices, ${Object.keys(newBgMap).length} BgSwitch`);
                  setActiveBgmMap(prev => ({ ...prev, ...newBgmMap, ...bgmMap }));
                  setActiveSfxMap(prev => ({ ...prev, ...newSfxMap }));
                  setWikiVoiceMap(newVoiceMap);
                  setWikiBgMap(newBgMap);
                }
              }
            }
          }
        } catch (audioErr) {
          console.warn('Failed to load dynamic audio map:', audioErr);
        }

      } catch (err) {
        console.error('Error loading story files:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (storyId) {
      loadStory();
    }
  }, [storyId]);

  const reconstructStateAtStep = (targetStep) => {
    let currentBackground = '';
    let currentMusicState = '';
    let currentSlots = { 1: null, 2: null, 3: null };
    let currentBgOverlays = {};
    
    for (let i = 0; i <= targetStep; i++) {
      const node = script[i];
      if (!node) continue;
      const params = parseParams(node.Params);
      
      if (node.Type === 101) {
        const wikiBg = wikiBgMap[node.ActionId];
        const bgUrl = wikiBg || (params[1] ? getAssetUrl(params[1]) : '');
        if (params[4]) {
          const layerId = params[4];
          if (bgUrl) {
            const isFront = bgUrl.toLowerCase().includes('bgstoryfront');
            currentBgOverlays[`101_${layerId}`] = {
              url: bgUrl,
              depth: isFront ? '1.5' : '0.5',
              opacity: 1
            };
          } else {
            delete currentBgOverlays[`101_${layerId}`];
          }
        } else {
          if (bgUrl) {
            currentBackground = bgUrl;
          }
        }
      }
      else if (node.Type === 201 || node.Type === 211) {
        const slotId = params[1];
        const roleId = params[2];
        const exprIndex = params[3];
        const xOffset = params[4];
        
        const actor = actors.find(a => a.RoleId === parseInt(roleId));
        if (actor) {
          let faceSprite = null;
          if (exprIndex) {
            const faceMap = roleFaces.find(f => f.RoleId === parseInt(roleId));
            if (faceMap) {
              const faceList = parseFaceLookArray(faceMap.FaceLook);
              const exprIdStr = exprIndex.toString();
              let resolvedFace = faceList[parseInt(exprIndex) - 1];
              if (!resolvedFace) {
                resolvedFace = faceList.find(f => f.includes(`_${exprIdStr.padStart(2, '0')}.`) || f.includes(`_${exprIdStr}.`));
              }
              if (resolvedFace) {
                faceSprite = getAssetUrl(resolvedFace);
              }
            }
          }
          currentSlots[slotId] = {
            roleId,
            name: actor.Name,
            bodySprite: getAssetUrl(actor.RoleIcon),
            faceSprite,
            facePosX: actor.FacePosX,
            facePosY: actor.FacePosY,
            xOffset: xOffset || '0',
            isDimmed: false
          };
        }
      }
      else if (node.Type === 202 || node.Type === 212) {
        const slotsToClear = [params[1], params[2], params[3]].filter(Boolean);
        slotsToClear.forEach(id => {
          currentSlots[id] = null;
        });
      }
      else if (node.Type === 203 || node.Type === 213) {
        const slotId = params[1];
        const newXOffset = params[3];
        if (currentSlots[slotId]) {
          currentSlots[slotId] = {
            ...currentSlots[slotId],
            xOffset: newXOffset || '0'
          };
        }
      }
      else if (node.Type === 204 || node.Type === 214) {
        // Change face expression of character in slot
        const slotId = params[1];
        const exprIndex = params[2];
        if (currentSlots[slotId] && exprIndex) {
          const roleId = currentSlots[slotId].roleId;
          const faceMap = roleFaces.find(f => f.RoleId === parseInt(roleId));
          if (faceMap) {
            const faceList = parseFaceLookArray(faceMap.FaceLook);
            const exprIdStr = exprIndex.toString();
            let resolvedFace = faceList[parseInt(exprIndex) - 1];
            if (!resolvedFace) {
              resolvedFace = faceList.find(f => f.includes(`_${exprIdStr.padStart(2, '0')}.`) || f.includes(`_${exprIdStr}.`));
            }
            if (resolvedFace) {
              currentSlots[slotId] = {
                ...currentSlots[slotId],
                faceSprite: getAssetUrl(resolvedFace)
              };
            }
          }
        }
      }
      else if (node.Type === 205) {
        // Type 205: overlay sprite/image
        // param[1]=slotId, param[2]=assetPath OR RoleId (numeric), param[3]=showFlag, param[4]=opacity, param[5]=depth
        const slotId = params[1];
        const assetOrRole = params[2];
        const showFlag = params[3];  // '0'=hide/remove, '1'=show
        const opacity = params[4];
        const depth = params[5];

        const isHide = !assetOrRole || showFlag === '0';
        if (isHide) {
          delete currentBgOverlays[`205_${slotId}`];
        } else {
          // If assetOrRole is purely numeric, it's a RoleId → look up actor sprite
          let url = '';
          if (/^\d+$/.test(assetOrRole)) {
            const overlayActor = actors.find(a => a.RoleId === parseInt(assetOrRole));
            url = overlayActor ? getAssetUrl(overlayActor.RoleIcon) : '';
          } else {
            url = getAssetUrl(assetOrRole);
          }
          if (url) {
            currentBgOverlays[`205_${slotId}`] = {
              url,
              depth: depth || '1',
              opacity: opacity !== undefined ? parseFloat(opacity) : 1
            };
          }
        }
      }
      else if (node.Type === 601) {
        const overlayId = params[1];
        const assetPath = params[2];
        const showFlag = params[3]; // '1' = show, '0' or missing = hide
        const targetOpacity = params[4];
        const depth = params[5];

        if (showFlag === '1' && assetPath) {
          currentBgOverlays[`601_${overlayId}`] = {
            url: getAssetUrl(assetPath),
            depth: depth || '2',
            opacity: targetOpacity !== undefined ? parseFloat(targetOpacity) : 1
          };
        } else {
          delete currentBgOverlays[`601_${overlayId}`];
        }
      }
      else if (node.Type === 401) {
        const soundType = params[1];
        if (params[2] && soundType === '1') {
          currentMusicState = `BGM-${params[2]}`;
        }
      }
      else if (node.Type === 402) {
        const stopSoundId = params[1];
        if (stopSoundId) {
          const match = currentMusicState.match(/BGM-(\d+)/);
          if (match && match[1] === stopSoundId) {
            currentMusicState = '';
          }
        }
      }
    }
    
    setBackground(currentBackground);
    setCurrentMusic(currentMusicState);
    setSlots(currentSlots);
    setBgOverlays(currentBgOverlays);
  };

  useEffect(() => {
    if (!script || script.length === 0 || stepIndex >= script.length) return;
    
    const node = script[stepIndex];
    const params = parseParams(node.Params);
    let isBlocking = false;

    if (node.Type === 101) {
      const wikiBg = wikiBgMap[node.ActionId];
      const bgUrl = wikiBg || (params[1] ? getAssetUrl(params[1]) : '');
      if (params[4]) {
        const layerId = params[4];
        setBgOverlays(prev => {
          const next = { ...prev };
          if (bgUrl) {
            const isFront = bgUrl.toLowerCase().includes('bgstoryfront');
            next[`101_${layerId}`] = {
              url: bgUrl,
              depth: isFront ? '1.5' : '0.5',
              opacity: 1
            };
          } else {
            delete next[`101_${layerId}`];
          }
          return next;
        });
      } else {
        if (bgUrl) {
          setBackground(bgUrl);
        }
      }
    }
    else if (node.Type === 201 || node.Type === 211) {
      const slotId = params[1];
      const roleId = params[2];
      const exprIndex = params[3];
      const xOffset = params[4];
      
      const actor = actors.find(a => a.RoleId === parseInt(roleId));
      if (actor) {
        let faceSprite = null;
        if (exprIndex) {
          const faceMap = roleFaces.find(f => f.RoleId === parseInt(roleId));
          if (faceMap) {
            const faceList = parseFaceLookArray(faceMap.FaceLook);
            const exprIdStr = exprIndex.toString();
            let resolvedFace = faceList[parseInt(exprIndex) - 1];
            if (!resolvedFace) {
              resolvedFace = faceList.find(f => f.includes(`_${exprIdStr.padStart(2, '0')}.`) || f.includes(`_${exprIdStr}.`));
            }
            if (resolvedFace) {
              faceSprite = getAssetUrl(resolvedFace);
            }
          }
        }

        setSlots(prev => ({
          ...prev,
          [slotId]: {
            roleId,
            name: actor.Name,
            bodySprite: getAssetUrl(actor.RoleIcon),
            faceSprite,
            facePosX: actor.FacePosX,
            facePosY: actor.FacePosY,
            xOffset: xOffset || '0',
            isDimmed: false
          }
        }));
      }
    }
    else if (node.Type === 202 || node.Type === 212) {
      const slotsToClear = [params[1], params[2], params[3]].filter(Boolean);
      setSlots(prev => {
        const next = { ...prev };
        slotsToClear.forEach(id => {
          next[id] = null;
        });
        return next;
      });
    }
    else if (node.Type === 203 || node.Type === 213) {
      const slotId = params[1];
      const newXOffset = params[3];
      setSlots(prev => {
        if (!prev[slotId]) return prev;
        return {
          ...prev,
          [slotId]: {
            ...prev[slotId],
            xOffset: newXOffset || '0'
          }
        };
      });
    }
    else if (node.Type === 204 || node.Type === 214) {
      // Change face expression of a character in the given slot
      const slotId = params[1];
      const exprIndex = params[2];
      setSlots(prev => {
        if (!prev[slotId]) return prev;
        const slot = prev[slotId];
        const roleId = slot.roleId;
        let faceSprite = slot.faceSprite; // keep existing if no expression found
        if (exprIndex) {
          const faceMap = roleFaces.find(f => f.RoleId === parseInt(roleId));
          if (faceMap) {
            const faceList = parseFaceLookArray(faceMap.FaceLook);
            const exprIdStr = exprIndex.toString();
            let resolvedFace = faceList[parseInt(exprIndex) - 1];
            if (!resolvedFace) {
              resolvedFace = faceList.find(f => f.includes(`_${exprIdStr.padStart(2, '0')}.`) || f.includes(`_${exprIdStr}.`));
            }
            if (resolvedFace) {
              faceSprite = getAssetUrl(resolvedFace);
            }
          }
        }
        return {
          ...prev,
          [slotId]: { ...slot, faceSprite }
        };
      });
    }
    else if (node.Type === 205) {
      // param[1]=slotId, param[2]=assetPath OR RoleId (numeric), param[3]=showFlag, param[4]=opacity, param[5]=depth
      const slotId = params[1];
      const assetOrRole = params[2];
      const showFlag = params[3];
      const opacity = params[4];
      const depth = params[5];

      setBgOverlays(prev => {
        const next = { ...prev };
        const isHide = !assetOrRole || showFlag === '0';
        if (isHide) {
          delete next[`205_${slotId}`];
        } else {
          let url = '';
          if (/^\d+$/.test(assetOrRole)) {
            const overlayActor = actors.find(a => a.RoleId === parseInt(assetOrRole));
            url = overlayActor ? getAssetUrl(overlayActor.RoleIcon) : '';
          } else {
            url = getAssetUrl(assetOrRole);
          }
          if (url) {
            next[`205_${slotId}`] = {
              url,
              depth: depth || '1',
              opacity: opacity !== undefined ? parseFloat(opacity) : 1
            };
          }
        }
        return next;
      });
    }
    else if (node.Type === 601) {
      const overlayId = params[1];
      const assetPath = params[2];
      const showFlag = params[3]; // '1' = show, '0'/missing = hide
      const targetOpacity = params[4];
      const depth = params[5];

      setBgOverlays(prev => {
        const next = { ...prev };
        if (showFlag === '1' && assetPath) {
          next[`601_${overlayId}`] = {
            url: getAssetUrl(assetPath),
            depth: depth || '2',
            opacity: targetOpacity !== undefined ? parseFloat(targetOpacity) : 1
          };
        } else {
          delete next[`601_${overlayId}`];
        }
        return next;
      });
    }
    else if (node.Type === 501) {
      const prefabPath = params[1] || '';
      if (prefabPath.toLowerCase().includes('/uimovie/') || prefabPath.toLowerCase().includes('/fxuimovie/') || prefabPath.toLowerCase().includes('uimovie')) {
        isBlocking = true;
        setIsPlayingVideo(true);
        setVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
      }
    }
    else if (node.Type === 505) {
      const prefabPath = params[2] || '';
      if (prefabPath.toLowerCase().includes('/uimovie/') || prefabPath.toLowerCase().includes('/fxuimovie/') || prefabPath.toLowerCase().includes('uimovie')) {
        setIsPlayingVideo(false);
        setVideoUrl('');
      }
    }
    else if (node.Type === 401) {
      const soundType = params[1];
      const soundId = params[2];
      
      if (soundType === '1') {
        if (soundId) {
          setCurrentMusic(`BGM-${soundId}`);
        }
      } else if (soundType === '2') {
        if (soundId && !isMuted) {
          triggerSfxPlay(soundId);
        }
      }
    }
    else if (node.Type === 402) {
      const stopSoundId = params[1];
      if (stopSoundId) {
        const match = currentMusic.match(/BGM-(\d+)/);
        if (match && match[1] === stopSoundId) {
          setCurrentMusic('');
        }
        if (activeSfxRef.current[stopSoundId]) {
          activeSfxRef.current[stopSoundId].pause();
          delete activeSfxRef.current[stopSoundId];
        }
      }
    }
    else if (node.Type === 301) {
      isBlocking = true;
      const speaker = replacePlayerName(params[2] || '');
      const text = replacePlayerName(params[3] || '');
      const activeSlots = [params[4], params[5]].filter(Boolean).map(String);

      setSlots(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(slotId => {
          if (next[slotId]) {
            next[slotId] = {
              ...next[slotId],
              isDimmed: activeSlots.length > 0 && !activeSlots.includes(slotId)
            };
          }
        });
        return next;
      });

      setDialogue({ speaker, text, activeSlots });
      setChoices([]);
      
      if (text) {
        setHistory(prev => [...prev, { speaker: speaker || 'Narrator', text, stepIndex }]);
      }

      // Play voice: prefer exact wiki path, substituting the target language
      if (!isMuted && !isSkipping) {
        const directVoice = wikiVoiceMap[node.ActionId];
        if (directVoice) {
          // directVoice is like 'ja/ac50_kachi_juqing/...' – swap language prefix
          const langVoice = directVoice.replace(/^(ja|en|zh|ca)(\/)/, `${voiceLanguage}$2`);
          if (voiceAudioRef.current) {
            voiceAudioRef.current.pause();
            voiceAudioRef.current = null;
          }
          const tryLangs = [langVoice, directVoice]; // fallback to original lang
          const playLang = (paths, idx) => {
            if (idx >= paths.length) return;
            const audio = new Audio(resolveAssetPath(`/pgr_audio/${paths[idx]}.mp3`));
            audio.volume = 0.85;
            audio.play().then(() => { voiceAudioRef.current = audio; }).catch(() => {
              if (idx + 1 < paths.length) playLang(paths, idx + 1);
              else if (params[18] && params[21]) triggerVoicePlay(params[18], params[19], params[21]);
            });
          };
          playLang(tryLangs, 0);
        } else if (params[18] && params[21]) {
          triggerVoicePlay(params[18], params[19], params[21]);
        }
      }
    }
    else if (node.Type === 302) {
      isBlocking = true;
      const choicesList = [];
      if (params[2] && params[3]) {
        choicesList.push({ text: replacePlayerName(params[2]), target: params[3] });
      }
      if (params[4] && params[5]) {
        choicesList.push({ text: replacePlayerName(params[4]), target: params[5] });
      }
      if (params[6] && params[7]) {
        choicesList.push({ text: replacePlayerName(params[6]), target: params[7] });
      }
      setChoices(choicesList);
    }

    if (!isBlocking) {
      setStepIndex(prev => prev + 1);
    }
  }, [stepIndex, script, actors, roleFaces]);

  const [visibleCharCount, setVisibleCharCount] = useState(0);

  useEffect(() => {
    if (!dialogue.text) {
      setVisibleCharCount(0);
      setTextTypingComplete(true);
      return;
    }

    const cleanText = dialogue.text.replace(/<[^>]+>/g, '');
    const totalChars = cleanText.length;
    setTextTypingComplete(false);
    
    if (isSkipping) {
      setVisibleCharCount(totalChars);
      setTextTypingComplete(true);
      
      typingTimerRef.current = setTimeout(() => {
        handleAdvance();
      }, 70);
      return;
    }

    let i = 0;
    setVisibleCharCount(0);
    
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    
    typingTimerRef.current = setInterval(() => {
      setVisibleCharCount(i + 1);
      i++;
      if (i >= totalChars) {
        clearInterval(typingTimerRef.current);
        setTextTypingComplete(true);
      }
    }, 20);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [dialogue.text, isSkipping]);

  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    if (isAutoPlay && textTypingComplete && choices.length === 0) {
      autoPlayTimerRef.current = setTimeout(() => {
        handleAdvance();
      }, 2000);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, textTypingComplete, choices]);

  const handleAdvance = () => {
    if (choices.length > 0) return;

    const cleanText = dialogue.text ? dialogue.text.replace(/<[^>]+>/g, '') : '';
    const totalChars = cleanText.length;

    if (!textTypingComplete) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setVisibleCharCount(totalChars);
      setTextTypingComplete(true);
    } else {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      if (stepIndex >= script.length - 1) {
        setShowNextChapterPopup(true);
      } else {
        setStepIndex(prev => prev + 1);
      }
    }
  };

  const handleSelectChoice = (targetActionId) => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
    const targetId = parseInt(targetActionId);
    const targetIdx = script.findIndex(n => n.ActionId === targetId);
    
    const selectedChoice = choices.find(c => c.target === targetActionId);
    if (selectedChoice) {
      setHistory(prev => [...prev, {
        speaker: 'Player Choice',
        text: selectedChoice.text,
        isChoice: true,
        stepIndex
      }]);
    }

    if (targetIdx !== -1) {
      setChoices([]);
      setStepIndex(targetIdx);
    } else {
      console.warn(`ActionId ${targetId} not found in script!`);
      setStepIndex(prev => prev + 1);
    }
  };

  const handleSaveBookmark = () => {
    const state = {
      stepIndex,
      background,
      slots,
      dialogue,
      history,
      currentMusic,
      bgOverlays
    };
    localStorage.setItem(`pgr_save_${storyId}`, JSON.stringify(state));
    alert('Bookmark saved successfully!');
  };

  const handleLoadBookmark = () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }
    const saved = localStorage.getItem(`pgr_save_${storyId}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setStepIndex(state.stepIndex);
        setBackground(state.background);
        setSlots(state.slots);
        setDialogue(state.dialogue);
        setHistory(state.history);
        setCurrentMusic(state.currentMusic);
        setBgOverlays(state.bgOverlays || {});
        setChoices([]);
      } catch (err) {
        alert('Failed to load bookmark.');
      }
    } else {
      alert('No bookmarks found for this chapter.');
    }
  };

  const handleSkipVideo = () => {
    setIsPlayingVideo(false);
    setVideoUrl('');
    setStepIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="vn-loading-screen">
        <RefreshCw className="loading-spinner" />
        <p>Synchronizing M.I.N.D. Database...</p>
      </div>
    );
  }

  return (
    <div className="pgr-vn-container" style={{ backgroundImage: background ? `url(${background})` : 'none' }}>
      <div className="vn-bg-overlay"></div>

      {/* Video Cutscene Overlay */}
      {isPlayingVideo && (
        <div className="pgr-vn-video-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}>
          <div className="pgr-vn-video-container" style={{
            position: 'relative',
            width: '80%',
            maxWidth: '960px',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <iframe
              src={videoUrl}
              title="Video Cutscene"
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          <button
            className="vn-video-skip-btn"
            onClick={handleSkipVideo}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
              zIndex: 101
            }}
            onMouseEnter={e => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            Skip Cutscene
          </button>
        </div>
      )}

      {/* Overlapping Background Layers */}
      {Object.entries(bgOverlays).map(([slotId, overlay]) => (
        <div
          key={slotId}
          className="pgr-vn-bg-overlay-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${overlay.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: Math.floor(parseFloat(overlay.depth) * 10),
            opacity: overlay.opacity !== undefined ? overlay.opacity : 1,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Top Header Panel */}
      <div className="vn-header-panel" style={{ zIndex: 70 }}>
        <button className="vn-btn btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Exit</span>
        </button>

        {/* Audio Controls */}
        <div className="vn-audio-controls">
          <button 
            className={`vn-audio-toggle-btn ${isMuted ? 'muted' : ''}`} 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <select 
            className="vn-voice-lang-select"
            value={voiceLanguage}
            onChange={(e) => setVoiceLanguage(e.target.value)}
            title="Select Voice Language"
          >
            <option value="ja">JP</option>
            <option value="zh">CN</option>
            <option value="ca">Cant</option>
            <option value="en">EN</option>
          </select>
        </div>

        <div className="vn-header-meta">
          {currentMusic && <span className="vn-meta-item music-info">🎵 {currentMusic}</span>}
          <span className="vn-meta-item step-info">Node {stepIndex + 1}/{script.length}</span>
        </div>
      </div>

      {/* Character Stage */}
      <div className="pgr-vn-actor-stage" style={{ zIndex: 10 }}>
        {Object.entries(slots).map(([id, val]) => {
          if (!val) return null;
          const slotClass = `pgr-vn-slot-${id}`;
          const offsetStyle = val.xOffset !== '0' 
            ? { transform: `translateX(calc(-50% + ${parseInt(val.xOffset) * 0.15}px))` } 
            : {};
          
          return (
            <div 
              key={id} 
              className={`pgr-vn-slot-container ${slotClass} ${val.isDimmed ? 'dimmed' : ''}`}
              style={offsetStyle}
            >
              <VnCharacter 
                bodySprite={val.bodySprite}
                faceSprite={val.faceSprite}
                facePosX={val.facePosX}
                facePosY={val.facePosY}
                name={val.name}
              />
            </div>
          );
        })}
      </div>

      {/* Choices Layer */}
      {choices.length > 0 && (
        <div className="pgr-vn-choices-overlay" style={{ zIndex: 50 }}>
          {choices.map((choice, idx) => (
            <button 
              key={idx} 
              className="pgr-vn-choice-btn"
              onClick={() => handleSelectChoice(choice.target)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Dialogue Box */}
      <div className="pgr-vn-dialogue-section" style={{ zIndex: 60 }}>
        <div className="vn-controls-bar">
          <button className={`vn-control-btn ${isAutoPlay ? 'active' : ''}`} onClick={() => { setIsAutoPlay(!isAutoPlay); setIsSkipping(false); }}>
            <Play size={14} />
            <span>Auto</span>
          </button>
          <button className={`vn-control-btn ${isSkipping ? 'active' : ''}`} onClick={() => { setIsSkipping(!isSkipping); setIsAutoPlay(false); }}>
            <FastForward size={14} />
            <span>Skip</span>
          </button>
          <button className="vn-control-btn" onClick={() => setShowHistory(true)}>
            <List size={14} />
            <span>Log</span>
          </button>
          <button className="vn-control-btn" onClick={handleSaveBookmark}>
            <Bookmark size={14} />
            <span>Bookmark</span>
          </button>
          <button className="vn-control-btn" onClick={handleLoadBookmark}>
            <RefreshCw size={14} />
            <span>Resume</span>
          </button>
          <button className="vn-control-btn" onClick={() => setShowCodex(true)}>
            <BookOpen size={14} />
            <span>Codex</span>
          </button>
        </div>

        <div className="vn-dialogue-box" onClick={handleAdvance}>
          {dialogue.speaker && (
            <div className="vn-speaker-badge">
              {dialogue.speaker}
            </div>
          )}
          <div className="vn-text-content">
            {renderSegmentsIncrementally(parseRichTextToSegments(dialogue.text), visibleCharCount)}
            {textTypingComplete && choices.length === 0 && <span className="vn-arrow-cursor">▼</span>}
          </div>
        </div>
      </div>

      {showHistory && (
        <HistoryLog 
          logs={history} 
          onClose={() => setShowHistory(false)} 
          onJumpToStep={(stepIdx) => {
            if (voiceAudioRef.current) {
              voiceAudioRef.current.pause();
              voiceAudioRef.current = null;
            }
            if (activeSfxRef.current) {
              Object.keys(activeSfxRef.current).forEach(soundId => {
                if (activeSfxRef.current[soundId]) {
                  activeSfxRef.current[soundId].pause();
                }
              });
              activeSfxRef.current = {};
            }
            reconstructStateAtStep(stepIdx);
            setStepIndex(stepIdx);
            setChoices([]);
            setHistory(prev => {
              const cutIdx = prev.findIndex(log => log.stepIndex > stepIdx);
              if (cutIdx !== -1) {
                return prev.slice(0, cutIdx);
              }
              return prev;
            });
            setShowHistory(false);
          }}
        />
      )}

      {showCodex && (
        <LoreCodex onClose={() => setShowCodex(false)} />
      )}

      {/* Next Chapter/Stage Modal Popup */}
      {showNextChapterPopup && (() => {
        const currentStoryIdx = storyIndex.findIndex(item => item.StoryId === storyId);
        const nextStoryItem = currentStoryIdx !== -1 && currentStoryIdx < storyIndex.length - 1 
          ? storyIndex[currentStoryIdx + 1] 
          : null;
        return (
          <div className="vn-modal-overlay">
            <div className="vn-modal-container completed-modal">
              <div className="vn-modal-header">
                <h2>STAGE COMPLETED</h2>
              </div>
              <div className="completed-modal-body">
                <p className="completed-label">M.I.N.D. Synchronization Complete</p>
                <div className="completed-divider"></div>
                {nextStoryItem ? (
                  <>
                    <p className="next-prompt-label">Proceed to the next stage?</p>
                    <p className="next-stage-title">
                      {nextStoryItem.Title.split(' - ')[1] || nextStoryItem.Title}
                    </p>
                  </>
                ) : (
                  <p className="next-prompt-label">You have reached the end of this story path.</p>
                )}
                <div className="completed-actions">
                  {nextStoryItem && (
                    <button 
                      className="completed-btn btn-confirm" 
                      onClick={() => {
                        setShowNextChapterPopup(false);
                        if (onNextStory) {
                          onNextStory(nextStoryItem.StoryId);
                        }
                      }}
                    >
                      Continue
                    </button>
                  )}
                  <button 
                    className="completed-btn btn-exit" 
                    onClick={() => {
                      setShowNextChapterPopup(false);
                      onBack();
                    }}
                  >
                    Exit to Select
                  </button>
                  <button 
                    className="completed-btn btn-cancel" 
                    onClick={() => setShowNextChapterPopup(false)}
                  >
                    Review Scene
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
