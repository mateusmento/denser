# Notion Custom Properties: Specification & Denser Architectural Comparison

This document provides a comprehensive analysis and specification of **Notion's Custom Properties system**, detailing its data model, UI/UX interaction mechanics, property type taxonomy, schema evolution rules, and relations. It serves as the primary ground-truth benchmark to compare against Denser's domain architecture and current implementation.

---

## 1. Executive Summary & Conceptual Mapping

In Notion, pages within a database are structured documents consisting of:
1. **Header Metadata**: Page icon, cover photo, page title, and a structured table of **Properties**.
2. **Page Content**: A vertical block-tree document body (rich text, callouts, toggles, images, child pages).
3. **Database Schema**: A centralized property definition list owned by the parent Database. Every page in that database shares the identical property schema.

In Denser, content is unified under the **Single Document Model** (`Artifact` with `kind = document`), where document behavior and metadata are driven by a space-scoped **`DocumentType`** rather than rigid entity tables.

### Conceptual Alignment Matrix

| Concept | Notion Model | Denser Model | Architectural Relationship |
| :--- | :--- | :--- | :--- |
| **Container / Schema Owner** | `Database` (or inline database page) | `Space` + `DocumentType` | In Notion, the Database defines the schema. In Denser, a `Space` owns one or more `DocumentType` definitions (e.g. Issue, Spec, Doc), allowing a single space to host multiple document varieties. |
| **Document Instance** | `Page / Row` | `Artifact` (shell) + `Document` (body + fields) | In both systems, every page/document has an intrinsic Title and Body plus custom property values. |
| **Page Title** | Special `title` property (required) | `Artifact.title` | Fixed primary identifier. Both treat title as a core property distinct from generic text fields. |
| **Page Body** | Block tree (`jsonb` / block list) | TipTap Rich Text Document (`jsonb`) | Freeform rich-text document content below properties. |
| **Properties Schema** | Database `properties` map (schema) | `DocumentType.properties` (`PropertyDefinition[]`) | Ordered definitions specifying key, name, type, and type-specific configuration (options, relations). |
| **Property Values Bag** | Page `properties` map | `Document.fields` (`jsonb`) / `DocumentView.properties` | Dynamic JSON value map keyed by property key/id, validated against the schema. |
| **Workflow / Status** | `status` property with grouped stages (To Do, In Progress, Done) | `Workflow` + `WorkflowStage` (`stageId`, `stageKind`) | In Notion, status is just a property type. In Denser, Workflow is a first-class state engine powering Kanban board columns, Backlog sections, and Sprint clocks. |
| **Relation Property** | Database Relation (links to pages in target Database) | Space Relation (`relationSpaceId` targeting documents in a Space) | In Notion, relations target a Database. In Denser, relations target a `Space`, enabling cross-project linking (e.g., Sprint issue -> Project epic). |
| **Person Property** | Workspace User reference(s) | Space / Workspace Member reference (`person` type) | Selects users from the space roster or workspace members. |
| **Prefix / Human ID** | `unique_id` property (e.g. `PROJ-123`) | `spaceKey-{n}` prefix on DocumentType | Project-scoped human identifier. |

---

## 2. Notion Property Types Taxonomy

Notion categorizes properties into **Standard (Basic)**, **Advanced (Entity / Relational)**, and **System (Audit)** properties.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NOTION PROPERTY TAXONOMY                           │
├─────────────────────────┬──────────────────────────┬────────────────────────┤
│   Standard / Primitives │    Advanced / Relations  │   System / Automated   │
├─────────────────────────┼──────────────────────────┼────────────────────────┤
│ • Title (Primary text)  │ • Relation (Cross-DB)    │ • Created Time         │
│ • Text (Rich text)      │ • Rollup (Aggregate)     │ • Created By           │
│ • Number (Int/Float)    │ • Person (Member link)   │ • Last Edited Time     │
│ • Select (Single tag)   │ • Status (State machine) │ • Last Edited By       │
│ • Multi-Select (Tags)   │ • Formula (Expressions)  │ • Unique ID (Prefix)   │
│ • Date (Timestamp/Range)│ • Files & Media (Upload) │ • Button (Automation)  │
│ • Checkbox (Boolean)    │ • URL / Email / Phone    │                        │
└─────────────────────────┴──────────────────────────┴────────────────────────┘
```

### Detailed Type Specifications

#### A. Select & Multi-Select
- **Schema Config**:
  - `options`: Array of `{ id, name, color }`.
  - Available color palette: Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red.
- **Value**:
  - `select`: Single option name or option ID.
  - `multi_select`: Array of option names/IDs.
- **Interactions**:
  - Filterable search inside dropdown.
  - Inline option creation by typing a new name and pressing `Enter`.
  - Color picker per option in the dropdown edit submenu.

#### B. Person (Assignee / User)
- **Schema Config**:
  - `allowMultiple`: Boolean (single user vs multi-assignee).
- **Value**:
  - User ID or array of User IDs.
- **Interactions**:
  - Type-ahead search against space/workspace members.
  - Avatar initials badge + display name.
  - "Unassigned" quick clear.

#### C. Relation
- **Schema Config**:
  - `relationDatabaseId` (in Denser: `relationSpaceId`): Target container.
  - `twoWay`: Boolean (whether to create a mirrored relation property in the target database).
  - `allowMultiple`: Boolean (limit to 1 page or allow multiple).
- **Value**:
  - Array of Target Page/Document IDs.
- **Interactions**:
  - Search modal showing target documents with icon, title, and preview.
  - Chips linking to the linked document with peek/full-open on click.

#### D. Number
- **Schema Config**:
  - Format: `number`, `currency` ($ / € / £ / etc.), `percent`, `points`.
  - Display mode: Plain text, progress bar, or progress ring (configured with min/max).
- **Value**:
  - IEEE 754 Float or Integer.

#### E. Date
- **Schema Config**:
  - Date format (Full date, relative, ISO).
  - Time format (12-hour, 24-hour).
- **Value**:
  - ISO-8601 string or object `{ start: string, end?: string, time_zone?: string }`.
- **Interactions**:
  - Inline mini-calendar popup.
  - Toggle for "End date" (range selection) and "Include time".

#### F. Status / Workflow
- **Schema Config**:
  - Groups: `To Do` (idle), `In Progress` (active), `Complete` (settled).
  - Sub-statuses within each group with custom names and colors.
- **Value**:
  - Status option name/ID.

---

## 3. Notion UI & UX Interaction Model

The visual and ergonomic hallmark of Notion's property system is its **borderless, unobtrusive, in-context design**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Page Title                                                                  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔤 Property Name   │ Value Widget / Text Input / Dropdown / Badge       │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ 🎯 Priority        │ 🔴 Urgent ▾                                        │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ 👤 Assignee        │ 👤 Mateus ▾                                        │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ 🏷️ Labels          │ [ Frontend × ] [ Design × ] [+ Add]                │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ 🔢 Estimate        │ 5 pts                                              │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ 🔗 Related Epic    │ 🔗 Design System v2                                │ │
│ ├────────────────────┼────────────────────────────────────────────────────┤ │
│ │ ➕ Add a property   │                                                    │ │
│ └────────────────────┴────────────────────────────────────────────────────┘ │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Page Content starts here...                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key UI Rules in Notion

1. **Two-Column Borderless Grid**:
   - Left column (width: ~160px-200px): Property icon + property name button.
   - Right column (flexible width): Interactive value widget.
   - Rows have minimal padding (`py-1` / `min-h-8`) and no heavy cell borders.
2. **Hover-Activated Context Menus**:
   - Hovering over the property label highlights the button (`bg-muted/70`).
   - Clicking the label opens a schema context menu:
     - **Edit property**: Opens options editor, color picker, or relation settings.
     - **Rename**: Inline or modal text editing.
     - **Duplicate**: Clones the property with all options.
     - **Delete property**: Removes property and deletes data across all pages.
     - **Hide in view**: Toggles visibility in full page view.
3. **In-Context Schema Evolution**:
   - Users never leave the page to configure schemas in an administrative settings panel.
   - Clicking `+ Add a property` at the bottom of the table reveals the Property Type Picker. Selecting a type creates the property on the database schema immediately.
4. **Empty State Formatting**:
   - Empty values render as muted placeholders (`Empty`, `Unassigned`, `—`) that turn into active editors on click.
   - Values with tags render as compact colored pills with hover dismiss buttons (`×`).

---

## 4. Denser vs. Notion: Detailed Comparison & Gap Analysis

### A. Data Layer & Schema Storage

| Feature | Notion Implementation | Denser Implementation | Status / Notes |
| :--- | :--- | :--- | :--- |
| **Schema Storage** | Stored in `collection.schema` (object map of property definitions) | Stored in `document_type.properties` (`jsonb` array of `PropertyDefinition`) | **Aligned**. Both store property schemas as JSON configurations associated with the container/type. |
| **Value Storage** | Stored in `block.properties[property_id]` | Stored in `document.fields` (`jsonb`), exposed as `document.properties` | **Aligned**. Clean decoupling between core entity columns (`title`, `rank`, `stageId`) and dynamic property bags. |
| **Schema Validation** | Strict: values must conform to property types defined in schema | Strict: API filters and validates property keys against `DocumentType.properties` | **Aligned**. Verified in `createDocument` and `patchDocument` service layers. |
| **Property IDs vs Keys** | Uses randomized property IDs (`prop_xyz`) | Uses UUID `PropertyDefinitionId` with human-readable `key` slug (`priority`, `labels`) | **Denser Advantage**. Denser uses stable semantic keys (`key: "priority"`) for deterministic querying and code references. |

### B. Property Types Implementation

| Property Type | Notion Support | Denser Support | Current Denser Implementation Details |
| :--- | :---: | :---: | :--- |
| **Text** | Yes | Yes | Supported via `PropertyType = "text"`. Rendered as transparent inline input. |
| **Number** | Yes | Yes | Supported via `PropertyType = "number"`. Monospaced numeral input with points/estimate display. |
| **Select** | Yes | Yes | Supported via `PropertyType = "select"`. Color dot dropdown with checkmark selection. |
| **Multi-Select** | Yes | Yes | Supported via `PropertyType = "multi_select"`. Badge chips with remove buttons and tag creation popover. |
| **Person** | Yes | Yes | Supported via `PropertyType = "person"`. Dropdown integrated with Space Members roster (`members`). |
| **Date** | Yes | Yes | Defined in contracts & UI type menu (`date`). |
| **Relation** | Yes | Yes | Defined in contracts (`relationSpaceId`, `allowMultiple`) and API schema. |
| **Workflow / Status** | Yes (property) | Yes (first-class) | First-class `Workflow` entity (`WorkflowStage`) driving Board & Backlog views. |
| **Prefix ID** | Yes | Yes | Builtin Project space prefixing (`{spaceKey}-{n}`). |
| **Rollup / Formula** | Yes | Planned | Future extension on top of relation properties. |

### C. UI & Interactions

| UI Capability | Notion | Denser | Denser Implementation Location |
| :--- | :---: | :---: | :--- |
| **Two-column borderless layout** | Yes | Yes | `PropertyList.vue`, `PropertyRow.vue`, `DocumentPropertiesPanel.vue` |
| **Property icons per type** | Yes | Yes | `PropertyTypeIcon.vue` with Lucide icon mappings |
| **Schema action dropdown (label hover)** | Yes | Yes | `PropertyRow.vue` (Edit, Rename, Duplicate, Delete) |
| **In-place Property Renaming** | Yes | Yes | `renameProperty` dialog wired to `PATCH /api/document-types/:id` |
| **In-place Property Addition** | Yes | Yes | `PropertyTypeMenu.vue` + `addProperty` dialog |
| **In-place Option Editing & Colors** | Yes | Yes | `editProperty` options manager dialog with palette assignment |
| **In-place Property Duplication** | Yes | Yes | `duplicateDocumentTypeProperty` in `useDocumentSync.ts` |
| **In-place Property Deletion** | Yes | Yes | `deleteDocumentTypeProperty` in `useDocumentSync.ts` |
| **Board / Backlog Card Rendering** | Yes | Yes | `IssueCard.vue` dynamically displays Type, Priority, Tags, Estimate, Assignee |

---

## 5. End-to-End Execution Flow: Schema Evolution in Denser

When a user modifies a property on a document in Denser, the execution follows this lifecycle:

```
[ User Action: "+ Add a property" or "Rename" in DocumentPropertiesPanel ]
                               │
                               ▼
[ DocumentPropertiesPanel emits 'addProperty' / 'renameProperty' ]
                               │
                               ▼
[ DocumentContainer dispatches to useDocumentSync composable ]
                               │
                               ▼
[ patchDocTypeMutation calls apiClient.patchDocumentType(documentTypeId, input) ]
                               │
                               ▼
[ API PATCH /api/document-types/:id -> updates document_type.properties in PostgreSQL ]
                               │
                               ▼
[ TanStack Query invalidates queryKeys.space(spaceId) ]
                               │
                               ▼
[ Live reactivity updates DocumentPropertiesPanel, Board cards, and Backlog rows ]
```

---

## 6. Parity Checkpoints & Next Enhancement Areas

To achieve complete parity with Notion's relational capabilities:

1. **Two-Way Sync Relations**:
   - When a `relation` property is created linking Space A to Space B, optionally generate a corresponding back-link property in Space B's document type.
2. **Space Document Selector Widget**:
   - Implement a popover document search widget for `relation` properties querying `apiClient.getSpace(relationSpaceId)` artifacts.
3. **Date Range & Time Picker Component**:
   - Expand the `date` property widget to support start/end ranges using Denser's `RangeCalendar` design-system primitive.
4. **Card Property Display Settings**:
   - Add a view configuration menu to Board and Backlog surfaces allowing users to choose which properties are visible on cards (e.g. toggle Priority, Estimate, or Assignee on/off).

---

## 7. Summary

Denser's custom property architecture faithfully reproduces Notion's ergonomic strengths:
- **Zero-friction in-context schema editing** right above the document body.
- **Strict schema validation** preventing invalid or orphaned field states.
- **Cross-space relational linking** modeled after Notion database relations.
- **Seamless integration** with Denser's unique first-class Workflow and Sprint engines.
