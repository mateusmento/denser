# Audio recording (composer)

Voice-note style capture in the message composer — separate from video recording (#34).

## Flow

1. User picks a microphone from the composer **Record audio** button group dropdown (device selection before capture).
2. Primary button starts recording immediately; an inline badge appears above the composer with animated waveform, timer, and **Stop**.
3. **Stop** finalizes `MediaRecorder` output (`audio/webm` when supported) and stages the file through the same upload pipeline as file attachments (#19).
4. Staged and sent audio attachments render as a Slack-style **audio player badge** (play/pause, real waveform, seek, duration) — not a file tile or native `<audio controls>`.

## Audio player badge (#37)

- Fixed width `w-[22rem]` badge with play/pause, decoded waveform bars, and time label.
- Waveform peaks from `AudioContext.decodeAudioData` (cached per attachment); cross-origin CDN urls fetch via `GET /api/attachments/:id/content` (same-origin, credentialed).
- Click or drag waveform to seek; keyboard arrows when focused.
- **Global single-player:** starting clip B pauses clip A anywhere in the app.
- Composer uses the same badge; playback works from `blob:` url while upload is in progress.

## Files

- `packages/app/src/features/conversation/lib/audio-recording-capture.ts`
- `packages/app/src/features/conversation/lib/decode-audio-peaks.ts`
- `packages/app/src/features/conversation/lib/audio-playback-registry.ts`
- `packages/app/src/features/conversation/composables/useMessageComposerAudioRecording.ts`
- `packages/app/src/features/conversation/composables/useAudioPlayer.ts`
- `packages/app/src/features/conversation/presentationals/AudioRecordingBadge.vue`
- `packages/app/src/features/conversation/presentationals/AudioWaveform.vue`
- `packages/app/src/features/conversation/presentationals/AudioAttachmentPlayer.vue`
