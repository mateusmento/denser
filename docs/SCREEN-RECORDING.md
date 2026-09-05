# Screen recording (messaging composer)

**Status:** v1 spec — messaging cut ticket **29**  
**Related:** [ATTACHMENTS.md](./ATTACHMENTS.md) · [CONVERSATIONS.md](./CONVERSATIONS.md) · [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) · [MEETINGS.md](./MEETINGS.md) (meeting recordings — separate)

---

## Goal

**Loom-like** screen recordings from the message composer: screen capture with a **circular webcam overlay baked into the final video**. The user **positions the camera circle before recording** on a live preview that matches the exported frame.

**v1 delivery:** stop → **upload as a normal message attachment** (`video/webm`) via the composer upload pipeline ([ticket 19](.scratch/messaging/issues/19-composer-attachments-app.md)).  
**Later:** first-class **Recording artifact** (permalink, viewer, chapters, comments) — not in v1.

---

## What exists today (spec + prototype)

| Source | What it says / does |
| --- | --- |
| [conversation.md](./ui-surfaces/conversation.md) | Composer action row; must **attach**, not download-only |
| [ATTACHMENTS.md](./ATTACHMENTS.md) | Recording → upload + attach (message and/or meeting anchor) |
| Ticket **29** | Capture → same upload pipeline as file attach |
| Epicstory `screen-recording.ts` | Canvas composite: `getDisplayMedia` + webcam rect + mixed audio → `MediaRecorder` → **download**; **fixed** webcam box; **no** pre-record layout UI |

Epicstory is the **compositing reference**, not the product UX. Denser adds pre-record preview, **draggable circular camera**, and **attach** instead of download.

---

## v1 user flow

```text
Composer "Record screen"
        │
        ▼
┌─────────────────────────────────────┐
│  Recording setup (modal / overlay)   │
│  • Pick screen / window / tab        │
│  • Live preview of capture           │
│  • Draggable circular webcam overlay │
│  • Toggles: cam · mic · system audio │
│  • [Cancel]  [Start recording]       │
└─────────────────────────────────────┘
        │ Start
        ▼
┌─────────────────────────────────────┐
│  Recording                          │
│  • Same preview + baked layout        │
│  • Timer · [Stop]                     │
└─────────────────────────────────────┘
        │ Stop
        ▼
Finalize blob → composer attachment tile → upload (19) → send
```

1. User opens setup from composer action row (`record`).
2. Browser prompts for **display** capture (`getDisplayMedia`) and optionally **camera** / **mic**.
3. **Setup surface** shows the screen stream full-bleed with a **draggable circular webcam** on top — this overlay is WYSIWYG for the exported video.
4. User drags/resizes (optional v1: drag only, fixed diameter) the circle to the desired corner/edge.
5. **Start recording** begins `MediaRecorder` on the **same composite** the preview uses (not a separate layout).
6. **Stop** finalizes `video/webm` (VP9 preferred, VP8 fallback), hands blob to **composer upload client** (progress, cancel, tile — ticket 19).
7. User sends message; timeline shows video via attachment render (ticket 20).

No separate recording API in v1 — reuse upload + draft anchor joins.

---

## Recording setup UI (v1)

### Surfaces

| Element | Behavior |
| --- | --- |
| **Screen preview** | `<video>` or canvas mirror of selected display capture; aspect ratio = export aspect ratio |
| **Camera circle** | Round `<video>` (webcam) inside a draggable handle; **clip-path: circle** (or canvas clip in export path) |
| **Drag** | Pointer drag within preview bounds; clamp so circle stays fully inside frame |
| **Position model** | Store `{ x, y, diameter }` in **preview pixel space** at native capture resolution; scale for display only |
| **Toggles** | Webcam on/off, mic on/off, system audio on/off (when browser exposes display audio) |
| **Actions** | Cancel (release tracks), Start recording |

### WYSIWYG rule

The **preview composite** and the **recording composite** must share one layout function:

```text
compositeFrame(screenFrame, webcamFrame, layout) → ImageBitmap | canvas
```

Preview: call every animation frame (or `requestVideoFrameCallback`).  
Record: same function fed into `canvas.captureStream(fps)` → `MediaRecorder`.

Avoid “DOM overlay for preview, different math for export.”

### Default layout

| Field | Default |
| --- | --- |
| Position | Bottom-left inset (e.g. 24px from edges) |
| Diameter | ~18% of min(preview width, preview height), clamped 120–220px at 1080p |
| Shape | **Circle** (v1); rounded-rect is non-goal |

Optional polish: snap to corners; remember last position in `localStorage` (session-scoped is enough for v1).

---

## Capture & compositing (implementation)

Port epicstory [`screen-recording.ts`](../../epicstory/app/src/core/screen-recording.ts) concepts with these changes:

| Concern | Approach |
| --- | --- |
| Screen | `navigator.mediaDevices.getDisplayMedia({ video: true, audio: systemAudioEnabled })` |
| Webcam | `getUserMedia({ video: true })` when cam enabled |
| Mic | `getUserMedia({ audio: true })` when mic enabled; mix with display audio via `AudioContext` → `MediaStreamDestination` |
| Composite | Offscreen or hidden `canvas` sized to **screen track settings** (`width` × `height`) |
| Webcam draw | `ctx.save(); ctx.beginPath(); ctx.arc(...); ctx.clip(); ctx.drawImage(webcamVideo, ...); ctx.restore()` |
| Optional ring | 2px semi-transparent border outside clip for contrast (draw before clip or stroke after) |
| Stream | `canvas.captureStream(30)` + mixed audio tracks |
| Codec | `video/webm;codecs=vp9` with fallback to vp8 / default |
| Cleanup | Stop all tracks, close `AudioContext`, clear rAF on cancel/stop |

### Module split (app)

| Module | Responsibility |
| --- | --- |
| `screen-recording-composite.ts` | Pure layout + `drawFrame`; shared preview + record |
| `screen-recording-capture.ts` | Acquire/release streams, audio mix, `MediaRecorder`, blob finalize |
| `useScreenRecordingSetup.ts` | Vue composable: state machine, position, toggles |
| `ScreenRecordingSetupDialog.vue` | Preview + draggable circle + controls |
| `useMessageComposerScreenRecording.ts` | Wire composer action → dialog → upload handoff |

Meeting tile layout (`epicstory/app/src/lib/meetings/screen-share.ts`) is for **live meeting PiP**, not baked export. See [meeting-room.md](./ui-surfaces/meeting-room.md).

---

## State machine

```text
idle → acquiring_permissions → setup_preview → recording → finalizing → handing_off_upload → idle
                  │                │              │
                  └ cancel ────────┴──────────────┘
```

| State | User sees |
| --- | --- |
| `acquiring_permissions` | Spinner; browser permission prompts |
| `setup_preview` | Draggable camera; Start enabled when screen stream live |
| `recording` | Timer, pulsing record indicator, Stop |
| `finalizing` | Brief “Processing…” while blob assembles |
| `handing_off_upload` | Composer attachment tile with upload progress (ticket 19) |

Errors (permission denied, track ended, `MediaRecorder` unsupported): toast + return to idle; release tracks.

---

## Integration with attachments (v1)

| Step | System |
| --- | --- |
| Blob type | `video/webm` (mime from recorder) |
| Filename | `recording-<timestamp>.webm` |
| Upload | Same HTTP + progressive upload as ticket **18** |
| Draft anchor | `ensureDraft` + sync joins (same as file attach) |
| Send | Attachment-only send allowed (empty TipTap body) |
| Timeline | Ticket **20** — inline video player or file tile with open |

**Not v1:** `recording` anchor type in attachment graph, dedicated player route, thumbnail generation job, transcript.

---

## Explicitly out of scope (v1)

| Item | Where it goes |
| --- | --- |
| Recording **artifact** entity (permalink, share link, viewer) | Future **Recordings** domain |
| Trim, chapters, CTAs, viewer comments | Artifact phase |
| Meeting room / LiveKit egress recording | [MEETINGS.md](./MEETINGS.md) M3 (`meeting_recording` anchor) |
| Server-side re-encode / HLS | Client WebM only until artifact phase |
| Mobile native capture | Desktop browser first |

---

## Future: Recording artifact (Loom parity)

When artifact lands, composer flow stays the same through capture/upload, but:

- Upload creates/links a **Recording** row (workspace-scoped) with viewer URL
- Message embeds recording ref (not only raw blob attachment)
- Attachments graph gains `recording` anchor (see ATTACHMENTS A4/A5 evolution)
- Player: watch page, chapters, comments — separate from message file tile

v1 WebM attachments remain valid; migration can wrap existing blobs as artifacts later.

---

## Acceptance criteria (ticket 29)

- [ ] Composer **Record screen** opens setup UI (not immediate record)
- [ ] User sees **live screen preview** before Start
- [ ] **Draggable circular webcam**; position reflected in exported video
- [ ] Toggles: webcam, mic, system audio (graceful degrade if unavailable)
- [ ] Record / Stop with elapsed timer
- [ ] Output uploads via composer attachment pipeline — **no download-only path**
- [ ] Cancel at any pre-record stage releases camera/screen tracks
- [ ] Manual test notes: Chrome + Firefox; permission-denied path

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-05 | Initial v1 spec: Loom-style pre-record layout, circular cam, attach-only delivery |
