# Document Types and Notion-Style Custom Properties

Documents have a space-scoped Document Type that serves as their schema. Document instances are constrained to strictly follow the custom property definitions declared on their Document Type.

## Context

Denser unifies all content under a single `document` artifact kind (Issue, Spec, Doc, etc.). Rather than creating rigid, hardcoded database models for every content variety, behavior and metadata are driven by composable properties defined on a `DocumentType`.

Users need the flexibility to define metadata (status, priority, assignees, estimates, tags, and relations) and manage this schema directly in-context from the document view without navigating away to admin settings.

## Decision

1. **Schema Definition on DocumentType**:
   - Each `DocumentType` contains an ordered list of `PropertyDefinition` items (`key`, `name`, `type`, `options`, `relationSpaceId`, `allowMultiple`, `required`).
   - Supported property types include `text`, `number`, `select`, `multi_select`, `date`, `person`, `relation`, `workflow`, and `prefix`.

2. **Schema Invariant & Strict Validation**:
   - Document instances must conform to their `DocumentType` schema.
   - The API enforces that `document.properties` (`fields`) cannot contain keys that are not defined in the associated `DocumentType`.

3. **Space-Scoped Notion-Style Relations**:
   - The `relation` property type links documents across spaces by binding to a specific target `relationSpaceId`.
   - The `person` property type links space or workspace members (e.g. assignee, reviewer).

4. **In-Context Schema Evolution**:
   - Adding, editing, renaming, or removing properties in a document's top property panel updates the underlying `DocumentType` schema in place.

## Consequences

- The database stores custom property values in `document.fields` (`jsonb`), validated against the document type schema at the service/API layer.
- Board cards, backlog rows, and document headers dynamically render property widgets based on the property definitions.
- Relations allow structured cross-space tracking (e.g., tasks in a sprint space linking to epics in a project space).
