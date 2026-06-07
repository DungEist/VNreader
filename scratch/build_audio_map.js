import fs from 'fs';
import path from 'path';
import http from 'https';

const moviesDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies';
const outputPath = '/home/deist/Downloads/Work/PGR_reader/src/components/PgrReader/audio_map.json';

// We want to map BGM and Sound FX for:
// 1. Collins Interlude: zx02101ba (Cat 1, Chap 1015)
// 2. Chapter 31: zx04801ba - zx04830ba (Cat 1, Chap 1031)

const targetStories = [];

// Collins Interlude
targetStories.push({ catId: 1, chapId: 1015, storyId: 'zx02101ba' });

// Chapter 31 stages (31-1 to 31-30)
for (let i = 1; i <= 30; i++) {
  const numStr = String(i).padStart(2, '0');
  targetStories.push({ catId: 1, chapId: 1031, storyId: `zx048${numStr}ba` });
  targetStories.push({ catId: 1, chapId: 1031, storyId: `zx048${numStr}ea` }); // Check extra stages if any
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status code ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseParams(str) {
  if (!str) return {};
  let s = str.trim();
  if (s.startsWith('{')) s = s.slice(1);
  if (s.endsWith('}')) s = s.slice(0, -1);
  const result = {};
  const tokens = s.split(/,(?=(?:[^\']*\'[^\']*\')*[^\']*$)/);
  for (const token of tokens) {
    const colonIndex = token.indexOf(':');
    if (colonIndex === -1) continue;
    let key = token.slice(0, colonIndex).trim().replace(/['"]/g, '');
    let val = token.slice(colonIndex + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function deserialize(dataList) {
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

const bgmMap = {};
const sfxMap = {};

async function processStory(task) {
  const url = `https://huaxu.app/ap/wiki/stories/${task.catId}/${task.chapId}/${task.storyId}`;
  console.log(`Fetching ${url}...`);
  try {
    const html = await fetchHtml(url);
    const scriptMatch = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.log(`No NUXT_DATA found for ${task.storyId}`);
      return;
    }
    
    const nuxtData = JSON.parse(scriptMatch[1]);
    const rootResolved = deserialize(nuxtData);
    
    // Find movie actions in deserialized payload
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
    
    if (!actions) {
      console.log(`No movie actions found in payload for ${task.storyId}`);
      return;
    }
    
    // Load local movie JSON to match action IDs
    const movieFilename = `Movie${task.storyId.toUpperCase()}.json`;
    const localMoviePath = path.join(moviesDir, movieFilename);
    if (!fs.existsSync(localMoviePath)) {
      console.log(`Local movie file not found: ${movieFilename}`);
      return;
    }
    
    const localMovie = JSON.parse(fs.readFileSync(localMoviePath, 'utf8'));
    
    actions.forEach(wikiAct => {
      if (wikiAct.type === 'SoundPlay') {
        const localAct = localMovie.find(n => n.ActionId === wikiAct.actionId);
        if (localAct && localAct.Type === 401) {
          const params = parseParams(localAct.Params);
          const soundId = params[2];
          const soundType = params[1]; // 1 = BGM, 2 = SFX
          
          if (soundId && wikiAct.audio) {
            // wikiAct.audio is like "audio/m_ev2_intro/m_ev2_intro"
            let cleanPath = wikiAct.audio;
            if (cleanPath.startsWith('audio/')) {
              cleanPath = cleanPath.slice(6);
            }
            
            if (soundType === '1' || wikiAct.soundType === 1) {
              // BGM. BGM name is folder name without 'm_' prefix (e.g. 'ev2_intro')
              let bgmName = cleanPath.split('/')[0];
              if (bgmName.startsWith('m_')) {
                bgmName = bgmName.slice(2);
              }
              bgmMap[soundId] = bgmName;
              console.log(`Mapped BGM ID ${soundId} -> ${bgmName}`);
            } else {
              // SFX. SFX path is full path relative to audio folder
              sfxMap[soundId] = cleanPath;
              console.log(`Mapped SFX ID ${soundId} -> ${cleanPath}`);
            }
          }
        }
      }
    });
    
  } catch (err) {
    console.log(`Error processing ${task.storyId}: ${err.message}`);
  }
}

async function main() {
  // Process target stories sequentially or in small chunks to avoid rate limiting
  for (const task of targetStories) {
    await processStory(task);
  }
  
  // Merge with existing bgmMap from VnPlayer.jsx just in case
  const defaultBgmMap = {
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
  
  const mergedBgmMap = { ...defaultBgmMap, ...bgmMap };
  
  const outputData = {
    bgmMap: mergedBgmMap,
    sfxMap: sfxMap
  };
  
  // Write to output file
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`Successfully wrote audio map to ${outputPath}`);
}

main().catch(console.error);
