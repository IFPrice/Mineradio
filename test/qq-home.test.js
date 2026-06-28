const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function functionBody(name) {
  const start = indexHtml.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected ${name} to be defined`);
  const open = indexHtml.indexOf('{', start);
  assert.notEqual(open, -1, `Expected ${name} to have a body`);
  let depth = 0;
  for (let i = open; i < indexHtml.length; i++) {
    const ch = indexHtml[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return indexHtml.slice(open + 1, i);
    }
  }
  assert.fail(`Could not parse body for ${name}`);
}

function assertIncludesText(source, text, context) {
  assert.equal(
    source.includes(text),
    true,
    `Expected ${context} to include ${JSON.stringify(text)}`
  );
}

function assertHasKindBranch(source, kind) {
  const branch = new RegExp(`(?:item\\.kind\\s*===\\s*'${kind}'|case\\s+'${kind}')`);
  assert.match(source, branch);
}

test('QQ Home logic follows the preferred QQ provider', () => {
  const body = functionBody('homeUsesQQLogic');
  assert.match(body, /homePreferredProvider\(\)\s*===\s*'qq'/);
});

test('QQ Home discover keeps the existing layout and wires the approved QQ labels', () => {
  const body = functionBody('renderHomeDiscover');
  assert.match(body, /var qqHome = homeUsesQQLogic\(\);/);
  assert.match(body, /if\s*\(qqHome\)/);
  assertIncludesText(indexHtml, '此处施工，敬请期待', 'static Home hero markup');
  assert.doesNotMatch(body, /QQ 音乐 Home 正在施工/);
  assert.doesNotMatch(body, /Mineradio · QQ Music/);
  assertIncludesText(body, 'QQ 歌单', 'renderHomeDiscover');
  assertIncludesText(body, 'QQ 今日开播', 'renderHomeDiscover');
  assertIncludesText(body, 'QQ 搜索开播', 'renderHomeDiscover');
  assertIncludesText(body, '继续听 QQ', 'renderHomeDiscover');
  assertIncludesText(body, 'QQ 账号状态', 'renderHomeDiscover');
  assertIncludesText(body, 'QQ 我喜欢 / 收藏歌单', 'renderHomeDiscover');
});

test('QQ Home tiles are sourced from QQ playlists and recent QQ listening', () => {
  const body = functionBody('qqHomeTiles');
  assert.match(body, /qqHomePlaylists\(\)/);
  assert.match(body, /qqRecentRecord\(/);
  assert.match(body, /return\s*\[/);
  assertIncludesText(body, 'QQ 歌单 1', 'qqHomeTiles');
  assertIncludesText(body, 'QQ 歌单 2', 'qqHomeTiles');
  assertIncludesText(body, '最近 QQ 歌曲', 'qqHomeTiles');
  assertIncludesText(body, 'QQ 歌手入口', 'qqHomeTiles');
  assertIncludesText(body, 'QQ 搜索开播', 'qqHomeTiles');
  assert.match(body, /kind:\s*'qqPlaylist'[\s\S]*kind:\s*'qqPlaylist'[\s\S]*kind:\s*'qqRecentSong'[\s\S]*kind:\s*'qqArtist'[\s\S]*kind:\s*'qqSearch'/);
  assert.doesNotMatch(body, /while\s*\(/);
  assert.doesNotMatch(body, /QQ 推荐/);
});

test('QQ Home recents use the existing listening history source', () => {
  const body = functionBody('qqRecentRecord');
  assert.match(body, /listenStatsState\.history/);
  assert.doesNotMatch(body, /listenRecords/);
});

test('QQ Home tile clicks branch on the QQ tile kinds', () => {
  const body = functionBody('handleHomeTileClick');
  assertHasKindBranch(body, 'qqPlaylist');
  assertHasKindBranch(body, 'qqRecentSong');
  assertHasKindBranch(body, 'qqArtist');
  assertHasKindBranch(body, 'qqSearch');
  assert.match(body, /openHomeQQLibrary\(\)/);
  assert.match(body, /songFromListenRecord\(item\.record \|\| item\.song\)/);
  assert.match(body, /runHomeSearch\(item\.query \|\| \(item\.song && item\.song\.artist\) \|\| 'QQ 音乐', 'qq'\)/);
  assert.match(body, /runHomeSearch\(item\.query \|\| 'QQ 音乐 推荐', 'qq'\)/);
});

test('QQ Home right cards use QQ-specific actions without changing card layout', () => {
  assert.match(functionBody('openHomeLibrary'), /openHomeQQLibrary\(\)/);
  assert.match(functionBody('playHomeSong'), /homeUsesQQLogic\(\)/);
  assert.match(functionBody('playHomeSong'), /playHomeQQDaily\(\)/);
  assert.match(functionBody('playHomeSong'), /playHomeQQSearch\(\)/);
  assert.match(functionBody('playHomeSong'), /playHomeQQFavorite\(\)/);
  assert.match(functionBody('playHomeRecent'), /qqRecentRecord\(\)/);
  assert.match(functionBody('playHomeRecent'), /runHomeSearch\('QQ 音乐 推荐', 'qq'\)/);
  assert.match(functionBody('openHomeInsight'), /openHomeQQAccount\(\)/);
});
