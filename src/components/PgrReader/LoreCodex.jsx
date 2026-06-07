import { useState, useEffect } from 'react';
import { Search, X, BookOpen, RefreshCw } from 'lucide-react';

export default function LoreCodex({ onClose }) {
  const [keywords, setKeywords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKeywords = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/pgr_data/MovieKeyword.json');
        const data = await res.json();
        
        const uniqueData = Array.from(new Map(data.map(item => [item.KuroTerm, item])).values())
          .sort((a, b) => a.KuroTerm.localeCompare(b.KuroTerm));

        setKeywords(uniqueData);
        if (uniqueData.length > 0) {
          setSelectedTerm(uniqueData[0]);
        }
      } catch (err) {
        console.error('Failed to load lore keywords:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredKeywords = keywords.filter(item => 
    item.KuroTerm.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.Interpretation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (searchQuery && filteredKeywords.length > 0 && !filteredKeywords.some(item => item.KuroTerm === selectedTerm?.KuroTerm)) {
      setSelectedTerm(filteredKeywords[0]);
    }
  }, [searchQuery, filteredKeywords, selectedTerm]);

  return (
    <div className="vn-modal-overlay">
      <div className="vn-modal-container codex-modal">
        <div className="vn-modal-header">
          <div className="modal-title-wrapper">
            <BookOpen size={20} className="modal-title-icon" />
            <h2>LORE CODEX DATABASE</h2>
          </div>
          <button className="vn-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="modal-loading">
            <RefreshCw className="loading-spinner" />
            <p>Decoding Archives...</p>
          </div>
        ) : (
          <div className="codex-modal-body">
            <div className="codex-sidebar">
              <div className="codex-search-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Query terminology..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="codex-terms-list">
                {filteredKeywords.map(item => (
                  <button
                    key={item.KuroTerm}
                    className={`codex-term-item ${selectedTerm?.KuroTerm === item.KuroTerm ? 'active' : ''}`}
                    onClick={() => setSelectedTerm(item)}
                  >
                    {item.KuroTerm}
                  </button>
                ))}
                {filteredKeywords.length === 0 && (
                  <p className="no-matches">No terminology matches query.</p>
                )}
              </div>
            </div>

            <div className="codex-display-panel">
              {selectedTerm ? (
                <div className="codex-detail-view">
                  <h1 className="codex-term-title">{selectedTerm.KuroTerm}</h1>
                  <hr className="codex-divider" />
                  <p className="codex-term-desc">{selectedTerm.Interpretation}</p>
                </div>
              ) : (
                <div className="codex-empty-display">
                  <BookOpen size={48} />
                  <p>Select a term to decode M.I.N.D. data streams.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
