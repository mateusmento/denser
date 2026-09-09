# 35 — Audio recording composer (Slack-style)

**Chunk:** 3f — Recording  
**Layer:** app  
**Domain:** [VIDEO-RECORDING.md](../../../docs/VIDEO-RECORDING.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** open  
**GitHub:** [#35](https://github.com/mateusmento/denser/issues/35)  
**Blocked by:** 19 — Composer upload UI  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [COVERAGE.md](../COVERAGE.md)

Product decisions from grilling session (2026-09-06). **Separate intent** from video recording — voice-note style capture staged as a message attachment.

**Related (separate issue):** [34 — Video recording dialog workflow](./34-video-recording-dialog-workflow.md)

---

## Summary

Add an **audio-only recording** path in the message composer (Slack-style). Distinct from the video recording dialog — no preview pane, no screen/webcam toggles.

---

## Composer entry

New composer action (separate from **Record video**):

**Button group:**
- **Primary:** starts recording immediately on click (permission prompt if needed).
- **Dropdown trigger (right):** microphone device list — select **before** recording; no device switching mid-capture.

Add to `composerActions.ts` + `MessageComposer.vue` (new action id, e.g. `audio` or `voice`).

---

## Recording badge (inline above composer)

Appears when recording starts. Horizontal compact badge:

| Region | Content |
| --- | --- |
| Left | *(no mic picker here — device chosen via composer button group)* |
| Center | **Waveform strip** — vertical bars in a row; **animate while recording** |
| Center-right | **Timer** (`0:12`) |
| Right | **Stop** button only |

**No Send button** — Stop finishes capture and stages the file through the **same upload pipeline as ticket 19** (attachment tile in composer).

---

## Interaction flow

```text
Click composer audio action → recording starts + badge shown
Click Stop → MediaRecorder finalizes → stage audio file → upload workflow
Discard/cancel (if needed) → abort without staging
```

- **Explicit start / stop** — no press-and-hold.
- Mic can be toggled off is N/A here (audio is the product); user picks device via dropdown before starting.

---

## Technical notes

- Reuse patterns from `video-recording-capture.ts` where sensible (`MediaRecorder`, mime type selection, chunk sink) but **no canvas compositor**.
- Output: `audio/webm` or browser-supported audio mime; filename like `voice-{timestamp}.webm`.
- New composable e.g. `useMessageComposerAudioRecording.ts` — keep separate from `useMessageComposerVideoRecording`.
- Wire in `ConversationContainer` (or composer container) alongside existing record handler.

**Owns:** composer action, button group, recording badge UI, audio capture composable, staging on stop.

**Must not touch:** video setup dialog (**34**); server APIs (client-only capture + existing upload).

---

## App checklist

- [ ] New composer action + button group (record + mic device dropdown)
- [ ] Inline recording badge: waveform animation, timer, stop
- [ ] `MediaRecorder` audio capture → file on stop
- [ ] Stage file via existing `onStageFiles` / upload path (**19**)
- [ ] Storybook story for recording badge states (idle recording, timer)
- [ ] Document in `docs/VIDEO-RECORDING.md` or new `docs/AUDIO-RECORDING.md` (short)

---

## PR

- [ ] `[messaging 35] Audio recording composer` — [PR-POLICY.md](../PR-POLICY.md)
