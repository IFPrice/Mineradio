# QQ Home Design

## Goal

Add a QQ Music-specific Home state without changing the existing Home layout. The left hero/large block remains an unfinished placeholder, while the existing right-side six cards and lower five tiles show QQ-specific content and actions.

## Scope

This design applies only when the active Home provider is QQ Music.

Keep:
- Existing Home layout and card positions.
- Left large block copy: "此处施工，敬请期待".
- Existing provider switching behavior from account buttons and playlist source buttons.

Change:
- Right-side six large cards should use QQ Music content.
- Lower five tiles should use QQ Music content.
- QQ Home should no longer render as a generic `qq-pending` placeholder for these blocks.

## Right-Side Six Large Cards

1. QQ 歌单
   - Shows synced QQ playlist count.
   - Uses the first QQ playlist cover, falling back to QQ account avatar.
   - Click action: switch/open the left playlist panel filtered to QQ.

2. QQ 今日开播
   - Builds a QQ playback queue from stable local data: QQ playlists, recently played QQ songs, and QQ search seeds.
   - Does not depend on an unproven QQ official daily recommendation endpoint.
   - Click action: start the generated QQ queue.

3. QQ 搜索开播
   - Uses the most relevant recent QQ song or artist as a search seed.
   - Click action: open QQ search results or start a small QQ search queue.

4. 继续听 QQ
   - Shows the most recent QQ song from local listening history.
   - Click action: play that QQ song.

5. QQ 账号状态
   - Shows QQ nickname, VIP indicator, and playback authorization status.
   - Click action: open the account modal focused on QQ.

6. QQ 我喜欢 / 收藏歌单
   - Prefer the QQ "我喜欢" playlist if available.
   - Otherwise use the first collected QQ playlist.
   - Click action: open that QQ playlist.

## Lower Five Tiles

1. QQ 歌单 1
   - First QQ playlist.

2. QQ 歌单 2
   - Second QQ playlist, or first collected QQ playlist.

3. 最近 QQ 歌曲
   - Recent QQ song from listen history.

4. QQ 歌手入口
   - Artist detail or related songs for the recent QQ song artist.

5. QQ 搜索种子
   - Dynamic or fixed QQ search query, such as a recent QQ artist or a fallback QQ recommendation keyword.

## Data Sources

Use existing stable capabilities:
- `qqLoginStatus`
- `qqPlaylists`
- `userPlaylists` filtered by provider `qq`
- local listen history / summary helpers
- existing QQ search endpoint
- existing QQ playlist track endpoint
- existing QQ artist detail endpoint when an artist mid is available

Avoid adding first-version dependency on a new QQ official homepage or daily recommendation endpoint.

## Empty And Logged-Out States

If QQ is not logged in:
- Right-side cards should invite QQ login or QQ search, while keeping the left block as the construction placeholder.

If QQ is logged in but playlists are empty:
- Show account status, QQ search entry, and empty playlist guidance.

If playback authorization is incomplete:
- The account status card should surface that state without blocking browsing/search.

## Testing

Add regression coverage that verifies:
- QQ Home has a dedicated render branch instead of `qq-pending` only.
- The left large block remains the construction placeholder in QQ mode.
- The six large card labels/content map to QQ-specific semantics.
- Lower tiles use QQ playlists, recent QQ songs, artist entry, and QQ search seed.

## Non-Goals

- Do not redesign Home layout.
- Do not implement a new QQ official daily recommendation API in the first pass.
- Do not change the left large block from "此处施工，敬请期待".
- Do not change NetEase or Qishui Home behavior except where shared helpers need provider-safe branching.
