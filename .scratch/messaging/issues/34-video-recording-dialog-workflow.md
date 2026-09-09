# 34 — Video recording dialog workflow (Slack-style)

**Chunk:** 3f — Recording  
**Layer:** app  
**Domain:** [VIDEO-RECORDING.md](../../../docs/VIDEO-RECORDING.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** open  
**GitHub:** [#34](https://github.com/mateusmento/denser/issues/34)  
**Blocked by:** 29 — Video recording → attach  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [COVERAGE.md](../COVERAGE.md)

Product decisions from grilling session (2026-09-06). Refactors the **video** recording setup flow to match Slack: dialog opens first, camera and screen share are independent toggles, preview reflects final output (WYSIWYG).

**Related (separate issue):** [35 — Audio recording composer](./35-audio-recording-composer.md)

---

## Problem

Today, clicking **Record video** calls `getDisplayMedia` **before** the dialog opens (`useMessageComposerVideoRecording.openDialog` → `setup.begin()` → `acquireVideoRecordingStreams`). The user must pick a screen immediately; camera is always composited as a circular overlay on screen content. Camera-only recording is not supported.

---

## Goals

1. Open the setup **dialog first** — no browser picker until the user opts in.
2. **Independent toggles** for webcam and screen share; at least one required to start recording.
3. **Preview modes:**
   - **Neither / no live video:** current user's **avatar** centered (fallback when camera permission denied or toggles off).
   - **Camera only:** webcam fills the preview (no overlay editor).
   - **Screen only:** screen fills the preview.
   - **Screen + camera:** screen main + circular camera overlay (existing composite); overlay edit mode as below.
4. **WYSIWYG:** preview matches exported video (no preview-only transforms).
5. **Floating in-preview controls** instead of switch grid below preview.

---

## Dialog open defaults

| Toggle | Default on open |
| --- | --- |
| Webcam | **On** — request camera immediately |
| Screen | **Off** |
| Mic | **On** |
| System audio | **On when screen share starts**; hidden in settings until screen is on |

**Start recording:** enabled when **webcam stream OR screen stream** is live. Mic may be off.

If user **cancels** the screen-share browser picker → **Screen toggle turns off**; dialog stays open.

---

## In-preview controls (setup phase)

**Bottom-center row** — circular toggle buttons:

`[ Webcam ] [ Mic ] [ Screen ] [ Settings ]`

- **Webcam / Mic / Screen:** on/off only (no device pickers on these buttons).
- **Settings:** opens popover with:
  - **Camera** submenu → device list
  - **Microphone** submenu → device list
  - **System audio** toggle row (visible only when screen share is on; default on when screen enables)
  - **Mirror camera** toggle — when on, **both preview and export** mirror the camera feed; when off, neither does

Remove the current `Switch` + `Select` grid below the preview in `VideoRecordingSetupDialog.vue`.

---

## Camera overlay edit mode (screen + webcam only)

Handles are **hidden by default**.

| Step | Behavior |
| --- | --- |
| Hover overlay | Centered icon button on overlay (`SquarePenIcon`, transparent bg + `backdrop-blur`) — **visible on hover only** |
| Click Edit | Resize/move handles shown; icon becomes **Confirm** (`CheckIcon`, same style/position) |
| Click Confirm | Handles hidden; hover-to-Edit again |

**Setup phase only** — no overlay editing while recording.

**Camera-only mode:** no overlay editor (full-frame camera in preview).

---

## Capture / compositor changes

Refactor `useVideoRecordingSetup` + `video-recording-capture.ts`:

- Split stream acquisition: screen (`getDisplayMedia`) and webcam (`getUserMedia`) on **toggle**, not upfront in `begin()`.
- `begin()` opens dialog + attempts default webcam; screen acquired when Screen toggled on.
- Update `drawCompositeFrame` / preview compositor for three layouts:
  - camera-only frame (optional mirror from settings)
  - screen-only frame
  - screen + circular webcam overlay
- `canStart` when `webcamVideo` or `screenVideo` is drawable.
- Preview aspect ratio follows active primary source (camera intrinsic vs screen capture).

**Owns:** setup composable refactor, dialog UI, overlay edit UX, compositor modes, Storybook updates.

**Must not touch:** audio-only composer (**35**); upload pipeline (**19**).

---

## App checklist

- [ ] Dialog opens without `getDisplayMedia` prompt
- [ ] Webcam / screen / mic toggles as floating circles in preview
- [ ] Settings popover: devices + system audio + mirror toggle
- [ ] Avatar fallback when no live video
- [ ] Camera-only, screen-only, and combined modes in preview + export
- [ ] Overlay edit: hover Edit → confirm to lock layout (setup only)
- [ ] Start gated on ≥1 video source
- [ ] Screen picker cancel → screen toggle off
- [ ] Update `VideoRecordingSetupDialog` + `VideoRecordingCameraEditor` stories
- [ ] Update `docs/VIDEO-RECORDING.md` workflow section

---

## PR

- [ ] `[messaging 34] Video recording dialog workflow` — [PR-POLICY.md](../PR-POLICY.md)
