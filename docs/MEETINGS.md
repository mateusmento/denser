# Meetings

**Status:** Draft (domain + realtime sketch; not in conversation messaging cut)  
**Filing:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — Artifact kind `meeting_room`  
**UI:** TBD `ui-surfaces/meeting-room.md` (catalog: [UI-SURFACES.md](./UI-SURFACES.md))  
**Sources:** epicstory2 realtime/channel decisions; epicstory PeerJS meetings; Google Meet / Discord / Zoom UX references  

**Related:** [SCHEDULING.md](./SCHEDULING.md) (`meeting_start` / `meeting_reminder` jobs) · [ATTACHMENTS.md](./ATTACHMENTS.md) (recordings)

Meetings are **not** Conversations. A **Meeting room** is a durable place (artifact). A **Meeting** is one scheduled/live/ended occurrence. Media: **LiveKit self-hosted** SFU (not mesh, not LiveKit Cloud for v1 policy).

---

## Decisions (architecture)

| Decision | Choice | Rejected / why |
| --- | --- | --- |
| Place vs occurrence | **Meeting room** artifact + **Meeting** instances | Channel-as-meeting; calls glued to Conversation |
| Lifecycle | Every meeting is **Started** then **Ended** (`scheduled` → `live` → `ended` \| `cancelled`) | Always-on / never-ending “voice channel” session mode |
| Live cardinality | **≤ 1 live Meeting per room** | Multiple concurrent lives |
| Join policy | **`open`** \| **`knock`** (request host admit) | — |
| Hosts | Configurable **hosts[]** on the room (Start / End / Admit) | Anyone can start when knock |
| Pre-join | **Required lobby** (devices + attendees) as **artifact popover/dialog** or tab sheet — not a mandatory separate route; **no** global sidebar cam/mic strip | Discord-style global sidebar controls; always-on without Start |
| Notify chat | **Opt-in** soft “meeting started” card in a Conversation | Always post / chat as SoT |
| End policy | **Host End** **or** auto-end when empty after grace (~30–60s) | Host-only forever; never auto-end |
| Media | **LiveKit self-hosted** (Apache 2.0); media plane on **AWS-class** UDP hosts; denser app portable to **CF + AWS** | PeerJS mesh; LiveKit Cloud as v1 default; SFU on Workers |
| Signaling vs media | Socket.IO lifecycle/attendees; LiveKit for A/V | RTP on message sockets |
| In-call layout | **Speaker** (active large) + **Meet-like grid** (2–3 columns; 4+ grid fill) + **pin**; remember last per user | Tiny equal postage stamps only |
| Recording | Attach to **Meeting** (M3) | Download-only stub |
| Presence | Meeting attendees ≠ workspace online ≠ conversation viewers | Blended online |

---

## Compared to prior systems

| System | Takeaway for denser |
| --- | --- |
| epicstory2 | SFU direction; drop always-on channel type |
| epicstory | Instance/attendee/schedule/join/end/heartbeat; drop PeerJS + channel glue |
| Discord VC | Click-to-join feel via **inline lobby panel** on the artifact — not sidebar device chrome |
| Google Meet | Lobby devices; grid tile proportions that fill the viewport |
| Zoom | Knock / waiting room as **join policy**, not a separate product |

---

## Domain model

```text
Space (ACL)
  └── Meeting room artifact
        ├── settings: join_policy, hosts[], cameraOnJoin, micOnJoin
        └── Meeting* (scheduled | live | ended | cancelled)
              ├── MeetingAttendee*
              ├── optional calendar_event_id
              ├── optional conversation_message_id (soft, opt-in notify)
              ├── optional recording_ref
              └── LiveKit room (infra, keyed to live Meeting)
```

### Objects

| Object | Role |
| --- | --- |
| **Meeting room** | Artifact `kind = meeting_room` |
| **Meeting** | One occurrence / session |
| **Meeting attendee** | Join record + media flags |
| **Meeting host** | User allowed to Start / End / Admit (stored on room) |
| **LiveKit session** | Infra room for a live Meeting |

---

## Room settings

| Field | Values / notes |
| --- | --- |
| `join_policy` | `open` — Join enters call; `knock` — Ask to join → host Admit |
| `hosts` | User ids (creator is host by default) |
| `camera_on_join` | Default for lobby toggles |
| `mic_on_join` | Default for lobby toggles |

**Presets (UI only):** e.g. Open meeting (`open` + lobby defaults); Private meeting (`knock`). No always-on preset.

---

## Join UX (unified lobby panel)

Lobby is **required** but **navigation-dispensable**:

| Context | Chrome |
| --- | --- |
| Click room in This Space / list | **Popover or dialog** on the artifact: status, attendee avatars, cam/mic toggles, Start / Join / Ask to join |
| Room open as tab | Same content as **docked sheet/header** over room history |
| In call | Full meeting surface; panel dismissed |

**Phases** (same panel): Preview (devices) → Waiting (knock) → transition to In call.

- **Idle + host:** Start meeting (optionally “notify conversation”).  
- **Idle + non-host:** “Waiting for host to start.”  
- **Live + open:** Join (after device confirm).  
- **Live + knock:** Ask to join → Waiting until Admit.  
- **Scheduled fire:** system StartMeeting; same join rules.

Artifact tile when live: compact **attendee avatar stack**.

Do **not** put persistent cam/mic controls in the app shell sidebar (workflow noise).

---

## In-call layout

| Mode | Behavior |
| --- | --- |
| **Speaker** | Active speaker (or pinned) large; others filmstrip |
| **Grid** | Meet-like fill: **2–3 → horizontal columns**; **4+ → balanced grid** maximizing viewport (avoid tiny equal stamps for all counts) |
| **Pin** | User pins a tile; overrides active-speaker prominence while pinned |
| **Preference** | Remember last layout per user; factory default: grid when few participants, speaker when crowded or on screenshare (tunable) |

---

## Features (catalog)

| Feature | Phase | Notes |
| --- | --- | --- |
| Create / rename / archive meeting room | M0 | Includes hosts + join_policy settings |
| List meetings (history) | M0 | |
| Start / End meeting | M0/M1 | Hosts; empty auto-end grace |
| Lobby panel (popover/dialog/sheet) | M0/M1 | Devices + attendees |
| Join open / knock + Admit | M1 | |
| LiveKit A/V + screen share | M1 | Self-host |
| Active speaker | M1 | |
| Heartbeat / disconnect TTL | M1 | |
| Layout speaker + Meet grid + pin | M1 | |
| Opt-in conversation started card | M1 | Soft link |
| Schedule + reminders | M2 | Auto Start at fire time |
| Recording on Meeting | M3 | Via blob port |
| Live banners in shell | M1 | |

---

## Data schema (conceptual)

### Meeting room (extension)

| Field | Notes |
| --- | --- |
| artifact_id | PK → `kind = meeting_room` |
| join_policy | `open` \| `knock` |
| host_user_ids | uuid[] |
| camera_on_join / mic_on_join | boolean defaults |
| (shell) | title, space_id, root_space_id, created_by, version |

### Meeting

| Field | Notes |
| --- | --- |
| id | MeetingId |
| meeting_room_artifact_id | required |
| status | `scheduled` \| `live` \| `ended` \| `cancelled` |
| started_by | |
| started_at / ended_at | |
| scheduled_starts_at / scheduled_ends_at | optional |
| calendar_event_id | optional |
| conversation_message_id | optional soft link if notify opted in |
| recording_ref | optional |
| livekit_room_name | opaque infra id when live |

### Meeting attendee

| Field | Notes |
| --- | --- |
| meeting_id / user_id | |
| joined_at / left_at | |
| is_camera_on / is_microphone_on / is_screen_sharing | |
| livekit_participant_id | opaque |
| admit_state | `joined` \| `waiting` \| `admitted` \| `rejected` (knock) |

**Invariant:** ≤ one `live` Meeting per room.

---

## Commands

| Command | Result / validation |
| --- | --- |
| **CreateMeetingRoom** / **UpdateMeetingRoom** | Settings include join_policy, hosts, device defaults |
| **ScheduleMeeting** / **CancelScheduledMeeting** | Arms / clears runner jobs — [SCHEDULING.md](./SCHEDULING.md) |
| **StartMeeting** | Host (or **meeting_start** job); ≤1 live; allocate LiveKit room; optional notify Conversation |
| **JoinMeeting** | Live + ACL; open → attendee; knock → waiting until Admit |
| **AdmitAttendee** / **RejectAttendee** | Host; knock only |
| **LeaveMeeting** | left_at; if zero attendees → grace → End |
| **EndMeeting** | Host; tear down LiveKit |
| **KickAttendee** | Host |
| **ToggleAttendeeMedia** | Self (force-mute TBD) |
| **HeartbeatMeeting** | TTL |
| **AttachRecording** | M3 — [ATTACHMENTS.md](./ATTACHMENTS.md) A4 |

---

## Queries

| Query | Notes |
| --- | --- |
| **GetMeetingRoom** | + live summary + attendee preview |
| **ListSpaceMeetingRooms** | |
| **ListMeetings** / **GetMeeting** | |
| **GetLiveMeetingForRoom** | |
| **ListLiveMeetingsForWorkspace** | Shell banners |
| **GetMeetingJoinCredentials** | LiveKit token; only if live + allowed (admitted if knock) |
| **ListWaitingAttendees** | Hosts; knock |

---

## Constraints & validations

1. Meeting belongs to one Meeting room.  
2. Conversation does not host LiveKit.  
3. No room read access ⇒ no media payloads.  
4. Start only if no other live meeting in room; starter must be host (unless system schedule).  
5. Join only when `live`; knock path requires Admit before credentials.  
6. End from `live` (host or empty grace).  
7. Heartbeat miss ⇒ leave (+ maybe empty end).  
8. Notify-conversation is opt-in; soft link only.

---

## Events / sync

`meeting.scheduled` · `meeting.live` · `meeting.ended` · `meeting.cancelled` · `attendee.joined` · `attendee.left` · `attendee.waiting` · `attendee.admitted` · `attendee.media` · `meeting.kick`

Socket.IO for denser lifecycle; LiveKit client for media.

---

## Realtime / media architecture

```text
Client
  ├── Socket.IO — start/end, attendees, knock, workspace “live now”
  └── livekit-client — A/V, screen, active speaker, pin/layout UI

Denser API
  ├── Meeting application — rooms, ACL, hosts, jobs
  └── Mint LiveKit access tokens

Infra
  ├── LiveKit server (self-host on AWS-class hosts; Redis if scaled)
  ├── Optional LiveKit Agents / Egress (notes, recording) — still self-host
  └── Denser app/API may run on Cloudflare and/or AWS
```

**v1 policy:** self-host LiveKit only (no LiveKit Cloud as the product default). Media plane is not expected to run on Cloudflare Workers.

---

## Phasing

| Phase | Ship |
| --- | --- |
| **M0** | Room CRUD + settings; Start/End; lobby panel chrome without media |
| **M1** | LiveKit; open + knock; layouts; notify card; heartbeats; live banners |
| **M2** | Schedule + reminders |
| **M3** | Recording + richer notes/transcription agents |

---

## Out of scope (initial)

- Always-on session mode (no Start)  
- PeerJS / mesh  
- LiveKit Cloud as required dependency  
- Live calls inside Conversation as the place model  
- Global sidebar mic/cam strip  

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-04 | Cross-link SCHEDULING.md / ATTACHMENTS.md for jobs and recordings. |
| 2026-09-04 | Grill locks: LiveKit self-host, Start/End only, open\|knock, lobby popover, Meet grid + speaker + pin, end policy, opt-in notify. |
| 2026-09-04 | Full Meetings domain doc (epicstory/epicstory2 lessons + denser room/instance + SFU). |
