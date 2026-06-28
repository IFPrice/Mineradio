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

test('3D playlist shelf filters playlists by current playback provider', () => {
  assert.match(functionBody('currentShelfPlaylistProvider'), /shelfPlaylistProviderOverride/);
  assert.match(functionBody('currentShelfPlaylistProvider'), /songProviderKey\(song\)/);
  assert.match(functionBody('shelfPlaylistMatchesPlaybackProvider'), /normalizeProviderKey\(pl && pl\.provider\)\s*===\s*provider/);
  assert.match(functionBody('shelfAllowsPodcastCollections'), /provider === 'netease'/);

  const shelf = functionBody('makeShelfManager');
  assert.match(shelf, /var providerFilter = currentShelfPlaylistProvider\(\)/);
  assert.match(shelf, /shelfPlaylistMatchesPlaybackProvider\(pl, providerFilter\)/);
  assert.match(shelf, /shelfAllowsPodcastCollections\(providerFilter\)/);
  assert.match(shelf, /providerFilter,\s*source\.length/);
});

test('platform switches and playback changes both update the 3D playlist shelf provider', () => {
  assert.match(indexHtml, /var shelfPlaylistProviderOverride\s*=\s*''/);

  const setter = functionBody('setShelfPlaylistProvider');
  assert.match(functionBody('normalizeShelfPlaylistProvider'), /provider === 'all'/);
  assert.match(setter, /shelfPlaylistProviderOverride\s*=\s*next/);
  assert.match(setter, /scheduleShelfRebuild\(/);

  assert.match(functionBody('syncHomeToAccountProvider'), /setShelfPlaylistProvider\(provider/);
  assert.match(functionBody('playQueueAt'), /setShelfPlaylistProvider\(providerKey/);
});

test('playlist All button clears the 3D shelf provider filter explicitly', () => {
  const current = functionBody('currentShelfPlaylistProvider');
  assert.match(current, /override === 'all'/);
  assert.match(current, /return ''/);

  const playlistFilter = functionBody('setPlaylistProviderFilter');
  assert.match(playlistFilter, /provider === 'all'/);
  assert.match(playlistFilter, /setShelfPlaylistProvider\('all'/);
});
