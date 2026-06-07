import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, RefreshCw, Home, Settings } from 'lucide-react';

const VOICE_LANGS = [
  { code: 'ja', label: 'JP', flag: '🇯🇵', full: 'Japanese' },
  { code: 'en', label: 'EN', flag: '🇺🇸', full: 'English' },
  { code: 'zh', label: 'CN', flag: '🇨🇳', full: 'Mandarin' },
];

const STORAGE_KEY = 'pgr_voice_lang';

// Category metadata matching huaxu.app wiki categories exactly
const WIKI_CATEGORIES = [
  { id: 1,    name: 'Main Story',              key: 'Main Story (Normal)',           bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpic41.webp' },
  { id: 2,    name: 'Hidden Story',            key: 'Main Story (Hidden)',           bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpic16.webp' },
  { id: 14,   name: 'Floating Record',         key: 'Floating Record',              bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicer15.webp' },
  { id: 15,   name: 'Arcade Anima',            key: 'Arcade Anima',                 bg: '/pgr_assets/product/texture/image/bgcg/cg5201_09.webp' },
  { id: 8,    name: 'Extra Story',             key: 'Extra Story',                  bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicex05.webp' },
  { id: 9,    name: 'Extra Hidden',            key: 'Extra Hidden',                 bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicex05.webp' },
  { id: 3,    name: 'Interlude',               key: 'Interlude',                    bg: '/pgr_assets/product/texture/image/bgcg/cgqz3003.webp' },
  { id: 5,    name: 'Golden Vortex',           key: 'Golden Vortex',               bg: '/pgr_assets/product/texture/image/uiarchivestorybanner/uiexplorebg4.webp' },
  { id: 7,    name: 'Border Pact',             key: 'Border Pact',                  bg: '/pgr_assets/product/texture/image/bgstory/bgstory84.webp' },
  { id: 6,    name: 'Event Story',             key: 'Event Story',                  bg: '/pgr_assets/product/texture/image/uipokerguessing2/uipokerguessing3bgcg1.webp' },
  { id: 11,   name: 'Festival Event Story',    key: 'Festival Story',               bg: '/pgr_assets/product/texture/image/bgcg/cghb102.webp' },
  { id: 12,   name: 'Adaptation Fitting',      key: 'Adaptation Fitting',           bg: '/pgr_assets/product/texture/image/uipartnerteaching/chapter/uipartnerteachingchapterbg02.webp' },
  { id: 10,   name: 'Collab',                  key: 'Collaboration',                bg: '/pgr_assets/product/texture/image/bgcg/cg5601_10.webp' },
  { id: 13,   name: 'Alternative Interpretation', key: 'Alternative Interpretation', bg: '/pgr_assets/product/texture/image/uitheatre4/uitheatre4mainbg1.webp' },
  { id: 16,   name: 'Palette Clash',           key: 'Palette Clash',                bg: '/pgr_assets/product/texture/image/bgstory/bgstory677.webp' },
  { id: 17,   name: 'Multiversal Chronicles',  key: 'Multiversal Chronicles',       bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpictheatre6.webp' },
  { id: 1000, name: 'Affection',               key: 'Affection',                    bg: '/pgr_assets/product/texture/image/rolecharacter/roleheadr7luxiya1.webp' },
];

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

const VIEW = { CATEGORIES: 'categories', CHAPTERS: 'chapters', STAGES: 'stages' };

export default function ChapterSelect({ onStartStory, onOpenSettings }) {
  const [view, setView]                   = useState(VIEW.CATEGORIES);
  const [allItems, setAllItems]           = useState([]);
  const [chapterMeta, setChapterMeta]     = useState({});
  const [isLoading, setIsLoading]         = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeChapter, setActiveChapter]   = useState('');
  const [voiceLang, setVoiceLang]           = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'ja'
  );
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('pgr_player_name') || 'Commandant'
  );

  // Persist language choice
  const handleLangChange = (code) => {
    setVoiceLang(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const handlePlayerNameChange = (val) => {
    setPlayerName(val);
    localStorage.setItem('pgr_player_name', val);
  };

  // ── Parse story_index item ────────────────────────────────────────────────
  const parseItem = (item) => {
    const storyId = item.StoryId;
    const title   = item.Title;
    // Format: "Category - Storyline → Stage Name (suffix)"
    const dashIdx  = title.indexOf(' - ');
    if (dashIdx === -1) return { storyId, category: 'Special & Prologue', storyline: 'Special', stageName: title, summary: item.SummaryContent, fullTitle: title };
    const category = title.slice(0, dashIdx).trim();
    const rest     = title.slice(dashIdx + 3).trim();
    // Use ' → ' as separator (avoids ambiguity with storyline names like "Lee: Palefire")
    const arrowIdx = rest.indexOf(' \u2192 ');
    if (arrowIdx === -1) {
      // Legacy format with ':' separator (fallback)
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return { storyId, category, storyline: rest, stageName: rest, summary: item.SummaryContent, fullTitle: title };
      const storyline = rest.slice(0, colonIdx).trim();
      let stageName = rest.slice(colonIdx + 1).trim();
      stageName = stageName.replace(/^\d{5,}\s+/, '');
      return { storyId, category, storyline, stageName, summary: item.SummaryContent, fullTitle: title };
    }
    const storyline = rest.slice(0, arrowIdx).trim();
    let stageName   = rest.slice(arrowIdx + 3).trim();
    stageName = stageName.replace(/^\d{5,}\s+/, '');
    return { storyId, category, storyline, stageName, summary: item.SummaryContent, fullTitle: title };
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [storyRes, metaRes] = await Promise.all([
          fetch(resolveAssetPath('/pgr_data/story_index.json')),
          fetch(resolveAssetPath('/pgr_data/chapter_meta.json')),
        ]);
        const [storyData, metaData] = await Promise.all([storyRes.json(), metaRes.json()]);
        setAllItems(storyData.map(parseItem));
        setChapterMeta(metaData);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Items in active category ──────────────────────────────────────────────
  const catItems = useMemo(() => {
    if (!activeCategory) return [];
    return allItems.filter(i => i.category === activeCategory.key);
  }, [allItems, activeCategory]);

  // ── Build chapter list: use wiki chapter_meta order when available ─────────
  const chapters = useMemo(() => {
    if (!activeCategory) return [];

    // Get unique storyline names from story_index
    const uniqueStorylines = Array.from(new Set(catItems.map(i => i.storyline)));

    // Try to find matching chapter_meta entries for this category to get correct order + bg
    const catMeta = Object.values(chapterMeta).filter(m => m.catId === activeCategory.id);

    if (catMeta.length > 0) {
      // Build ordered list from wiki chapter order, only include storylines we have data for
      const ordered = catMeta.map(m => {
        // Match by name - chapter name from wiki should match storyline from story_index
        const match = uniqueStorylines.find(s => s === m.name || s.toLowerCase() === m.name.toLowerCase());
        return {
          name: m.name,
          storylineKey: match || m.name,
          bgUrl: m.bgUrl,
          chapId: m.chapId,
          stageCount: catItems.filter(i => i.storyline === (match || m.name)).length
        };
      }).filter(c => c.stageCount > 0 || catMeta.length < 5); // show all if few chapters

      // Only return chapters that exist in the wiki (chapter_meta) AND have matching story_index entries
      // This hides orphan stories (test/unreleased content) not documented on huaxu wiki
      return ordered.filter(c => c.stageCount > 0);
    }

    // Fallback: sort alphabetically/numerically
    return uniqueStorylines.sort((a, b) => {
      const n = s => { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 999999; };
      return n(a) - n(b) || a.localeCompare(b);
    }).map(s => ({
      name: s,
      storylineKey: s,
      bgUrl: activeCategory.bg,
      chapId: null,
      stageCount: catItems.filter(i => i.storyline === s).length
    }));
  }, [catItems, activeCategory, chapterMeta]);

  // ── Stage items ───────────────────────────────────────────────────────────
  const stageItems = useMemo(() => {
    if (!activeChapter) return [];
    return catItems.filter(i => i.storyline === activeChapter);
  }, [catItems, activeChapter]);

  // ── Search ────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(i =>
      i.fullTitle.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      i.storyId.toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of allItems) counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, [allItems]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goCategory = (cat) => { setActiveCategory(cat); setActiveChapter(''); setView(VIEW.CHAPTERS); };
  const goChapter  = (ch)  => { setActiveChapter(ch.storylineKey); setView(VIEW.STAGES); };
  const goBack     = () => {
    if (view === VIEW.STAGES)        { setActiveChapter(''); setView(VIEW.CHAPTERS); }
    else if (view === VIEW.CHAPTERS) { setActiveCategory(null); setView(VIEW.CATEGORIES); }
  };

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="hs-breadcrumb">
      <button className="hs-bc-btn" onClick={() => { setView(VIEW.CATEGORIES); setActiveCategory(null); setActiveChapter(''); }}>
        <Home size={14} /><span>Archives</span>
      </button>
      {activeCategory && (
        <>
          <ChevronRight size={12} className="hs-bc-sep" />
          <button className="hs-bc-btn" onClick={() => { setActiveChapter(''); setView(VIEW.CHAPTERS); }}>
            {activeCategory.name}
          </button>
        </>
      )}
      {activeChapter && (
        <>
          <ChevronRight size={12} className="hs-bc-sep" />
          <span className="hs-bc-current">{activeChapter}</span>
        </>
      )}
    </div>
  );

  if (isLoading) return (
    <div className="hs-loading">
      <RefreshCw className="hs-loading-icon" />
      <p>Synchronizing MIND Database...</p>
    </div>
  );

  // ── Category Grid ─────────────────────────────────────────────────────────
  const CategoriesView = () => (
    <div className="hs-categories-grid">
      {WIKI_CATEGORIES.map(cat => {
        const count = categoryCounts[cat.key] || 0;
        return (
          <button key={cat.id} className="hs-cat-card" onClick={() => goCategory(cat)}>
            <img src={resolveAssetPath(cat.bg)} alt={cat.name} className="hs-cat-bg" loading="lazy" />
            <div className="hs-cat-overlay" />
            <div className="hs-cat-info">
              <span className="hs-cat-name">{cat.name}</span>
              {count > 0 && <span className="hs-cat-count">{count} stories</span>}
            </div>
          </button>
        );
      })}
    </div>
  );

  // ── Chapter Grid ──────────────────────────────────────────────────────────
  const ChaptersView = () => (
    <div className="hs-chapters-grid">
      {chapters.map(ch => (
        <button key={ch.name} className="hs-chapter-card" onClick={() => goChapter(ch)}>
          <img
            src={resolveAssetPath(ch.bgUrl)}
            alt={ch.name}
            className="hs-chapter-bg"
            loading="lazy"
            onError={e => { e.target.src = resolveAssetPath(activeCategory.bg); }}
          />
          <div className="hs-chapter-overlay" />
          <div className="hs-chapter-info">
            <span className="hs-chapter-name">{ch.name}</span>
            <span className="hs-chapter-stages">{ch.stageCount} stages</span>
          </div>
        </button>
      ))}
      {chapters.length === 0 && <div className="hs-empty">No chapters found.</div>}
    </div>
  );

  // ── Stage List ────────────────────────────────────────────────────────────
  const StagesView = () => (
    <div className="hs-stages-list">
      {stageItems.map(item => (
        <div key={item.storyId} className="hs-stage-row">
          <div className="hs-stage-info">
            <span className="hs-stage-id">{item.storyId}</span>
            <span className="hs-stage-name">{item.stageName}</span>
            {item.summary && <p className="hs-stage-summary">{item.summary}</p>}
          </div>
          <button className="hs-play-btn" onClick={() => onStartStory(item.storyId, voiceLang)}>
            <Play size={14} fill="currentColor" /><span>Play</span>
          </button>
        </div>
      ))}
      {stageItems.length === 0 && <div className="hs-empty">No stages found.</div>}
    </div>
  );

  // ── Search Results ────────────────────────────────────────────────────────
  const SearchView = () => (
    <div className="hs-stages-list">
      <p className="hs-search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
      {searchResults.slice(0, 100).map(item => (
        <div key={item.storyId} className="hs-stage-row">
          <div className="hs-stage-info">
            <span className="hs-stage-id">{item.category} / {item.storyline}</span>
            <span className="hs-stage-name">{item.stageName}</span>
            {item.summary && <p className="hs-stage-summary">{item.summary}</p>}
          </div>
          <button className="hs-play-btn" onClick={() => onStartStory(item.storyId, voiceLang)}>
            <Play size={14} fill="currentColor" /><span>Play</span>
          </button>
        </div>
      ))}
      {searchResults.length === 0 && <div className="hs-empty">No results found.</div>}
    </div>
  );

  const isSearch = searchQuery.trim().length > 0;

  return (
    <div className="hs-root">
      <div className="hs-header">
        <div className="hs-header-left">
          {view !== VIEW.CATEGORIES && !isSearch && (
            <button className="hs-back-btn" onClick={goBack}><ChevronLeft size={18} /></button>
          )}
          <Breadcrumb />
        </div>
        <div className="hs-header-right-controls">
          <div className="hs-search-wrap">
            <Search size={16} className="hs-search-icon" />
            <input
              className="hs-search-input"
              type="text"
              placeholder="Search stories, dialogue, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="hs-search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          <button 
            className="hs-settings-btn" 
            onClick={onOpenSettings} 
            title="Open Settings & Asset Manager"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* ── Voice & Name Bar ─────────────────────────────────────── */}
      <div className="hs-voice-lang-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="hs-voice-lang-label">🎙 Voice:</span>
          {VOICE_LANGS.map(lang => (
            <button
              key={lang.code}
              className={`hs-voice-lang-btn ${voiceLang === lang.code ? 'active' : ''}`}
              onClick={() => handleLangChange(lang.code)}
              title={lang.full}
            >
              <span className="hs-lang-flag">{lang.flag}</span>
              <span className="hs-lang-label">{lang.label}</span>
            </button>
          ))}
        </div>

        <div className="hs-commandant-name-wrap">
          <span className="hs-voice-lang-label">🎖 Commandant:</span>
          <input
            type="text"
            className="hs-name-input"
            value={playerName}
            onChange={(e) => handlePlayerNameChange(e.target.value)}
            placeholder="Commandant"
            maxLength={20}
          />
        </div>
      </div>

      <div className="hs-content">
        {isSearch       ? <SearchView />    :
         view === VIEW.CATEGORIES ? <CategoriesView /> :
         view === VIEW.CHAPTERS   ? <ChaptersView />   :
                                    <StagesView />}
      </div>
    </div>
  );
}
