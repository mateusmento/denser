# Space Allowed Artifact and Document Types

Spaces can configure which artifact kinds and document types are permitted to be created within them, enabling dedicated spaces (e.g. Issues-only, Discussions-only, or Specs repositories).

## Context

Different spaces in Denser serve different team workflows:
- A Sprint or Scrum space is often dedicated exclusively to trackable `Issue` documents with boards and backlogs.
- A Product Specs space is dedicated to `Spec` documents with approval workflows.
- A Team Channel space is dedicated to `conversation` artifacts.

Users need the ability to constrain and curate what can be created in a space, streamlining the creation UI and enforcing project hygiene.

## Decision

1. **Space Type Configuration**:
   - `Space` includes configuration for `allowedArtifactKinds` (`"document" | "conversation"`) and `allowedDocumentTypeIds` (`string[] | null`, where null allows all).
   - `Space` includes a `defaultDocumentTypeId` to determine the default template when adding a document in the space.

2. **Creation Menu & Action Streamlining**:
   - Creation menus (such as the header `+` dropdown, space tab bar, and quick create actions) adapt to the space's allowed types.
   - If a space permits only one document type (e.g. `Issue`), clicking "New document" directly creates that type without requiring a type selection dialog.

## Consequences

- Space presets (e.g. `scrum`, `project`, `folder`) configure sensible defaults for allowed types out of the box.
- Users can customize space type restrictions in space settings.
