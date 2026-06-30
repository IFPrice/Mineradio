const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const desktopLyricsHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'desktop-lyrics.html'), 'utf8');

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

test('desktop lyrics payload follows the skyline lyrics switch in real time', () => {
  const payload = functionBody(indexHtml, 'desktopLyricsPayload');
  assert.match(payload, /skyline:\s*!!fx\.lyricSkyline/);
  assert.match(payload, /previous:\s*lyric\.previous\s*\|\|\s*''/);
  assert.match(payload, /next:\s*lyric\.next\s*\|\|\s*''/);

  const push = functionBody(indexHtml, 'pushDesktopLyricsState');
  assert.match(push, /payload\.skyline/);
  assert.match(push, /payload\.previous/);
  assert.match(push, /payload\.next/);

  const toggle = functionBody(indexHtml, 'toggleFx');
  assert.match(toggle, /if \(key === 'lyricSkyline'\) \{[\s\S]*refreshCurrentLyricStyle\(\);[\s\S]*pushDesktopLyricsState\(true\);[\s\S]*\}/);
});

test('desktop lyric snapshots include neighboring lyrics for skyline splitting', () => {
  const snapshot = functionBody(indexHtml, 'currentDesktopLyricSnapshot');
  assert.match(snapshot, /previous:\s*normalizeDesktopLyricText\(/);
  assert.match(snapshot, /next:\s*normalizeDesktopLyricText\(/);
  assert.match(snapshot, /stageLyrics\.currentContext/);
});

test('desktop lyrics window renders skyline split text with the shared model', () => {
  assert.match(desktopLyricsHtml, /<script src="skyline-lyrics\.js"><\/script>/);
  assert.match(desktopLyricsHtml, /id="skylineLayer"/);
  assert.match(desktopLyricsHtml, /function renderSkylineLayer\(/);
  assert.match(desktopLyricsHtml, /MineradioSkylineLyrics\.buildModel/);
  assert.match(desktopLyricsHtml, /body\.classList\.toggle\('desktop-skyline'/);
});

test('desktop skyline side words keep the original soft motion while the center line stays owned by desktop lyrics', () => {
  assert.match(desktopLyricsHtml, /var skylineMotionState\s*=\s*\{/);
  assert.match(desktopLyricsHtml, /function resetSkylineMotion\(/);
  assert.match(desktopLyricsHtml, /function skylineKeywordMotion\(/);

  const motion = functionBody(desktopLyricsHtml, 'skylineKeywordMotion');
  assert.match(motion, /delay:\s*clamp\(/);
  assert.match(motion, /phase:\s*index \* 1\.73/);
  assert.match(motion, /appear\s*=\s*appear \* appear \* \(3 - 2 \* appear\)/);
  assert.match(motion, /travel\s*=\s*1 - Math\.pow\(1 - travel,\s*2\.2\)/);
  assert.match(motion, /Math\.sin\(now \* item\.speed \+ item\.phase\)/);

  const renderer = functionBody(desktopLyricsHtml, 'renderSkylineLayer');
  assert.match(renderer, /skylineKeywordMotion\(keywords\[i\],\s*i,\s*nowMs\)/);
  assert.doesNotMatch(renderer, /line\.style/);
  assert.doesNotMatch(renderer, /line\.textContent/);
  assert.doesNotMatch(renderer, /replayLineAnimation\(/);
});

test('desktop skyline readability tuning is local to the desktop lyrics window', () => {
  assert.match(desktopLyricsHtml, /--desktop-skyline-keyword-alpha:1\.72/);
  assert.match(desktopLyricsHtml, /--desktop-skyline-glow-boost:1\.55/);
  assert.match(desktopLyricsHtml, /--desktop-skyline-keyword-color:color-mix/);
  assert.match(desktopLyricsHtml, /\.skyline-piece\.keyword\{color:var\(--desktop-skyline-keyword-color\)/);

  const motion = functionBody(desktopLyricsHtml, 'skylineKeywordMotion');
  assert.match(motion, /desktopSkylineMotionTuning/);
  assert.match(motion, /distance: \(0\.12 \+ clamp\(Number\(layer\.diffusion\)/);
  assert.match(motion, /\* desktopSkylineMotionTuning\.distance/);
  assert.match(motion, /curve: \(0\.018 \+ \(index % 4\) \* 0\.006\) \* desktopSkylineMotionTuning\.curve/);

  const placer = functionBody(desktopLyricsHtml, 'placeSkylineNode');
  assert.match(placer, /desktopSkylineMotionTuning\.keywordAlpha/);
  assert.match(placer, /desktopSkylineMotionTuning\.maxX/);
  assert.match(placer, /desktopSkylineMotionTuning\.maxY/);
  assert.match(placer, /desktopSkylineMotionTuning\.motionX/);
  assert.match(placer, /desktopSkylineMotionTuning\.motionY/);

  assert.doesNotMatch(indexHtml, /desktopSkylineMotionTuning/);
});
