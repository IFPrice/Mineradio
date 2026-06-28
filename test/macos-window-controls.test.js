const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function titlebarMarkup() {
  const start = indexHtml.indexOf('<div id="desktop-titlebar"');
  assert.notEqual(start, -1, 'Expected desktop titlebar markup');
  const end = indexHtml.indexOf('<div id="fullscreen-diy-zone"', start);
  assert.notEqual(end, -1, 'Expected fullscreen DIY zone after titlebar');
  return indexHtml.slice(start, end);
}

test('desktop titlebar uses left macOS traffic lights and right utility controls', () => {
  const markup = titlebarMarkup();
  assert.match(markup, /desktop-traffic-lights/);
  assert.match(markup, /desktop-utility-controls/);
  assert.ok(markup.indexOf('desktop-traffic-lights') < markup.indexOf('desktop-drag-region'));
  assert.ok(markup.indexOf('desktop-utility-controls') > markup.indexOf('desktop-drag-region'));
});

test('traffic lights preserve existing window action wiring', () => {
  const markup = titlebarMarkup();
  assert.match(markup, /desktop-window-btn close[\s\S]*data-window-action="close"/);
  assert.match(markup, /desktop-window-btn minimize[\s\S]*data-window-action="minimize"/);
  assert.match(markup, /desktop-window-btn maximize[\s\S]*data-window-action="maximize"/);
});

test('traffic lights are styled as macOS circles instead of Windows icon buttons', () => {
  assert.match(indexHtml, /\.desktop-window-btn\{[^}]*border-radius:50%/);
  assert.match(indexHtml, /\.desktop-window-btn\.close\{[^}]*#ff5f57/);
  assert.match(indexHtml, /\.desktop-window-btn\.minimize\{[^}]*#ffbd2e/);
  assert.match(indexHtml, /\.desktop-window-btn\.maximize\{[^}]*#28c840/);
});
