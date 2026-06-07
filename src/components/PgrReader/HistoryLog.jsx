import { useEffect, useRef } from 'react';
import { X, List } from 'lucide-react';
import { parseRichTextToSegments } from './richTextParser';

export default function HistoryLog({ logs, onClose, onJumpToStep }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="vn-modal-overlay">
      <div className="vn-modal-container history-modal">
        <div className="vn-modal-header">
          <div className="modal-title-wrapper">
            <List size={20} className="modal-title-icon" />
            <h2>DIALOGUE BACKLOG LOG</h2>
          </div>
          <button className="vn-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="history-modal-body" ref={scrollRef}>
          {logs.length > 0 ? (
            <div className="history-logs-wrapper">
              {logs.map((log, idx) => {
                const isNarrator = log.speaker === 'Narrator' || !log.speaker;
                const isChoice = log.isChoice;
                
                return (
                  <div key={idx} className={`history-log-row ${isNarrator ? 'narrator' : ''} ${isChoice ? 'choice-log' : ''}`}>
                    {!isNarrator && !isChoice && (
                      <div className="history-log-speaker">
                        {log.speaker}
                      </div>
                    )}
                    {isChoice && (
                      <div className="history-log-choice-badge">
                        Selected Choice
                      </div>
                    )}
                    <div className="history-log-text-row">
                      <div className="history-log-text">
                        {parseRichTextToSegments(log.text).map((seg, sIdx) => (
                          <span key={sIdx} style={seg.style}>
                            {seg.text}
                          </span>
                        ))}
                      </div>
                      {log.stepIndex !== undefined && onJumpToStep && (
                        <button 
                          className="history-log-jump-btn"
                          onClick={() => onJumpToStep(log.stepIndex)}
                          title="Jump to this scene"
                        >
                          Jump
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">
              <p>M.I.N.D. backlog index is empty. No dialogues recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

