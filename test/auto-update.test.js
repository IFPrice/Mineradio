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
  assert.match(indexHtml, /id="update-version-badge"[^>]*>v1\.1\.5<\/span>/);
  assert.match(indexHtml, /\.update-version-badge/);
  assert.match(indexHtml, /currentVersion:\s*'1\.1\.5'/);
  assert.match(indexHtml, /version:\s*'1\.1\.5'/);
  assert.match(indexHtml, /function renderCurrentVersionBadge\(/);
  assert.match(indexHtml, /renderCurrentVersionBadge\(\)/);

  const syncBody = functionBody(indexHtml, 'syncUpdatePreviewStateClass');
  assert.match(syncBody, /isCurrentVersion/);
  assert.match(syncBody, /isCheckingUpdate/);
  assert.match(syncBody, /label\.textContent = '检查更新中'/);
  assert.match(syncBody, /label\.textContent = '已是最新版'/);
  assert.match(syncBody, /btn\.disabled = isCurrentVersion \|\| isCheckingUpdate/);
  assert.match(syncBody, /else if \(isReady && isAuto\) label\.textContent = '立刻重启'/);
});

test('update modal keeps the current app version when remote latest is older or equal', () => {
  const latestBody = functionBody(indexHtml, 'applyLatestUpdateInfo');
  assert.match(latestBody, /var currentVersion = data\.currentVersion \|\| updatePreviewState\.currentVersion/);
  assert.match(latestBody, /var latestVersion = data\.latestVersion \|\| release\.version \|\| currentVersion/);
  assert.match(latestBody, /updatePreviewState\.version = updatePreviewState\.updateAvailable \? latestVersion : currentVersion/);

  const autoBody = functionBody(indexHtml, 'applyDesktopAutoUpdateState');
  assert.match(autoBody, /if \(state\.latestVersion && updatePreviewState\.autoUpdateAvailable\) updatePreviewState\.version = state\.latestVersion/);
  assert.match(autoBody, /else updatePreviewState\.version = updatePreviewState\.currentVersion/);
});

test('update modal default copy describes the 1.1.5 updater experience', () => {
  assert.match(indexHtml, /更新状态更清晰，版本识别更直观。/);
  assert.match(indexHtml, /右上角显示当前版本号/);
  assert.match(indexHtml, /最新版时按钮置灰并显示已是最新版/);
  assert.match(indexHtml, /下载完成后可立刻重启安装/);
  assert.match(indexHtml, /重复点击更新会复用同一个下载任务/);
  assert.doesNotMatch(indexHtml, /安装包文字对比修复/);
  assert.doesNotMatch(indexHtml, /安装目录可自由选择/);
  assert.doesNotMatch(indexHtml, /单实例与快捷方式修复/);

  const applyBody = functionBody(indexHtml, 'applyDesktopAutoUpdateState');
  assert.match(indexHtml, /function defaultUpdateHero\(/);
  assert.match(indexHtml, /function defaultUpdateNotes\(/);
  assert.match(indexHtml, /function cleanUpdateCopyLine\(/);
  assert.match(indexHtml, /function normalizeUpdateNotes\(/);
  assert.match(applyBody, /cleanReleaseName \|\| defaultUpdateHero\(\)/);
  assert.match(applyBody, /updatePreviewState\.notes = normalizeUpdateNotes\(state\.releaseNotes\)/);
  assert.doesNotMatch(applyBody, /state\.releaseNotes\.slice\(0,\s*4\)/);
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
