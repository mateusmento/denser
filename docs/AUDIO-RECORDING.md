# Audio recording (composer)

Voice-note style capture in the message composer — separate from screen recording (#34).

## Flow

1. User picks a microphone from the composer **Record audio** button group dropdown (device selection before capture).
2. Primary button starts recording immediately; an inline badge appears above the composer with animated waveform, timer, and **Stop**.
3. **Stop** finalizes `MediaRecorder` output (`audio/webm` when supported) and stages the file through the same upload pipeline as file attachments (#19).
4. Staged and sent audio attachments render as an inline **audio player** (not a file badge).

## Files

- `packages/app/src/features/conversation/lib/audio-recording-capture.ts`
- `packages/app/src/features/conversation/composables/useMessageComposerAudioRecording.ts`
- `packages/app/src/features/conversation/presentationals/AudioRecordingBadge.vue`
- `packages/app/src/features/conversation/presentationals/AudioAttachmentPlayer.vue`
