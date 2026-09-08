# 37 — Custom audio attachment player (Slack-style badge)

**Chunk:** 3f — Recording  
**Layer:** app  
**Domain:** [AUDIO-RECORDING.md](../../../docs/AUDIO-RECORDING.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)  
**Status:** open  
**GitHub:** [#37](https://github.com/mateusmento/denser/issues/37)  
**Blocked by:** **35** — Audio recording composer (capture + staging shipped; player is the playback UX)  
**Related:** **35** (recording), **20** (message attachments display)

Replace the native `<audio controls>` placeholder with a compact Slack-style audio badge in messages and the composer.

---

## Decisions (locked)

| Decision | Answer |
|----------|--------|
| **Waveform** | Real peaks via Web Audio `decodeAudioData`; progress fill tracks playback |
| **Single-player** | **Global** — only one clip plays across the whole app; starting clip B pauses clip A everywhere (not per-conversation) |
| **Badge count** | Every `audio/*` attachment shows the player badge (not “one player for the whole thread”) |
| **Width** | Fixed `w-[22rem]` (~352px) or `max-w-sm` (384px) — not `max-w-xs` |
| **Composer** | Same badge as sent messages; full seek/play from `blob:` URL while upload is in progress |
| **Recording storage** | In-memory only until upload (`BlobPart[]` → `File` → `createObjectURL`); server URL after upload. No local disk persistence. |

---

## What Slack's player is (target UX)

Roughly a compact **badge** (~350px wide), not browser chrome:

| Area | Behavior |
|------|----------|
| **Shell** | Rounded pill, subtle border/background (similar to `AudioRecordingBadge`) |
| **Play / pause** | Circular icon button on the left |
| **Waveform** | Real amplitude bars from decoded audio; played portion highlighted; click/drag to seek |
| **Time** | `0:12` when idle; current time while playing |
| **Policy** | Only one clip plays at a time **app-wide** |

Visual language for the bar strip already exists in `AudioRecordingBadge.vue` — animated during recording; the player reuses that look, but **progress-driven** from decoded peaks.

---

## What we have today

- `AudioAttachmentPlayer.vue` — thin wrapper around native `<audio controls>`
- Wired in `MessageAttachmentList` and `ComposerAttachmentTiles`
- `audio/*` classified as `kind: "audio"` in message views
- Design system: `Button`, `Progress`, `Slider` — enough for a custom UI

Integration surface is small: **replace one presentational component** and add composables underneath.

---

## Recommended architecture

```
audioPlaybackRegistry (module)
  └── global currentlyPlayingId + pausePrevious()

useAudioPeaks (composable / lib)
  └── decodeAudioData → ~40–60 peak bars, cached by url/id

useAudioPlayer (composable)
  └── hidden <audio> + state + register with global registry

AudioWaveform (presentational)
  └── peak bars + progress fill + click-to-seek

AudioAttachmentPlayer (presentational)
  └── badge shell: [play] [waveform] [time]
```

### 1. `useAudioPlayer` composable (~80–120 lines)

Responsibilities:

- Create/use a hidden `HTMLAudioElement` (or ref to one)
- `play()`, `pause()`, `seek(seconds)`
- Bind `timeupdate`, `loadedmetadata`, `ended`, `error`
- Expose `duration`, `currentTime`, `progress` (0–1), `isPlaying`, `isReady`
- On `play()`, call **global registry** to pause any other active player

**Single-playback policy:** module-level `currentlyPlayingId` (or player instance ref). Starting clip B pauses clip A **anywhere in the app** — timeline, composer staging, files pane (when added).

### 2. Waveform — real peaks (required for v1)

1. Fetch or read `ArrayBuffer` from `File` (composer blob) or attachment URL (sent message).
2. `AudioContext.decodeAudioData` → sample channel data to ~40–60 peak values.
3. Cache peaks in memory keyed by `attachmentId` or stable url.
4. During playback, fill bars left-to-right from `currentTime / duration`.
5. Click/drag on waveform seeks.

Decode can run on the in-memory `File` immediately after recording stops — no need to wait for server upload.

### 3. `AudioAttachmentPlayer` badge (~60–80 lines template)

Props: `url`, `name`, `playerId` (attachment id or client id for global registry).

Layout:

```
┌─────────────────────────────────────────┐
│ (▶)  ▁▃▅▇▅▃▁▃▅▇  (filled ←── progress)  0:24 │
└─────────────────────────────────────────┘
```

- Fixed width: `w-[22rem] shrink-0`
- Reuse `rounded-lg border bg-muted/40 px-3 py-2` from `AudioRecordingBadge`
- Play/pause: `Button size="icon-sm"` + `PlayIcon` / `PauseIcon`
- Waveform: peak bars; played portion uses primary/highlight color
- Seek: click on waveform → `seek(clickX / width * duration)`
- Time: `formatAudioTime(seconds)` helper (`0:00` / `1:05`)

Accessibility:

- `role="group"` + `aria-label` from `name`
- Play button: `aria-pressed` / `aria-label="Play voice message"`
- Waveform: `role="slider"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`

### 4. Wire-up

- `MessageAttachmentList.vue` — one player badge per audio attachment
- `ComposerAttachmentTiles.vue` — same badge; `url` is `blob:` during upload, server url after

Optional later:

- `ConversationFilesPane.vue` — inline player for `audio/*`
- Shared peak decoder between recording badge animation (future) and player

---

## What we do *not* need (for v1)

- Backend changes (peaks JSON, waveform upload, etc.)
- New attachment metadata type
- Design-system extraction (can live in `features/conversation` first; promote if reused)
- Local disk persistence for recordings

---

## Suggested slices

**Slice 1 — Core player (~90 min)**  
`useAudioPlayer` + global single-play registry + real peak decode + waveform progress + badge shell. Swap into `AudioAttachmentPlayer`.

**Slice 2 — Polish (~30–45 min)**  
Loading/error states, keyboard (Space on focused player, arrow keys on waveform), Storybook + visual spec.

**Slice 3 — Optional**  
Playback speed (1× / 1.5×), download action, files pane variant.

---

## App checklist

- [x] `audioPlaybackRegistry` — app-wide single active player
- [x] `decodeAudioPeaks` lib + in-memory cache
- [x] `useAudioPlayer` composable (hidden audio element, play/pause/seek, state)
- [x] `AudioWaveform` presentational (real peaks + progress fill + click-to-seek)
- [x] Replace `AudioAttachmentPlayer` with Slack-style badge (`w-[22rem]`)
- [x] Composer: same badge, seek from blob URL while uploading
- [x] Storybook: idle, playing, loading, error states
- [x] Update `docs/AUDIO-RECORDING.md`

---

## PR

- [ ] `[messaging 37] Custom audio attachment player` — [PR-POLICY.md](../PR-POLICY.md)
