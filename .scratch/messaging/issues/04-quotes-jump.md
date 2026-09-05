# 04 — Quote join-on-read + jump around

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-04-quotes-jump`  
**Spec:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) quote preview section, [conversation.md](../../../docs/ui-surfaces/conversation.md)

**What to build:** Messages that quote another message get a **join-on-read** `quoted` preview (size caps locked in docs). Clicking the quote card jumps the timeline via `around=quotedId`. UI uses `max-h-40` + gradient.

**Owns:** quote preview builder; list/get enrichment; quote card interaction → around fetch; RichTextPreview wiring for quotes.

**Must not touch:** core PostMessage path ownership (coordinate with 03 — prefer pure preview helper module 03 calls); attachments; scheduler.

**Consumes:** QuotedPreviewDto from 01; ListMessages `around` from 03 if merged, otherwise implement around in this PR if 03 only did next/prev (prefer 03 owns around; this ticket owns preview DTO fill + UI).

- [ ] Server builds QuotedPreview: strip images; ≤1000 text chars + 8KiB JSON; displayContent ≤160
- [ ] List/get includes `quoted` when quotes_id set; missing target → omit chrome
- [ ] Quote click recenters via around; around-focus owns scroll until return to live edge
- [ ] Timeline quote card `max-h-40` + gradient on overflow
- [ ] Tests for cap / strip images
- [ ] PR `[messaging 04] …`

## Comments

If 03 has not merged, land preview builder + unit tests first; UI can feature-flag until list API exists. Prefer merge order 03 then 04 if conflicts on list handler.
