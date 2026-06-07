import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Folder, RefreshCw, Download, Settings, FileText, Volume2, Image as ImageIcon, Video, AlertCircle, XCircle } from 'lucide-react';

const SERVERS = [
  { code: 'global', name: 'Global (EN/JP/CN)' },
  { code: 'japan', name: 'Japan (JP)' },
  { code: 'taiwan', name: 'Taiwan (TW)' },
  { code: 'china', name: 'China (CN)' },
  { code: 'korea', name: 'Korea (KR)' }
];

export default function SettingsPage({ onBack }) {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('pgr_player_name') || 'Commandant');
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem('pgr_voice_lang') || 'ja');
  
  const [cliPath, setCliPath] = useState('/home/deist/.local/bin/pgr-assets');
  const [paths, setPaths] = useState({
    data: '/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie',
    audio: '/home/deist/Downloads/Work/pgr_extracted/audio',
    assets: '/home/deist/Downloads/Work/pgr_extracted/assets'
  });

  const [status, setStatus] = useState({
    cliInstalled: false,
    dataFolderExists: false,
    audioFolderExists: false,
    assetsFolderExists: false
  });

  const [selectedServer, setSelectedServer] = useState('global');
  const [pullTypes, setPullTypes] = useState({
    scripts: true,
    audio: false,
    images: false,
    video: false
  });

  const [importDir, setImportDir] = useState('');
  const [importTypes, setImportTypes] = useState({
    scripts: true,
    audio: true,
    images: true
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [logOutput, setLogOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const logTerminalRef = useRef(null);

  // Sync state from Electron on mount
  useEffect(() => {
    if (isElectron) {
      window.electronAPI.getSettings().then(sett => {
        if (sett) {
          setCliPath(sett.cliPath || '');
          setPaths(sett.paths || {});
        }
      });
      refreshStatus();
    }
  }, []);

  // Sync log updates from Electron
  useEffect(() => {
    if (isElectron) {
      const handleLog = (line) => {
        setLogOutput(prev => prev + line);
        // Scroll terminal to bottom
        if (logTerminalRef.current) {
          logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
        }
      };
      window.electronAPI.onLogUpdate(handleLog);
    }
  }, []);

  const refreshStatus = () => {
    if (isElectron) {
      window.electronAPI.getAssetStatus().then(setStatus);
    }
  };

  const handleSaveSettings = (updatedPaths = paths, updatedCli = cliPath) => {
    localStorage.setItem('pgr_player_name', playerName);
    localStorage.setItem('pgr_voice_lang', voiceLang);
    
    if (isElectron) {
      window.electronAPI.saveSettings({
        playerName,
        voiceLang,
        cliPath: updatedCli,
        paths: updatedPaths
      }).then(() => {
        refreshStatus();
      });
    }
  };

  const pickFolder = async (field) => {
    if (!isElectron) return;
    const pathSelected = await window.electronAPI.selectDirectory();
    if (pathSelected) {
      const nextPaths = { ...paths, [field]: pathSelected };
      setPaths(nextPaths);
      handleSaveSettings(nextPaths);
    }
  };

  const pickCliPath = async () => {
    if (!isElectron) return;
    const pathSelected = await window.electronAPI.selectDirectory(); // Can also pick dir where file is, or we'll allow standard dialog
    if (pathSelected) {
      const binaryPath = pathSelected.endsWith('pgr-assets') ? pathSelected : path.join(pathSelected, 'pgr-assets');
      setCliPath(binaryPath);
      handleSaveSettings(paths, binaryPath);
    }
  };

  const pickImportDir = async () => {
    if (!isElectron) return;
    const pathSelected = await window.electronAPI.selectDirectory();
    if (pathSelected) {
      setImportDir(pathSelected);
    }
  };

  const handleStartCloudUpdate = async () => {
    if (!isElectron) {
      alert('Cloud updates are only available inside the Desktop App.');
      return;
    }
    
    setLogOutput('');
    setErrorMessage('');
    setIsUpdating(true);

    const result = await window.electronAPI.pullCloudAssets(selectedServer, pullTypes);
    setIsUpdating(false);

    if (result.success) {
      alert('Assets updated successfully!');
      refreshStatus();
    } else {
      setErrorMessage(result.error || 'Failed to pull cloud assets.');
    }
  };

  const handleCancelUpdate = async () => {
    if (isElectron) {
      await window.electronAPI.cancelPull();
      setIsUpdating(false);
    }
  };

  const handleStartImport = async () => {
    if (!isElectron) return;
    if (!importDir) {
      alert('Please select a source folder to import.');
      return;
    }

    setIsUpdating(true);
    const result = await window.electronAPI.importLocalAssets(importDir, importTypes);
    setIsUpdating(false);

    if (result.success) {
      alert(result.message);
      refreshStatus();
    } else {
      alert('Import failed: ' + result.error);
    }
  };

  return (
    <div className="hs-root">
      <div className="hs-header">
        <div className="hs-header-left">
          <button className="hs-back-btn" onClick={onBack} disabled={isUpdating}>
            <ChevronLeft size={18} />
            <span>Archives</span>
          </button>
          <div className="hs-breadcrumb">
            <span className="hs-bc-current">🎖 Settings & Asset Manager</span>
          </div>
        </div>
      </div>

      <div className="hs-content hs-settings-container">
        
        {/* Left column: Path configurations & Settings */}
        <div className="hs-settings-left-col">
          
          {/* User Settings */}
          <div className="hs-settings-section">
            <h3 className="hs-settings-title"><Settings size={16} /> Player Configuration</h3>
            <div className="hs-settings-form-row">
              <label>Commandant Name</label>
              <input 
                type="text" 
                value={playerName} 
                onChange={(e) => { setPlayerName(e.target.value); localStorage.setItem('pgr_player_name', e.target.value); }}
                onBlur={() => handleSaveSettings()}
                maxLength={20}
              />
            </div>
            <div className="hs-settings-form-row">
              <label>BGM/Voice Language</label>
              <select 
                value={voiceLang} 
                onChange={(e) => { setVoiceLang(e.target.value); localStorage.setItem('pgr_voice_lang', e.target.value); }}
                onBlur={() => handleSaveSettings()}
              >
                <option value="ja">JP (Japanese)</option>
                <option value="zh">CN (Chinese)</option>
                <option value="ca">Cant (Cantonese)</option>
                <option value="en">EN (English)</option>
              </select>
            </div>
          </div>

          {/* Directory Settings */}
          <div className="hs-settings-section">
            <h3 className="hs-settings-title"><Folder size={16} /> Asset Directories</h3>
            
            <div className="hs-directory-row">
              <div className="hs-dir-info">
                <span className="hs-dir-label">📖 Stories JSON Directory</span>
                <span className={`hs-status-badge ${status.dataFolderExists ? 'success' : 'error'}`}>
                  {status.dataFolderExists ? 'Connected' : 'Missing'}
                </span>
                <span className="hs-dir-path">{paths.data}</span>
              </div>
              {isElectron && (
                <button className="hs-dir-pick-btn" onClick={() => pickFolder('data')} disabled={isUpdating}>
                  <Folder size={14} /> Browse
                </button>
              )}
            </div>

            <div className="hs-directory-row">
              <div className="hs-dir-info">
                <span className="hs-dir-label">🔊 Audio (BGM/SFX/Voices) Directory</span>
                <span className={`hs-status-badge ${status.audioFolderExists ? 'success' : 'error'}`}>
                  {status.audioFolderExists ? 'Connected' : 'Missing'}
                </span>
                <span className="hs-dir-path">{paths.audio}</span>
              </div>
              {isElectron && (
                <button className="hs-dir-pick-btn" onClick={() => pickFolder('audio')} disabled={isUpdating}>
                  <Folder size={14} /> Browse
                </button>
              )}
            </div>

            <div className="hs-directory-row">
              <div className="hs-dir-info">
                <span className="hs-dir-label">🖼 Graphics (Backgrounds/CGs) Directory</span>
                <span className={`hs-status-badge ${status.assetsFolderExists ? 'success' : 'error'}`}>
                  {status.assetsFolderExists ? 'Connected' : 'Missing'}
                </span>
                <span className="hs-dir-path">{paths.assets}</span>
              </div>
              {isElectron && (
                <button className="hs-dir-pick-btn" onClick={() => pickFolder('assets')} disabled={isUpdating}>
                  <Folder size={14} /> Browse
                </button>
              )}
            </div>

            <div className="hs-directory-row">
              <div className="hs-dir-info">
                <span className="hs-dir-label">🐍 pgr-assets CLI Executable Path</span>
                <span className={`hs-status-badge ${status.cliInstalled ? 'success' : 'error'}`}>
                  {status.cliInstalled ? 'Installed' : 'Not found'}
                </span>
                <span className="hs-dir-path">{cliPath}</span>
              </div>
              {isElectron && (
                <button className="hs-dir-pick-btn" onClick={pickCliPath} disabled={isUpdating}>
                  <Folder size={14} /> Browse
                </button>
              )}
            </div>
          </div>

          {/* Import Local assets */}
          {isElectron && (
            <div className="hs-settings-section">
              <h3 className="hs-settings-title"><Folder size={16} /> Import Offline Assets</h3>
              <p className="hs-section-desc">Select a local directory on your PC containing extracted PGR assets (e.g. ripped via AssetRipper or from another folder) to import into the app.</p>
              
              <div className="hs-import-setup">
                <div className="hs-dir-path-picker">
                  <span className="hs-dir-path truncate-path">{importDir || 'No source folder selected'}</span>
                  <button className="hs-dir-pick-btn" onClick={pickImportDir} disabled={isUpdating}>
                    Browse
                  </button>
                </div>
                
                <div className="hs-checkbox-group">
                  <label className="hs-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={importTypes.scripts} 
                      onChange={e => setImportTypes(prev => ({ ...prev, scripts: e.target.checked }))} 
                      disabled={isUpdating}
                    />
                    <span>Scripts</span>
                  </label>
                  <label className="hs-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={importTypes.audio} 
                      onChange={e => setImportTypes(prev => ({ ...prev, audio: e.target.checked }))} 
                      disabled={isUpdating}
                    />
                    <span>Audio</span>
                  </label>
                  <label className="hs-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={importTypes.images} 
                      onChange={e => setImportTypes(prev => ({ ...prev, images: e.target.checked }))} 
                      disabled={isUpdating}
                    />
                    <span>Graphics</span>
                  </label>
                </div>

                <button 
                  className="hs-import-run-btn" 
                  onClick={handleStartImport}
                  disabled={isUpdating || !importDir}
                >
                  <RefreshCw size={14} className={isUpdating ? 'spin' : ''} />
                  <span>Start Import</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Cloud update and download logs */}
        <div className="hs-settings-right-col">
          
          <div className="hs-settings-section cloud-downloader-card">
            <h3 className="hs-settings-title"><Download size={16} /> Cloud Assets Downloader</h3>
            <p className="hs-section-desc">Automatically extract and download game story files on-demand directly from PGR CDN servers via the `pgr-assets` tool.</p>

            <div className="hs-settings-form-row">
              <label>Select Server Preset</label>
              <select 
                value={selectedServer} 
                onChange={(e) => setSelectedServer(e.target.value)}
                disabled={isUpdating}
              >
                {SERVERS.map(srv => (
                  <option key={srv.code} value={srv.code}>{srv.name}</option>
                ))}
              </select>
            </div>

            <div className="hs-checkbox-grid">
              <label className="hs-checkbox-card">
                <input 
                  type="checkbox" 
                  checked={pullTypes.scripts} 
                  onChange={e => setPullTypes(prev => ({ ...prev, scripts: e.target.checked }))} 
                  disabled={isUpdating}
                />
                <div className="hs-check-card-content">
                  <FileText size={18} />
                  <span className="hs-card-title">Story Scripts</span>
                  <span className="hs-card-sub">Extract JSONs</span>
                </div>
              </label>

              <label className="hs-checkbox-card">
                <input 
                  type="checkbox" 
                  checked={pullTypes.audio} 
                  onChange={e => setPullTypes(prev => ({ ...prev, audio: e.target.checked }))} 
                  disabled={isUpdating}
                />
                <div className="hs-check-card-content">
                  <Volume2 size={18} />
                  <span className="hs-card-title">Audio BGM/Voice</span>
                  <span className="hs-card-sub">Download MP3s</span>
                </div>
              </label>

              <label className="hs-checkbox-card">
                <input 
                  type="checkbox" 
                  checked={pullTypes.images} 
                  onChange={e => setPullTypes(prev => ({ ...prev, images: e.target.checked }))} 
                  disabled={isUpdating}
                />
                <div className="hs-check-card-content">
                  <ImageIcon size={18} />
                  <span className="hs-card-title">Graphics CGs</span>
                  <span className="hs-card-sub">Get backgrounds</span>
                </div>
              </label>

              <label className="hs-checkbox-card">
                <input 
                  type="checkbox" 
                  checked={pullTypes.video} 
                  onChange={e => setPullTypes(prev => ({ ...prev, video: e.target.checked }))} 
                  disabled={isUpdating}
                />
                <div className="hs-check-card-content">
                  <Video size={18} />
                  <span className="hs-card-title">Cutscenes</span>
                  <span className="hs-card-sub">Get movie files</span>
                </div>
              </label>
            </div>

            <div className="hs-downloader-actions">
              {!isUpdating ? (
                <button 
                  className="hs-pull-run-btn" 
                  onClick={handleStartCloudUpdate}
                  disabled={!isElectron || (!pullTypes.scripts && !pullTypes.audio && !pullTypes.images && !pullTypes.video)}
                >
                  <Download size={15} />
                  <span>Start Cloud Update</span>
                </button>
              ) : (
                <button className="hs-pull-cancel-btn" onClick={handleCancelUpdate}>
                  <XCircle size={15} />
                  <span>Cancel Update</span>
                </button>
              )}
            </div>

            {/* Downloader Console Log output */}
            <div className="hs-console-wrapper">
              <div className="hs-console-header">
                <span>SYSTEM CONSOLE LOG</span>
                {isUpdating && <RefreshCw size={12} className="spin" />}
              </div>
              <pre className="hs-console-terminal" ref={logTerminalRef}>
                {logOutput || (isElectron ? 'Console idle. Press Start Cloud Update to run extraction process.' : 'CLOUD DOWNLOADER ONLY AVAILABLE ON THE PACKAGED DESKTOP ELECTRON APPLICATION')}
              </pre>
              {errorMessage && (
                <div className="hs-console-error">
                  <AlertCircle size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
