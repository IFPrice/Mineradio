const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadSkyline() {
  const file = path.join(__dirname, '..', 'public', 'skyline-lyrics.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox.window.MineradioSkylineLyrics;
}

test('buildModel keeps the current lyric centered and readable', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({
    text: '让所有梦在天际发光',
    previous: '风吹过旷野',
    next: '我们继续向前',
    progress: 0.42
  });

  assert.equal(model.center.text, '让所有梦在天际发光');
  assert.equal(model.center.align, 'center');
  assert.ok(model.center.opacity > 0.9);
  assert.ok(model.center.fontScale >= 1);
});

test('buildModel prepares the next lyric below the centered line', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({
    text: '流光经过漫长夜色',
    previous: '上一句歌词像雾散开',
    next: '下一句歌词从下方推上来',
    progress: 0.5
  });

  assert.equal(model.nextPreview.text, '下一句歌词从下方推上来');
  assert.ok(model.nextPreview.y > model.center.y);
  assert.ok(model.nextPreview.opacity > 0);
  assert.ok(model.nextPreview.opacity < model.center.opacity);
  assert.ok(model.nextPreview.fontScale < model.center.fontScale);
});

test('buildModel keeps the previous lyric as a centered fading ghost', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({
    text: '流光经过漫长夜色',
    previous: '上一句歌词像雾散开',
    next: '下一句歌词从下方推上来',
    progress: 0.5
  });

  assert.equal(model.previousGhost.text, '上一句歌词像雾散开');
  assert.equal(model.previousGhost.align, 'center');
  assert.ok(Math.abs(model.previousGhost.x) < 0.06);
  assert.ok(Math.abs(model.previousGhost.y) < 0.18);
  assert.ok(model.previousGhost.opacity > 0);
  assert.ok(model.previousGhost.opacity < model.nextPreview.opacity);
});

test('buildModel creates oversized side keywords with outward diffusion', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({
    text: '流光经过漫长夜色',
    previous: '上一句歌词像雾散开',
    next: '下一句歌词从远处靠近',
    progress: 0.5
  });

  const left = model.keywords.filter((keyword) => keyword.side === 'left');
  const right = model.keywords.filter((keyword) => keyword.side === 'right');
  assert.ok(left.length >= 5);
  assert.ok(right.length >= 5);
  assert.ok(model.keywords.every((keyword) => keyword.opacity > 0 && keyword.opacity < model.center.opacity));
  assert.ok(model.keywords.some((keyword) => keyword.fontScale > 1.28));
  assert.ok(model.keywords.some((keyword) => keyword.trail > 0));
  assert.ok(model.keywords.some((keyword) => Math.abs(keyword.driftX) > 0.9));
  assert.ok(model.keywords.some((keyword) => keyword.driftY > 0.6));
  assert.ok(model.keywords.some((keyword) => keyword.driftY < -0.5));
  assert.ok(Math.max(...model.keywords.map((keyword) => keyword.spread)) > Math.min(...model.keywords.map((keyword) => keyword.spread)));
  assert.ok(Math.max(...model.keywords.map((keyword) => keyword.y)) - Math.min(...model.keywords.map((keyword) => keyword.y)) > 0.95);
  assert.ok(model.keywords.some((keyword) => Math.abs(keyword.x) < 0.62));
  assert.ok(Math.max(...left.map((keyword) => Math.abs(keyword.x))) > 0.88);
  assert.ok(Math.max(...right.map((keyword) => Math.abs(keyword.x))) > 0.88);
});

test('buildModel derives side keywords from the current lyric', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({
    text: '星河正在发光',
    previous: '上一句旧词残影',
    next: '下一句预告文字',
    progress: 0.5
  });

  const currentChars = new Set(Array.from('星河正在发光'));
  const previousChars = new Set(Array.from('上一句旧词残影'));
  const nextChars = new Set(Array.from('下一句预告文字'));
  assert.ok(model.keywords.length > 0);
  assert.ok(model.keywords.every((keyword) => Array.from(keyword.text).some((char) => currentChars.has(char))));
  assert.ok(model.keywords.every((keyword) => !Array.from(keyword.text).every((char) => previousChars.has(char))));
  assert.ok(model.keywords.every((keyword) => !Array.from(keyword.text).every((char) => nextChars.has(char))));
});

test('buildModel returns an empty model for blank lyrics', () => {
  const skyline = loadSkyline();
  const model = skyline.buildModel({ text: '   ', previous: 'left', next: 'right' });

  assert.equal(model.center.text, '');
  assert.equal(model.fragments.length, 0);
  assert.equal(model.keywords.length, 0);
  assert.equal(model.nextPreview.text, '');
  assert.equal(model.previousGhost.text, '');
});
