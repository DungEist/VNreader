import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, Home, Settings, X, BookOpen, Zap } from 'lucide-react';
import '../../pages/ChapterSelect2.css';

const VOICE_LANGS = [
  { code: 'ja', label: 'JP', flag: '🇯🇵' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'zh', label: 'CN', flag: '🇨🇳' },
];

const STORAGE_KEY = 'pgr_voice_lang';

const WIKI_CATEGORIES = [
  { id: 1,    name: 'Main Story',              key: 'Main Story (Normal)',           bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpic41.webp',      icon: '📖', accent: '#00d2ff' },
  { id: 2,    name: 'Hidden Story',            key: 'Main Story (Hidden)',           bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpic16.webp',      icon: '🕵', accent: '#ff3c65' },
  { id: 14,   name: 'Floating Record',         key: 'Floating Record',              bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicer15.webp',    icon: '🌊', accent: '#7b61ff' },
  { id: 15,   name: 'Arcade Anima',            key: 'Arcade Anima',                 bg: '/pgr_assets/product/texture/image/bgcg/cg5201_09.webp',                               icon: '🎮', accent: '#ff8c00' },
  { id: 8,    name: 'Extra Story',             key: 'Extra Story',                  bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicex05.webp',    icon: '⭐', accent: '#00e5b0' },
  { id: 9,    name: 'Extra Hidden',            key: 'Extra Hidden',                 bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpicex05.webp',    icon: '🔮', accent: '#ff3c65' },
  { id: 3,    name: 'Interlude',               key: 'Interlude',                    bg: '/pgr_assets/product/texture/image/bgcg/cgqz3003.webp',                               icon: '🎭', accent: '#ffd700' },
  { id: 5,    name: 'Golden Vortex',           key: 'Golden Vortex',               bg: '/pgr_assets/product/texture/image/uiarchivestorybanner/uiexplorebg4.webp',            icon: '🌀', accent: '#ffd700' },
  { id: 7,    name: 'Border Pact',             key: 'Border Pact',                  bg: '/pgr_assets/product/texture/image/bgstory/bgstory84.webp',                           icon: '⚔️', accent: '#00d2ff' },
  { id: 6,    name: 'Event Story',             key: 'Event Story',                  bg: '/pgr_assets/product/texture/image/uipokerguessing2/uipokerguessing3bgcg1.webp',      icon: '🎪', accent: '#ff8c00' },
  { id: 11,   name: 'Festival Story',          key: 'Festival Story',               bg: '/pgr_assets/product/texture/image/bgcg/cghb102.webp',                               icon: '🎋', accent: '#ff3c65' },
  { id: 12,   name: 'Adaptation Fitting',      key: 'Adaptation Fitting',           bg: '/pgr_assets/product/texture/image/uipartnerteaching/chapter/uipartnerteachingchapterbg02.webp', icon: '🧩', accent: '#7b61ff' },
  { id: 10,   name: 'Collab',                  key: 'Collaboration',                bg: '/pgr_assets/product/texture/image/bgcg/cg5601_10.webp',                             icon: '🤝', accent: '#00e5b0' },
  { id: 13,   name: 'Alt. Interpretation',     key: 'Alternative Interpretation',   bg: '/pgr_assets/product/texture/image/uitheatre4/uitheatre4mainbg1.webp',              icon: '🎬', accent: '#ffd700' },
  { id: 16,   name: 'Palette Clash',           key: 'Palette Clash',                bg: '/pgr_assets/product/texture/image/bgstory/bgstory677.webp',                         icon: '🎨', accent: '#ff8c00' },
  { id: 17,   name: 'Multiversal Chronicles',  key: 'Multiversal Chronicles',       bg: '/pgr_assets/product/texture/image/uifubenmaintabchapter/instanceiconpictheatre6.webp', icon: '🌌', accent: '#7b61ff' },
  { id: 1000, name: 'Affection',               key: 'Affection',                    bg: '/pgr_assets/product/texture/image/rolecharacter/roleheadr7luxiya1.webp',            icon: '💙', accent: '#ff3c65' },
];

const resolveAssetPath = (path) => path || '';
const VIEW = { CATEGORIES: 'categories', CHAPTERS: 'chapters', STAGES: 'stages' };

export default function ChapterSelect({ onStartStory, onOpenSettings }) {
  const [view, setView]                     = useState(VIEW.CATEGORIES);
  const [allItems, setAllItems]             = useState([]);
  const [chapterMeta, setChapterMeta]       = useState({});
  const [isLoading, setIsLoading]           = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchOpen, setSearchOpen]         = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeChapter, setActiveChapter]   = useState('');
  const [hoveredCard, setHoveredCard]       = useState(null);
  const [voiceLang, setVoiceLang]           = useState(() => localStorage.getItem(STORAGE_KEY) || 'ja');
  const [playerName, setPlayerName]         = useState(() => localStorage.getItem('pgr_player_name') || 'Commandant');
  const searchRef = useRef(null);

  const handleLangChange = (code) => { setVoiceLang(code); localStorage.setItem(STORAGE_KEY, code); };
  const handlePlayerNameChange = (val) => { setPlayerName(val); localStorage.setItem('pgr_player_name', val); };

  const parseItem = (item) => {
    const storyId = item.StoryId;
    const title   = item.Title;
    const dashIdx = title.indexOf(' - ');
    if (dashIdx === -1) return { storyId, category: 'Special & Prologue', storyline: 'Special', stageName: title, summary: item.SummaryContent, fullTitle: title };
    const category = title.slice(0, dashIdx).trim();
    const rest     = title.slice(dashIdx + 3).trim();
    const arrowIdx = rest.indexOf(' → ');
    if (arrowIdx === -1) {
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

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const catItems = useMemo(() => {
    if (!activeCategory) return [];
    return allItems.filter(i => i.category === activeCategory.key);
  }, [allItems, activeCategory]);

  const chapters = useMemo(() => {
    if (!activeCategory) return [];
    const uniqueStorylines = Array.from(new Set(catItems.map(i => i.storyline)));
    const catMeta = Object.values(chapterMeta).filter(m => m.catId === activeCategory.id);
    if (catMeta.length > 0) {
      return catMeta.map(m => {
        const match = uniqueStorylines.find(s => s === m.name || s.toLowerCase() === m.name.toLowerCase());
        return { name: m.name, storylineKey: match || m.name, bgUrl: m.bgUrl, chapId: m.chapId, stageCount: catItems.filter(i => i.storyline === (match || m.name)).length };
      }).filter(c => c.stageCount > 0);
    }
    return uniqueStorylines.sort((a, b) => {
      const n = s => { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 999999; };
      return n(a) - n(b) || a.localeCompare(b);
    }).map(s => ({ name: s, storylineKey: s, bgUrl: activeCategory.bg, chapId: null, stageCount: catItems.filter(i => i.storyline === s).length }));
  }, [catItems, activeCategory, chapterMeta]);

  const stageItems = useMemo(() => {
    if (!activeChapter) return [];
    return catItems.filter(i => i.storyline === activeChapter);
  }, [catItems, activeChapter]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allItems.filter(i => i.fullTitle.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q) || i.storyId.toLowerCase().includes(q));
  }, [allItems, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of allItems) counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, [allItems]);

  const goCategory = (cat) => { setActiveCategory(cat); setActiveChapter(''); setView(VIEW.CHAPTERS); };
  const goChapter  = (ch)  => { setActiveChapter(ch.storylineKey); setView(VIEW.STAGES); };
  const goBack     = () => {
    if (view === VIEW.STAGES)        { setActiveChapter(''); setView(VIEW.CHAPTERS); }
    else if (view === VIEW.CHAPTERS) { setActiveCategory(null); setView(VIEW.CATEGORIES); }
  };

  const isSearch = searchQuery.trim().length > 0;
  const accentColor = activeCategory?.accent || '#00d2ff';

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="cs2-root">
      <div className="cs2-topbar">
        <div className="cs2-logo"><Zap size={16} className="cs2-logo-icon" /><span>STORY ARCHIVE</span></div>
      </div>
      <div className="cs2-hero">
        <div className="cs2-hero-bg" />
        <div className="cs2-hero-text">
          <div className="cs2-hero-label">PUNISHING: GRAY RAVEN</div>
          <div className="cs2-hero-title">STORY ARCHIVE</div>
          <div className="cs2-hero-sub">Synchronizing M.I.N.D. Database<span className="cs2-dot-anim">...</span></div>
        </div>
      </div>
      <div className="cs2-body">
        <div className="cs2-cat-grid">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="cs2-cat-card hs-skeleton" style={{ animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Category Grid ─────────────────────────────────────────────────────────
  const CategoriesView = () => (
    <div className="cs2-cat-grid">
      {WIKI_CATEGORIES.map((cat, i) => {
        const count = categoryCounts[cat.key] || 0;
        return (
          <button
            key={cat.id}
            className="cs2-cat-card card-stagger"
            style={{ animationDelay: `${i * 0.05}s`, '--card-accent': cat.accent }}
            onClick={() => goCategory(cat)}
            onMouseEnter={() => setHoveredCard(cat.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <img src={resolveAssetPath(cat.bg)} alt={cat.name} className="cs2-cat-img" loading="lazy" />
            <div className="cs2-cat-gradient" />
            <div className="cs2-cat-shine" />
            <div className="cs2-cat-body">
              <div className="cs2-cat-info">
                <span className="cs2-cat-name">{cat.name}</span>
                {count > 0 && <span className="cs2-cat-count">{count} stories</span>}
              </div>
            </div>
            <div className="cs2-cat-accent-line" />
          </button>
        );
      })}
    </div>
  );

  // ── Chapter Grid ──────────────────────────────────────────────────────────
  const ChaptersView = () => (
    <div className="cs2-chap-grid">
      {chapters.map((ch, i) => (
        <button
          key={ch.name}
          className="cs2-chap-card card-stagger"
          style={{ animationDelay: `${i * 0.06}s`, '--card-accent': accentColor }}
          onClick={() => goChapter(ch)}
        >
          <img
            src={resolveAssetPath(ch.bgUrl)}
            alt={ch.name}
            className="cs2-chap-img"
            loading="lazy"
            onError={e => { e.target.src = resolveAssetPath(activeCategory.bg); }}
          />
          <div className="cs2-chap-gradient" />
          <div className="cs2-chap-info">
            <span className="cs2-chap-name">{ch.name}</span>
            <span className="cs2-chap-stages">{ch.stageCount} stages</span>
          </div>
          <div className="cs2-cat-accent-line" />
        </button>
      ))}
      {chapters.length === 0 && <div className="cs2-empty">No chapters found.</div>}
    </div>
  );

  // ── Stage List ────────────────────────────────────────────────────────────
  const StagesView = () => (
    <div className="cs2-stage-list">
      {stageItems.map((item, i) => (
        <div
          key={item.storyId}
          className="cs2-stage-row card-stagger"
          style={{ animationDelay: `${i * 0.035}s`, '--card-accent': accentColor }}
        >
          <div className="cs2-stage-num">{String(i + 1).padStart(2, '0')}</div>
          <div className="cs2-stage-info">
            <div className="cs2-stage-id">{item.storyId}</div>
            <div className="cs2-stage-name">{item.stageName}</div>
            {item.summary && <p className="cs2-stage-summary">{item.summary}</p>}
          </div>
          <button className="cs2-play-btn" onClick={() => onStartStory(item.storyId, voiceLang)}>
            <Play size={15} fill="currentColor" />
            <span>Play</span>
          </button>
        </div>
      ))}
      {stageItems.length === 0 && <div className="cs2-empty">No stages found.</div>}
    </div>
  );

  // ── Search View ───────────────────────────────────────────────────────────
  const SearchView = () => (
    <div className="cs2-stage-list">
      <div className="cs2-search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</div>
      {searchResults.slice(0, 100).map((item, i) => (
        <div
          key={item.storyId}
          className="cs2-stage-row card-stagger"
          style={{ animationDelay: `${i * 0.025}s` }}
        >
          <div className="cs2-stage-num">{String(i + 1).padStart(2, '0')}</div>
          <div className="cs2-stage-info">
            <div className="cs2-stage-id">{item.category} — {item.storyline}</div>
            <div className="cs2-stage-name">{item.stageName}</div>
            {item.summary && <p className="cs2-stage-summary">{item.summary}</p>}
          </div>
          <button className="cs2-play-btn" onClick={() => onStartStory(item.storyId, voiceLang)}>
            <Play size={15} fill="currentColor" /><span>Play</span>
          </button>
        </div>
      ))}
      {searchResults.length === 0 && <div className="cs2-empty">No results found.</div>}
    </div>
  );

  return (
    <div className="cs2-root">
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="cs2-topbar">
        <div className="cs2-logo">
          <Zap size={16} className="cs2-logo-icon" />
          <span>STORY ARCHIVE</span>
        </div>

        {/* Voice Lang Pills */}
        <div className="cs2-lang-row">
          {VOICE_LANGS.map(lang => (
            <button
              key={lang.code}
              className={`cs2-lang-btn ${voiceLang === lang.code ? 'active' : ''}`}
              onClick={() => handleLangChange(lang.code)}
              title={lang.full}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>

        {/* Commandant Name */}
        <div className="cs2-name-wrap">
          <span className="cs2-name-label">🎖</span>
          <input
            type="text"
            className="cs2-name-input"
            value={playerName}
            onChange={e => handlePlayerNameChange(e.target.value)}
            placeholder="Commandant"
            maxLength={20}
          />
        </div>

        {/* Search */}
        <div className={`cs2-search-wrap ${searchOpen ? 'open' : ''}`}>
          <button className="cs2-search-toggle" onClick={() => { setSearchOpen(s => !s); if (searchOpen) setSearchQuery(''); }}>
            {searchOpen ? <X size={16} /> : <Search size={16} />}
          </button>
          <input
            ref={searchRef}
            className="cs2-search-input"
            type="text"
            placeholder="Search stories, ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Settings */}
        <button className="cs2-settings-btn hs-settings-btn" onClick={onOpenSettings} title="Settings">
          <Settings size={16} />
        </button>
      </div>

      {/* ── Hero / Breadcrumb Strip ───────────────────────────────────── */}
      <div className="cs2-hero" style={{ '--hero-accent': accentColor }}>
        <div className="cs2-hero-bg" />
        <div className="cs2-hero-content">
          {/* Breadcrumb nav */}
          <div className="cs2-breadcrumb">
            <button
              className="cs2-bc-btn"
              onClick={() => { setView(VIEW.CATEGORIES); setActiveCategory(null); setActiveChapter(''); setSearchQuery(''); setSearchOpen(false); }}
            >
              <Home size={13} /><span>Archives</span>
            </button>
            {activeCategory && !isSearch && (
              <>
                <ChevronRight size={12} className="cs2-bc-sep" />
                <button className="cs2-bc-btn" onClick={() => { setActiveChapter(''); setView(VIEW.CHAPTERS); }}>
                  {activeCategory.icon} <span>{activeCategory.name}</span>
                </button>
              </>
            )}
            {activeChapter && !isSearch && (
              <>
                <ChevronRight size={12} className="cs2-bc-sep" />
                <span className="cs2-bc-current">{activeChapter}</span>
              </>
            )}
            {isSearch && (
              <>
                <ChevronRight size={12} className="cs2-bc-sep" />
                <span className="cs2-bc-current">Search results</span>
              </>
            )}
          </div>

          {/* Page title */}
          <div className="cs2-hero-title-row">
            {view !== VIEW.CATEGORIES && !isSearch && (
              <button className="cs2-back-btn" onClick={goBack}>
                <ChevronLeft size={18} />
              </button>
            )}
            <h1 className="cs2-page-title">
              {isSearch
                ? 'SEARCH'
                : view === VIEW.CATEGORIES
                  ? 'SELECT YOUR STORY'
                  : view === VIEW.CHAPTERS
                    ? activeCategory?.name?.toUpperCase()
                    : activeChapter?.toUpperCase()}
            </h1>
            {view === VIEW.CATEGORIES && !isSearch && (
              <span className="cs2-total-badge">{allItems.length} ENTRIES</span>
            )}
          </div>
        </div>
        <div className="cs2-hero-line" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="cs2-body">
        {isSearch
          ? <SearchView />
          : view === VIEW.CATEGORIES
            ? <CategoriesView />
            : view === VIEW.CHAPTERS
              ? <ChaptersView />
              : <StagesView />}
      </div>
    </div>
  );
}
