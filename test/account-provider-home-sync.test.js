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

function blockBody(source, anchor) {
  const start = source.indexOf(anchor);
  assert.notEqual(start, -1, `Expected block anchor ${anchor}`);
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `Expected ${anchor} to open a block`);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  assert.fail(`Could not parse block for ${anchor}`);
}

test('account platform switches use one Home sync path', () => {
  const helper = functionBody('syncHomeToAccountProvider');
  assert.match(helper, /setSearchMode\(/);
  assert.match(helper, /applyHomeStateForAccountProvider\(provider\)/);
  assert.match(helper, /renderHomeDiscover\(/);
  assert.match(helper, /openHomeForAccountProvider\(provider/);

  const state = functionBody('applyHomeStateForAccountProvider');
  assert.match(state, /provider === 'qishui'/);
  assert.match(state, /homeDiscoverState\.mode\s*=\s*'qishui'/);
  assert.match(state, /homeDiscoverState\.songs\s*=\s*\[\]/);
  const qqBranch = blockBody(state, "if (provider === 'qq')");
  assert.match(state, /provider === 'qq'/);
  assert.match(qqBranch, /homeDiscoverState\.mode\s*=\s*'qq'/);
  assert.doesNotMatch(qqBranch, /homeDiscoverState\.mode\s*=\s*'qq-pending'/);
  assert.match(qqBranch, /homeDiscoverState\.loaded\s*=\s*(?:false|true)/);

  const openHome = functionBody('openHomeForAccountProvider');
  assert.match(openHome, /homeForcedOpen\s*=\s*true/);
  assert.match(openHome, /homeSuppressed\s*=\s*false/);
  assert.match(openHome, /togglePlaylistPanel\(false\)/);
  assert.match(openHome, /updateEmptyHomeVisibility\(/);

  assert.match(functionBody('handleAccountProviderAction'), /syncHomeToAccountProvider\(provider/);
  assert.match(functionBody('setActiveAccountProvider'), /syncHomeToAccountProvider\(provider/);
});

test('playlist provider buttons switch the matching Home source', () => {
  const setter = functionBody('setPlaylistProviderFilter');
  assert.match(setter, /provider === 'netease' \|\| provider === 'qq' \|\| provider === 'qishui'/);
  assert.match(setter, /activeAccountProvider\s*=\s*provider/);
  assert.match(setter, /syncHomeToAccountProvider\(provider,\s*\{\s*openHome:\s*false/);
  assert.match(setter, /applyPlaylistProviderFilter\(provider/);
});
