(function(root) {
  'use strict';

  function clamp(value, min, max) {
    value = Number(value);
    if (!isFinite(value)) value = min;
    return Math.max(min, Math.min(max, value));
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function chars(value) {
    return Array.from(cleanText(value));
  }

  function sliceWrap(list, start, size) {
    if (!list.length) return '';
    var out = [];
    for (var i = 0; i < size; i++) out.push(list[(start + i) % list.length]);
    return out.join('');
  }

  function keywordPool(text, fallback) {
    var source = cleanText(text) || cleanText(fallback);
    if (!source) return [];
    var bySpace = source.split(/\s+/).filter(Boolean);
    if (bySpace.length > 1) return bySpace;
    var list = chars(source);
    var out = [];
    var sizes = [2, 3, 4, 2, 3, 1];
    for (var i = 0; i < Math.max(4, Math.min(8, list.length)); i++) {
      out.push(sliceWrap(list, i * 2, Math.min(sizes[i % sizes.length], list.length)));
    }
    return out.filter(Boolean);
  }

  function pickKeyword(pool, index) {
    if (!pool.length) return '';
    return pool[index % pool.length];
  }

  function buildKeywords(input, progress, currentText) {
    var leftPool = keywordPool(input.previous, currentText);
    var rightPool = keywordPool(input.next || currentText, currentText);
    var mixedPool = keywordPool(currentText, input.next || input.previous);
    var defs = [
      { side:'left', pool:leftPool, at:0, x:-0.64, y:-0.38, scale:1.46, opacity:0.31, blur:1.7, spread:0.48, rotate:-6.4, trail:0.16 },
      { side:'left', pool:mixedPool, at:2, x:-0.92, y:0.00, scale:1.22, opacity:0.21, blur:3.3, spread:0.76, rotate:4.8, trail:0.25 },
      { side:'left', pool:leftPool, at:4, x:-0.50, y:0.44, scale:1.06, opacity:0.17, blur:4.8, spread:1.00, rotate:-3.4, trail:0.31 },
      { side:'right', pool:rightPool, at:1, x:0.66, y:-0.34, scale:1.66, opacity:0.39, blur:1.5, spread:0.46, rotate:6.0, trail:0.18 },
      { side:'right', pool:mixedPool, at:3, x:0.94, y:0.10, scale:1.34, opacity:0.24, blur:3.6, spread:0.82, rotate:-4.2, trail:0.28 },
      { side:'right', pool:rightPool, at:4, x:0.48, y:0.47, scale:1.12, opacity:0.18, blur:5.0, spread:1.06, rotate:3.0, trail:0.34 }
    ];
    return defs.map(function(def, i) {
      var pulse = Math.sin((progress + i * 0.19) * Math.PI * 2);
      var sign = def.side === 'left' ? -1 : 1;
      return {
        text: pickKeyword(def.pool, def.at),
        side: def.side,
        layer: i,
        x: def.x + sign * progress * 0.045 + pulse * 0.024,
        y: def.y + Math.sin((progress * 0.72 + i * 0.21) * Math.PI * 2) * 0.038,
        opacity: clamp(def.opacity + pulse * 0.035, 0.10, 0.46),
        blur: def.blur,
        fontScale: def.scale,
        scale: def.scale,
        rotate: def.rotate + pulse * 1.2,
        trail: def.trail,
        spread: def.spread,
        diffusion: 0.22 + def.spread * 0.58,
        delay: i * 0.05
      };
    }).filter(function(item) { return !!item.text; });
  }

  function emptyModel(progress) {
    return {
      center: { text: '', align: 'center', x: 0, y: 0, opacity: 0, fontScale: 1, progress: progress },
      nextPreview: { text: '', align: 'center', x: 0, y: 0.34, opacity: 0, fontScale: 0.62, progress: progress },
      previousGhost: { text: '', align: 'center', x: 0, y: -0.06, opacity: 0, fontScale: 0.84, blur: 3.2, progress: progress },
      keywords: [],
      fragments: []
    };
  }

  function buildModel(input) {
    input = input || {};
    var text = cleanText(input.text);
    var progress = clamp(input.progress == null ? 0 : input.progress, 0, 1);
    if (!text) return emptyModel(progress);
    var next = cleanText(input.next);
    var previous = cleanText(input.previous);
    var push = Math.sin(progress * Math.PI);
    var intro = 1 - clamp(progress / 0.22, 0, 1);
    var keywords = buildKeywords(input, progress, text);
    return {
      center: {
        text: text,
        align: 'center',
        x: 0,
        y: -0.02 + intro * 0.17 - push * 0.018,
        opacity: clamp(1 - intro * 0.10, 0.90, 1),
        fontScale: 1 - intro * 0.035 + push * 0.018,
        progress: progress
      },
      nextPreview: {
        text: next,
        align: 'center',
        x: 0,
        y: 0.31 - push * 0.025,
        opacity: next ? clamp(0.34 + push * 0.08, 0.28, 0.46) : 0,
        fontScale: 0.58,
        progress: progress
      },
      previousGhost: {
        text: previous,
        align: 'center',
        x: 0,
        y: -0.10 - push * 0.015,
        opacity: previous ? clamp(0.13 + (1 - progress) * 0.10, 0.10, 0.25) : 0,
        fontScale: 0.78,
        blur: 3.4 + progress * 2.4,
        progress: progress
      },
      keywords: keywords,
      fragments: keywords
    };
  }

  var api = { buildModel: buildModel };
  root.MineradioSkylineLyrics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
