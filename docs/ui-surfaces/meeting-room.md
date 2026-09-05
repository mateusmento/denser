# Meeting room (UI surface)

**Status:** Draft — screen share specified; other in-call chrome TBD  
**Domain:** [MEETINGS.md](../MEETINGS.md)  
**Catalog:** [UI-SURFACES.md](../UI-SURFACES.md)  
**Related:** [SCREEN-RECORDING.md](../SCREEN-RECORDING.md) (composer Loom export — **different product**)

---

## Screen share vs composer recording

| | **Meeting screen share** (this doc) | **Composer screen recording** ([SCREEN-RECORDING.md](../SCREEN-RECORDING.md)) |
| --- | --- | --- |
| Purpose | Live presentation to other participants | Async video message attachment |
| Transport | **LiveKit** SFU (realtime) | Upload blob after stop |
| Camera | PiP tile alongside screen (not baked in) | Circular webcam **baked into** export |
| Pre-capture layout | N/A — browser picker only | Draggable circle on setup preview |
| Epicstory refs | `lib/meetings/screen-share.ts`, `meeting-peer-replace-tracks.ts`, `MeetingTile.vue` | `core/screen-recording.ts` |

Do **not** merge these code paths. Port **tile layout predicates** from meetings; port **canvas composite** only to composer recording.

---

## Screen share (M1)

**Phase:** M1 with LiveKit A/V ([MEETINGS.md](../MEETINGS.md))  
**Epicstory references:**

| File | Port to denser |
| --- | --- |
| `epicstory/app/src/lib/meetings/screen-share.ts` | Track classification + tile main/PiP split |
| `epicstory/app/src/domain/meetings/utils/meeting-screen-share.ts` | Re-export barrel (domain → lib) |
| `epicstory/app/src/domain/meetings/utils/meeting-peer-replace-tracks.ts` | **Concept only** — LiveKit replaces PeerJS `replaceTrack` |
| `epicstory/app/src/domain/meetings/composables/meeting.ts` | Start/stop lifecycle, socket sync, layout side-effects |
| `epicstory/app/src/presentationals/meeting/MeetingTile.vue` | Presentation aspect + PiP chrome |
| `epicstory/app/src/presentationals/meeting/MeetingControls.vue` | Share button + active state |

---

## User flow

```text
In call → [Share screen] control
        │
        ▼
Browser getDisplayMedia (screen / window / tab)
        │
        ├── Publish screen track via LiveKit (see Media plane)
        ├── Emit attendee.is_screen_sharing = true (API + socket)
        ├── Auto pin sharer + switch layout → speaker (see Layout)
        └── Local tile: screen main + camera PiP (if cam on)

User stops via:
  • Share button again, OR
  • Browser "Stop sharing" → track `ended` event → same cleanup
```

1. Participant clicks **Share screen** in in-call controls.
2. Browser `getDisplayMedia({ video: true, audio: false })` (system audio from display capture: **optional v1.1** — epicstory used `audio: false`).
3. Publish screen video to LiveKit; unpublish or swap back to camera on stop.
4. Server persists `MeetingAttendee.is_screen_sharing`; broadcast `attendee.media` / `screen-share-toggled` so remotes update tiles **even when track metadata loses `displaySurface`** (epicstory lesson after `replaceTrack`).
5. On start: **pin sharer** (local) and prefer **speaker layout** (see [MEETINGS.md — In-call layout](../MEETINGS.md#in-call-layout)).
6. On stop: restore camera as primary published video; clear flag; layout may revert per user preference.

**One screen share per participant** at a time. **One dominant presentation** per room is a layout concern (active speaker / pin), not a hard mutex — multiple participants may share; UI promotes pinned or active sharer.

---

## Media plane (LiveKit)

Epicstory used PeerJS + `RTCRtpSender.replaceTrack`. Denser uses **LiveKit self-hosted**:

| Concern | Epicstory | Denser target |
| --- | --- | --- |
| Publish screen | `replaceOutgoingVideoTrackForPeers(screenTrack)` | `localParticipant.setScreenShareEnabled(true, { audio })` or dedicated screen publish API |
| Stop screen | Replace sender back to camera track | `setScreenShareEnabled(false)` |
| Device change while sharing | `replaceOutgoingTracksForPeers` **skips** display-capture senders | LiveKit: re-publish camera without tearing down screen publication |
| Local preview stream | `compositeLocalMeetingMedia(mycamera, screenTrack)` for tile binding | Composite **for local tile only**; remotes receive separate tracks from SFU |

**Invariant:** camera mic audio stays on the **camera** publication; screen track is **video-only** in v1 (matches epicstory).

---

## Track classification (port from `screen-share.ts`)

Pure functions — no I/O. Unit-test against synthetic `MediaStreamTrack` settings/labels.

### `isDisplayCaptureVideoTrack(track)`

True when `track.getSettings().displaySurface` is set (browser display capture).

### `isPresentationLikeVideoTrack(track)`

True when display capture **or** label heuristics (`screen`, `display`, `window`, `monitor`) — fallback when metadata is missing on remotes.

### `partitionMeetingVideoTracks(stream)`

Returns `{ camera, screen, audio }` from a combined remote `MediaStream`:

- `screen` = first video track matching display capture
- `camera` = first non-display video (or sole video if no screen detected)

### `meetingTileVisualStreams(stream, isCameraOn, tileRole)`

| `tileRole` | Screen live | Camera live + on | Result |
| --- | --- | --- | --- |
| `dock` | * | yes | main = camera + audio; pip = null |
| `dock` | * | no | main = null |
| `grid` / `featured` | yes | yes | main = screen + audio; **pip = camera** |
| `grid` / `featured` | yes | no | main = screen + audio; pip = null |
| `grid` / `featured` | no | yes | main = camera + audio |
| else | — | — | main = null |

**Why `isScreenSharing` flag:** after SFU/replaceTrack, remotes may not expose `displaySurface`. Persist **`MeetingAttendee.is_screen_sharing`** and pass **`participant.isScreenSharing`** into tiles for `object-contain` / presentation aspect (epicstory `MeetingTile.vue`).

### `compositeLocalMeetingMedia(mycamera, screenTrack)`

Local-only: merge camera+audio tracks with optional screen track for **local tile preview** binding. Screen is still published via LiveKit separately — same separation epicstory used (`localScreenShareTrack` off `mycamera`).

---

## Tile rendering (`MeetingTile` behavior)

Port presentation rules from epicstory `MeetingTile.vue`:

| Concern | Behavior |
| --- | --- |
| **Main video** | Screen or camera per `meetingTileVisualStreams` |
| **PiP** | Camera inset bottom-right (~22% width, min 72px, max 200px, rounded, border) when screen is main and camera is on |
| **Aspect** | `object-contain` + letterbox when `isScreenSharing` or `isPresentationLikeVideoTrack(main)` |
| **Featured stage** | 16:9 inner frame with rounded corners for presentation (letterbox inside tile) |
| **Badge** | Monitor icon when `hasLiveScreenTrack` |
| **Avatar fallback** | When no live main video |
| **streamEpoch** | Bump when remote `MediaStream` addtrack/removetrack so Vue rebinds video elements |

---

## Controls

In-call toolbar ([`MeetingControls` pattern](https://github.com/)):

| Control | Behavior |
| --- | --- |
| Share screen | Toggle; **active ring** when `isScreenSharing` |
| While sharing | Camera/mic toggles still apply to camera publication |
| Stop | Button or browser stop → full cleanup |

---

## Server / sync

| Piece | Spec |
| --- | --- |
| `meeting_attendees.is_screen_sharing` | boolean; default false |
| **ToggleScreenShare** command | Sets flag; idempotent |
| Event | `attendee.media` or dedicated `screen-share-toggled` `{ meetingId, participantId, enabled }` |
| Join ack | Include `is_screen_sharing` per attendee |
| Heartbeat / leave | Clear `is_screen_sharing` on leave |

Epicstory socket: `screen-share-toggled` with `{ meetingId, remoteId, enabled }` — denser may unify under `attendee.media` if one event shape covers cam/mic/screen.

---

## Layout side-effects

On **local** screen share start (epicstory behavior — adopt unless UX review says otherwise):

1. **Pin** local participant (or active sharer).
2. Set layout mode to **speaker** (screen large, others filmstrip).

On stop: unpin optional; layout reverts to **user preference** (grid vs speaker) stored per user.

[MEETINGS.md](../MEETINGS.md) already notes: default speaker when crowded or on screenshare — this implements that hook.

---

## Out of scope (meeting screen share)

| Item | Notes |
| --- | --- |
| Baked circular camera in screen video | Composer recording only |
| Region selection / annotation | Future |
| Remote control | Future |
| Simultaneous screen + tab + camera as three publications | v1: one screen video publication |
| LiveKit Egress recording of share | M3 recording — separate from live share |

---

## Acceptance criteria (M1 screen share)

- [ ] Share button publishes display capture to LiveKit
- [ ] Remotes see screen as main tile with correct aspect (contain)
- [ ] Sharer with camera on sees **PiP camera** on their own tile and remotes see sharer tile correctly
- [ ] `is_screen_sharing` synced via API/socket; tiles work when `displaySurface` missing on remote track
- [ ] Browser "Stop sharing" ends share without stuck state
- [ ] Stop restores camera publication; flag cleared
- [ ] Layout switches to speaker + pin on share start (per table above)
- [ ] Unit tests for `partitionMeetingVideoTracks` + `meetingTileVisualStreams`

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-05 | Initial screen share spec from epicstory `screen-share.ts` + meeting composable/tile |
