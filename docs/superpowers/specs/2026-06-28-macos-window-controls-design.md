# macOS Window Controls Design

## Goal

Replace the current Windows-style custom window controls with macOS-style traffic-light controls.

The selected direction is option B from the visual comparison: move the close, minimize, and fullscreen controls to the top-left of the custom titlebar, while keeping the existing guide, update, and DIY actions on the top-right.

## Scope

- Change only the custom desktop titlebar controls in `public/index.html`.
- Preserve the current Electron window control behavior:
  - red closes the app window through the existing close action
  - yellow minimizes through the existing minimize action
  - green toggles the existing fullscreen flow
- Preserve the current transparent, rounded desktop-shell window treatment.
- Keep the titlebar draggable except on clickable controls.
- Do not switch to Electron native traffic-light controls in this pass.
- Do not change the Home page, search UI, playback controls, or provider behavior.

## Layout

The custom titlebar should split into two visible control groups:

- Left: `close`, `minimize`, `fullscreen` traffic-light controls.
- Right: existing `?`, update, and `DIY` controls.

The traffic-light controls should use the standard macOS color language:

- red: close
- yellow: minimize
- green: fullscreen

Hover affordances may reveal subtle glyphs, but the default visible state should be colored circles rather than Windows-style line icons.

## Implementation Notes

- Reuse the existing `data-window-action` click wiring so behavior stays stable.
- Prefer CSS and markup changes over main-process changes.
- Keep button hit areas comfortable while making the visible circles compact.
- Keep fullscreen state updates compatible with the existing `icon-maximize` / `icon-restore` state logic, or replace that logic with a class-based traffic-light state if simpler.

## Verification

- Run the existing Node test suite.
- Verify the titlebar still exposes three clickable window actions.
- Verify the app package still builds as arm64.
- Manually inspect the local app or browser-rendered UI to confirm:
  - traffic-light buttons are on the left
  - guide, update, and DIY remain on the right
  - no titlebar controls overlap at desktop widths
