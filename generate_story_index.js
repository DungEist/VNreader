import fs from 'fs';
import path from 'path';

const pgrDataDir = '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie';
const moviesDir = path.join(pgrDataDir, 'movies');
const summaryPath = path.join(pgrDataDir, 'MovieSkipSummary.json');
const outputPath = path.join(pgrDataDir, 'story_index.json');

// Official Main Story chapters mapping
const mainStoryChapters = {
  0: "00 Prologue",
  1: "01 Graffiti Art",
  2: "02 Journey of Torture",
  3: "03 Final Exhibition",
  4: "04 Forgotten Sand",
  5: "05 Shattered Illusion",
  6: "06 Alloy Contamination",
  7: "07 Inver-Collapse",
  8: "08 Consumed by Darkness",
  9: "09 Fallen Star",
  10: "10 Eternal Engine",
  11: "11 Nona Ouroboros",
  12: "12 Kowloong Metropolis",
  13: "13 Fake Ascension",
  14: "14 Imprisoned Sight",
  15: "15 The Last Spark",
  16: "16 Evernight Beat",
  17: "17 The Surviving Lucem",
  18: "18 Her Last Bow",
  19: "19 A New Divide",
  20: "20 Across the Ruined Sea",
  21: "21 Spiral of Chronos",
  22: "22 Renaissance du Fantastique",
  23: "23 Wintry Shackles",
  24: "24 Chaos Unsnarled",
  25: "25 Everglowing Justice",
  26: "26 Cradle Parade",
  27: "27 Aeon Reforged",
  28: "28 Polaris Bond",
  29: "29 Source Beacon",
  30: "30 Stars Ensnared",
  31: "31 Shaper's Ripples",
  32: "32 To the Galaxies",
  33: "33 Wither to Shine",
  34: "34 Dream till the Timeless End",
  35: "35 Echoes Adrift",
  36: "36 Dreams Rewound",
  37: "37 Where Nightmares Dwell",
  38: "38 Sightline Breach",
  39: "39 Withering Crown",
  40: "40 A Better Tomorrow",
  41: "41 Homecoming Voyage"
};

// Suffix mapping for before/after stage scripts
const suffixMap = {
  'BA': 'Before Battle',
  'EA': 'After Battle',
  'BB': 'Part B',
  'BC': 'Part C',
  'BD': 'Part D',
  'BE': 'Part E',
  'BF': 'Part F',
  'BS': 'Branch Scenario'
};

// Map ZX/HG late prefix numbers to official main chapters
const zxToMainChapter = {
  40: { chap: 26 }, // Cradle Parade
  41: { chap: 27 }, // Aeon Reforged
  42: { chap: 28 }, // Polaris Bond
  43: { chap: 29 }, // Source Beacon
  44: { chap: 30 }, // Stars Ensnared
  48: { chap: 31 }, // Shaper's Ripples
  49: { chap: 32 }, // To the Galaxies Part 1
  50: { chap: 32 }, // To the Galaxies Part 2
  51: { chap: 33 }, // Wither to Shine
  53: { chap: 34 }, // Dream till the Timeless End
  57: { chap: 35 }, // Echoes Adrift
  58: { chap: 36 }, // Dreams Rewound
  61: { chap: 37 }, // Where Nightmares Dwell
  62: { chap: 38 }, // Sightline Breach
  63: { chap: 39 }, // Withering Crown
  64: { chap: 40 }, // A Better Tomorrow
  66: { chap: 41 }  // Homecoming Voyage
};

const zxToExtraChapter = {
  45: { title: "Floating Record ER07: Soaring Beyond" },
  46: { title: "Floating Record ER08: The Long Goodbye" },
  47: { title: "Floating Record ER09: Crescent Sun" },
  52: { title: "Floating Record ER10: Deceivers' Rapture" },
  54: { title: "Begin Anew" },
  55: { title: "Spark to Wildfire" },
  56: { title: "Lamento di Phantasma" },
  59: { title: "Woven Prologue" },
  60: { title: "Ideal Cage" },
  65: { title: "The Dying Sun" }
};

const zx048StageNames = {
  1: "Echoes of Nightmare",
  2: "Caged Bird in the Court of Time",
  3: "Golden Time Court",
  4: "The Loom of Calamity",
  5: "Oblivion Butterfly",
  6: "The Sunken City",
  7: "The Ark of Decay",
  8: "How can you \"transform into a butterfly\"?",
  9: "Record: Descend",
  10: "Record: Rotting Wood",
  11: "Record: Hero",
  12: "Record: Widower",
  13: "Record: Harvest",
  14: "Why do you \"transform into a butterfly\"?",
  15: "Lost in an Endless Dream",
  16: "Death Loop",
  17: "Birth of Planets",
  18: "Until the sun rises.",
  19: "Froggie and the Four-leaf Clover",
  20: "A canal that leads to the Galaxy",
  21: "The Search for Tomorrow",
  22: "Pyroath of the Long Night",
  23: "What's \"Transform into a Butterfly\"?",
  24: "Slaughterhouse #5",
  25: "The Final Interview",
  26: "\"The Bridge Across Dreams\"",
  27: "Homecoming Butterfly",
  28: "Victim of Suicide Epidemic",
  29: "Shaper's Ripples",
  30: "In the first light..."
};



function parseParams(str) {
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
    let key = token.slice(0, colonIndex).trim().replace(/['"]/g, '');
    let val = token.slice(colonIndex + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/【kuroname】/g, 'Commandant')
    .replace(/\{PlayerName\}/g, 'Commandant')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  console.log('Starting story index generation with official Huaxu Wiki chapter mapping...');

  // 1. Load wiki_db.json
  const wikiDbPath = path.join('/home/deist/Downloads/Work/PGR_reader', 'wiki_db.json');
  let wikiStages = [];
  const wikiMap = new Map();
  const wikiOrderMap = new Map();
  
  if (fs.existsSync(wikiDbPath)) {
    wikiStages = JSON.parse(fs.readFileSync(wikiDbPath, 'utf8'));
    console.log(`Loaded ${wikiStages.length} stages from wiki_db.json`);
    wikiStages.forEach((stage, idx) => {
      stage.storyIds.forEach(id => {
        wikiMap.set(id.toUpperCase(), stage);
        wikiOrderMap.set(id.toUpperCase(), idx);
      });
    });
  } else {
    console.warn('wiki_db.json not found! Stage mapping will fall back to defaults.');
  }

  // 2. Load MovieSkipSummary
  let summaryList = [];
  const summaryMap = new Map();
  try {
    if (fs.existsSync(summaryPath)) {
      summaryList = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      summaryList.forEach(item => {
        summaryMap.set(item.StoryId.toUpperCase(), item);
      });
      console.log(`Loaded ${summaryMap.size} summaries from MovieSkipSummary.json`);
    }
  } catch (err) {
    console.error('Error reading MovieSkipSummary.json:', err);
  }

  // 3. Read movie files
  const files = fs.readdirSync(moviesDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} movie files in ${moviesDir}`);

  const index = [];
  let processedCount = 0;

  for (const filename of files) {
    processedCount++;
    if (processedCount % 500 === 0) {
      console.log(`Processed ${processedCount}/${files.length} files...`);
    }

    const filepath = path.join(moviesDir, filename);
    const idMatch = filename.match(/^Movie(.+)\.json$/);
    if (!idMatch) continue;
    const storyId = idMatch[1];
    const storyIdUpper = storyId.toUpperCase();

    let fileContent;
    try {
      fileContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (err) {
      console.error(`Error parsing JSON file ${filename}:`, err.message);
      continue;
    }

    // Extract dialogue nodes for summary preview
    const dialogues = [];
    fileContent.forEach(node => {
      if (node && node.Type === 301) {
        const params = parseParams(node.Params);
        const speaker = params[2] ? cleanText(params[2]) : '';
        const text = params[3] ? cleanText(params[3]) : '';
        if (text) {
          dialogues.push({ speaker, text });
        }
      }
    });

    // Skip placeholder/unreleased stories: all dialogues contain '测试' (Chinese "test")
    // or the file has no meaningful content (< 5 nodes total)
    if (fileContent.length < 5) continue;
    if (dialogues.length > 0 && dialogues.every(d => d.text.includes('测试'))) continue;

    const summaryEntry = summaryMap.get(storyIdUpper);
    let summaryContent = '';

    // Generate prefix/suffix values for fallback mapping
    const match = storyId.match(/^([A-Za-z]+)(\d+)([A-Z]*)$/);
    let prefix = 'Other';
    let numberStr = '';
    let suffix = '';
    
    if (match) {
      prefix = match[1];
      numberStr = match[2];
      suffix = match[3];
    } else {
      const fallbackMatch = storyId.match(/^(\d+)([A-Z]*)$/);
      if (fallbackMatch) {
        numberStr = fallbackMatch[1];
        suffix = fallbackMatch[2];
      }
    }
    
    let chapNum = 0;
    let stageNum = 0;
    let partNum = null;
    
    if (numberStr.length === 5) {
      chapNum = parseInt(numberStr.slice(0, 3));
      stageNum = parseInt(numberStr.slice(3));
    } else if (numberStr.length > 5) {
      chapNum = parseInt(numberStr.slice(0, 3));
      partNum = parseInt(numberStr.slice(3, 4));
      stageNum = parseInt(numberStr.slice(4));
    } else {
      chapNum = parseInt(numberStr) || 0;
    }

    const suffixLabel = suffixMap[suffix] || suffix;
    const suffixString = suffixLabel ? ` (${suffixLabel})` : '';

    let category = 'Extra Story';
    let storyline = '';
    let stageLabel = `Stage ${stageNum}`;
    if (partNum !== null) {
      stageLabel = `Part ${partNum} - Stage ${stageNum}`;
    }

    // Wiki category ID to display name map
    // Based on actual wiki_db content analysis:
    // cat 1  = ZX stories for Main Story chapters (01 Graffiti Art...) → Main Story (Normal)
    // cat 2  = YC stories for Main Story chapters (hidden variants) → Main Story (Hidden)
    // cat 3  = JZ stories (Interlude/Bond stories) → Interlude
    // cat 14 = ZX stories for Floating Record chapters (ER00...) → Floating Record
    const wikiCategoryNames = {
      '1':    'Main Story (Normal)',       // ZX main story scenes
      '2':    'Main Story (Hidden)',       // YC hidden story scenes
      '3':    'Interlude',
      '5':    'Golden Vortex',
      '6':    'Event Story',
      '7':    'Border Pact',
      '8':    'Extra Story',
      '9':    'Extra Hidden',
      '10':   'Collaboration',
      '11':   'Festival Story',
      '12':   'Adaptation Fitting',
      '13':   'Alternative Interpretation',
      '14':   'Floating Record',
      '15':   'Arcade Anima',
      '16':   'Palette Clash',
      '17':   'Multiversal Chronicles',
      '1000': 'Affection'
    };

    // Lookup in wiki database
    const wikiEntry = wikiMap.get(storyIdUpper);

    if (wikiEntry) {
      category = wikiCategoryNames[wikiEntry.category] || wikiEntry.category;
      storyline = wikiEntry.chapterTitle;
      // Only prepend stageNum if it looks like a human-readable label (e.g. "6-1", "M-1", "EX 1-1")
      // Skip if it's a long numeric wiki ID (>= 6 digits)
      const sNum = String(wikiEntry.stageNum);
      let sTitle = wikiEntry.stageTitle || '';
      // Strip redundant chapter-name prefix from stage titles (e.g. "Lee: Palefire I" → "I" when chapter is "Lee: Palefire")
      if (sTitle.startsWith(wikiEntry.chapterTitle + ' ')) {
        sTitle = sTitle.slice(wikiEntry.chapterTitle.length).trim();
      }
      stageLabel = /^\d{6,}$/.test(sNum) ? sTitle : `${sNum} ${sTitle}`.trim();
    } else {
      // Fallback categorization mapping logic
      if (prefix === 'HD') {
        // HD is a generic multi-category prefix - fallback to Event Story if not in wiki_db
        category = 'Event Story';
        storyline = `Event (HD${numberStr.slice(0, 3)})`;
        stageLabel = `Stage ${stageNum}`;
      } else if (prefix === 'HG') {
        const suffixNum = chapNum - 100;
        if (suffixNum <= 16) {
          category = 'Main Story (Hidden)';
          const normalMappedName = mainStoryChapters[suffixNum] || `Chapter ${suffixNum}`;
          const subTitle = normalMappedName.replace(/^\d+\s+/, '');
          storyline = `${suffixNum.toString().padStart(2, '0')} Hidden (${subTitle})`;
          stageLabel = `EX ${suffixNum}-${stageNum}`;
        } else {
          category = 'Affection';
          storyline = `Affection ${prefix}${numberStr.slice(0, 3)}`;
          stageLabel = `Stage ${stageNum}`;
        }
      } else if (prefix === 'TS') {
        category = 'Golden Vortex';
        storyline = `Chapter ${chapNum}`;
        stageLabel = `Golden Vortex ${chapNum}-${stageNum}`;
      } else if (prefix === 'SD') {
        category = 'Festival Story';
        storyline = 'Christmas Special';
        stageLabel = `Special Stage ${stageNum}`;
      } else if (prefix === 'RY') {
        category = 'Festival Story';
        storyline = 'Prologue / Tutorial';
        stageLabel = `Tutorial Stage ${stageNum}`;
      } else if (prefix === 'ZX') {
        // ZX chapters: use mainStoryChapters map to determine if it's a known Main Story chapter
        // Unknown ZX chapters → Floating Record (could be test stages or unreleased content)
        const knownChapter = mainStoryChapters[chapNum];
        if (chapNum <= 99 && knownChapter) {
          category = 'Main Story (Normal)';
          storyline = knownChapter;
          stageLabel = `ZX${chapNum.toString().padStart(2, '0')} - Stage ${stageNum}`;
        } else {
          category = 'Floating Record';
          storyline = `ZX${numberStr.slice(0, 3)}`;
          stageLabel = `Stage ${stageNum}`;
        }
      } else if (prefix === 'YC') {
        category = 'Floating Record';
        storyline = `YC${numberStr.slice(0, 3)}`;
        stageLabel = `Stage ${stageNum}`;
      } else if (prefix === 'BJ') {
        category = 'Border Pact';
        storyline = `BJ${numberStr.slice(0, 3)}`;
        stageLabel = `Stage ${stageNum}`;
      } else if (prefix === 'JZ') {
        category = 'Interlude';
        storyline = `JZ${numberStr.slice(0, 3)}`;
        stageLabel = `Stage ${stageNum}`;
      } else {
        category = 'Extra Story';
        const prefixNames = {
          'FZ': 'Frozen Darkness',
          'CW': 'Extra Chapter (CW)',
          'DW': 'Extra Chapter (DW)',
          'HA': 'Extra Chapter (HA)',
          'JD': 'Extra Chapter (JD)',
          'JS': 'Extra Chapter (JS)',
          'KD': 'Extra Chapter (KD)',
          'MC': 'Extra Chapter (MC)',
          'QX': 'Extra Chapter (QX)',
          'RG': 'Extra Chapter (RG)',
          'SJ': 'Extra Chapter (SJ)',
          'TJ': 'Extra Chapter (TJ)',
          'YS': 'Extra Chapter (YS)',
          'ZY': 'Extra Chapter (ZY)',
          'ZZ': 'Extra Chapter (ZZ)'
        };
        storyline = prefixNames[prefix] || `Event (${prefix})`;
        stageLabel = `${prefix}${numberStr.slice(0, 3)} - Stage ${stageNum}`;
      }
    }

    const title = `${category} - ${storyline} \u2192 ${stageLabel}${suffixString}`;

    // Set summaryContent
    if (summaryEntry) {
      summaryContent = summaryEntry.SummaryContent;
    } else {
      if (dialogues.length > 0) {
        const previewLines = dialogues.slice(0, 3).map(d => {
          const spk = d.speaker ? `[${d.speaker}]: ` : '';
          return `${spk}${d.text}`;
        });
        summaryContent = `Dialogue excerpt:\n` + previewLines.join('\n');
      } else {
        summaryContent = 'Cinematic / Action cutscene (no dialogue text).';
      }
    }

    index.push({
      StoryId: storyId,
      Title: title,
      SummaryContent: summaryContent
    });
  }

  // Sort index chronologically using the wiki_db.json ordering, falling back to StoryId
  index.sort((a, b) => {
    const orderA = wikiOrderMap.has(a.StoryId.toUpperCase()) ? wikiOrderMap.get(a.StoryId.toUpperCase()) : 999999;
    const orderB = wikiOrderMap.has(b.StoryId.toUpperCase()) ? wikiOrderMap.get(b.StoryId.toUpperCase()) : 999999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.StoryId.localeCompare(b.StoryId);
  });

  // Write index file
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 4), 'utf8');
  console.log(`Successfully generated story_index.json with ${index.length} entries at ${outputPath}`);
}

run().catch(console.error);
