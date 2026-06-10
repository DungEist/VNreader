import fs from 'fs';
import path from 'path';

const TOKEN = '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';
const OWNER = 'DungEist';
const REPO = 'VNreader';
const TAG = 'v0.0.0';
const RELEASE_NAME = 'PGR Reader v0.0.0 (Beta)';
const RELEASE_BODY = 'PGR Reader packaged as a native desktop application for Windows, macOS, and Linux.\n\n### Features:\n- Package React SPA with Electron shell.\n- Premium dark-themed Settings & Asset Manager.\n- Background Cloud Downloader and Local Importer.\n- YouTube Rick Roll placeholder video cutscene player.';

const filesToUpload = [
  'PGR Reader Setup 0.0.0.exe',
  'PGR Reader-0.0.0-win.zip',
  'PGR Reader-0.0.0-mac.zip',
  'PGR Reader-0.0.0.AppImage',
  'pgr-reader_0.0.0_amd64.deb'
].map(f => ({
  name: f,
  path: path.join('/home/deist/Downloads/Work/PGR_reader/dist-electron', f)
}));

async function main() {
  try {
    // 1. Create a release
    console.log(`Creating release for tag ${TAG}...`);
    const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: RELEASE_NAME,
        body: RELEASE_BODY,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${createRes.statusText}\n${errText}`);
    }

    const releaseData = await createRes.json();
    const releaseId = releaseData.id;
    console.log(`Release created successfully! ID: ${releaseId}`);

    // 2. Upload assets
    for (const file of filesToUpload) {
      if (!fs.existsSync(file.path)) {
        console.warn(`File not found, skipping: ${file.path}`);
        continue;
      }

      console.log(`Uploading ${file.name} (${(fs.statSync(file.path).size / (1024 * 1024)).toFixed(2)} MB)...`);
      const fileData = fs.readFileSync(file.path);

      const uploadUrl = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(file.name)}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/octet-stream'
        },
        body: fileData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`Failed to upload ${file.name}: ${uploadRes.status} ${uploadRes.statusText}\n${errText}`);
      } else {
        console.log(`Successfully uploaded ${file.name}!`);
      }
    }

    console.log('All uploads complete!');

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
