const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const mainJs = fs.readFileSync(path.join(root, 'desktop', 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(root, 'desktop', 'preload.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected ${name} to be defined`);
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `Expected ${name} to have a body`);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  assert.fail(`Could not parse body for ${name}`);
}

test('mac auto update release metadata points at the IFPrice GitHub repository', () => {
  assert.equal(packageJson.dependencies['electron-updater'], '^6.8.9');
  assert.equal(packageJson.build.publish[0].provider, 'github');
  assert.equal(packageJson.build.publish[0].owner, 'IFPrice');
  assert.equal(packageJson.build.publish[0].repo, 'Mineradio');
  assert.equal(packageJson.mineradio.update.owner, 'IFPrice');
  assert.equal(packageJson.mineradio.update.repo, 'Mineradio');
  assert.deepEqual(
    packageJson.build.mac.target.map((target) => target.target),
    ['dmg', 'zip'],
  );
});

test('main process owns the updater lifecycle instead of opening a DMG only', () => {
  assert.match(mainJs, /require\('electron-updater'\)/);
  assert.match(mainJs, /autoUpdater\.autoDownload\s*=\s*false/);
  assert.match(mainJs, /autoUpdater\.autoInstallOnAppQuit\s*=\s*false/);
  assert.match(mainJs, /autoUpdater\.setFeedURL\(\{[\s\S]*owner:\s*UPDATE_FEED_OWNER[\s\S]*repo:\s*UPDATE_FEED_REPO/);
  assert.match(mainJs, /autoUpdater\.downloadUpdate\(\)/);
  assert.match(mainJs, /autoUpdater\.quitAndInstall\(false,\s*true\)/);
  assert.match(mainJs, /ipcMain\.handle\('mineradio-auto-update-check'/);
  assert.match(mainJs, /ipcMain\.handle\('mineradio-auto-update-download'/);
  assert.match(mainJs, /ipcMain\.handle\('mineradio-auto-update-install'/);
  assert.match(mainJs, /mineradio-auto-update-state/);
});

test('preload exposes narrow app update methods and state events', () => {
  assert.match(preloadJs, /checkAppUpdate:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('mineradio-auto-update-check'\)/);
  assert.match(preloadJs, /downloadAppUpdate:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('mineradio-auto-update-download'\)/);
  assert.match(preloadJs, /installAppUpdate:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('mineradio-auto-update-install'\)/);
  assert.match(preloadJs, /onAppUpdateState/);
  assert.match(preloadJs, /mineradio-auto-update-state/);
});

test('update modal prefers automatic app updates before DMG fallback', () => {
  const startBody = functionBody(indexHtml, 'startUpdatePreviewDownload');
  const autoIndex = startBody.indexOf('startDesktopAutoUpdate');
  const installerIndex = startBody.indexOf('startRealUpdateDownload');
  assert.ok(autoIndex >= 0, 'Expected the primary button to start desktop auto update');
  assert.ok(installerIndex >= 0, 'Expected DMG fallback to remain available');
  assert.ok(autoIndex < installerIndex, 'Expected auto update to run before DMG fallback');

  assert.match(indexHtml, /function applyDesktopAutoUpdateState\(/);
  assert.match(indexHtml, /function startDesktopAutoUpdate\(/);
  assert.match(indexHtml, /function bindDesktopAutoUpdater\(/);
  assert.match(indexHtml, /window\.desktopWindow\.downloadAppUpdate\(\)/);
  assert.match(indexHtml, /window\.desktopWindow\.installAppUpdate\(\)/);
  assert.match(indexHtml, /重启安装/);
});

test('update UI shows the current version and disables the primary button when current', () => {
  assert.match(indexHtml, /id="update-version-badge"/);
  assert.match(indexHtml, /\.update-version-badge/);
  assert.match(indexHtml, /function renderCurrentVersionBadge\(/);
  assert.match(indexHtml, /renderCurrentVersionBadge\(\)/);

  const syncBody = functionBody(indexHtml, 'syncUpdatePreviewStateClass');
  assert.match(syncBody, /isCurrentVersion/);
  assert.match(syncBody, /label\.textContent = '已是最新版'/);
  assert.match(syncBody, /btn\.disabled = isCurrentVersion/);
  assert.match(syncBody, /else if \(isReady && isAuto\) label\.textContent = '立刻重启'/);
});

test('main process coalesces duplicate auto update download and install requests', () => {
  assert.match(mainJs, /let appAutoUpdateDownloadPromise = null/);
  assert.match(mainJs, /let appAutoUpdateInstallInProgress = false/);

  const downloadBody = functionBody(mainJs, 'downloadAppAutoUpdate');
  assert.match(downloadBody, /if \(appAutoUpdateDownloadPromise\) return appAutoUpdateDownloadPromise/);
  assert.match(downloadBody, /appAutoUpdateDownloadPromise = \(async \(\) =>/);
  assert.match(downloadBody, /appAutoUpdateDownloadPromise = null/);

  const installBody = functionBody(mainJs, 'installAppAutoUpdate');
  assert.match(installBody, /if \(appAutoUpdateInstallInProgress\)/);
  assert.match(installBody, /appAutoUpdateInstallInProgress = true/);
});
