# Denser Product Model

Rather than being composed of separate applications, Denser is composed of a small number of fundamental concepts. Every feature belongs to one or more of these concepts, creating a consistent mental model across the entire product.

This document describes Denser from the perspective of its ontology.

---

# Objects

Objects are the fundamental entities of the workspace.

An Object has identity, structured data, lifecycle, history, permissions, and capabilities. Objects are the source of truth from which all Views derive.

## Artifacts

Artifacts capture work and knowledge. They are intentionally created by users and evolve throughout their lifecycle.

### Document

The Document is Denser's primary artifact.

Documents represent pieces of work or knowledge that accumulate context over time. Rather than forcing users to create different object types as work evolves, Documents acquire additional capabilities and properties.

A Document may represent:

* Notes
* Specifications
* Documentation
* Tasks
* Issues
* Decisions
* Meeting notes
* Research
* Proposals

Documents evolve by acquiring structure rather than being recreated.

---

### Map

A Map is a spatial artifact used to organize ideas and information.

Maps support two distinct modes:

* **Structured Mode**, where the Map visualizes and edits existing workspace objects.
* **Free-form Mode**, where the Map owns its own exploratory content for brainstorming and modeling.

Maps can later reference or embed workspace objects while remaining artifacts in their own right.

---

## Spaces

Spaces organize collaboration.

### Channel

Channels organize conversations between people.

Channels provide persistent communication through conversations, reactions, mentions, threads, and presence.

Unlike Artifacts, Channels organize collaboration rather than work itself.

---

### Project

Projects organize work around a shared objective.

Projects provide shared context for Documents, Workflows, Channels, Events, and members.

Projects coordinate work without becoming the work itself.

---

### Workspace

The Workspace is the highest organizational boundary within Denser.

It defines membership, permissions, settings, and the shared environment in which all other objects exist.

---

## Processes

Processes organize execution.

### Workflow

Workflows define how work progresses.

They consist of stages, transitions, automation rules, and policies that govern the lifecycle of participating artifacts.

---

### Sprint

Sprints organize work into fixed periods of execution.

---

### Milestone

Milestones represent significant checkpoints within longer initiatives.

---

## Time

### Event

Events represent moments or intervals in time.

They power scheduling, planning, and calendar-based workflows.

---

## Identity

### User

Users represent people participating in the workspace.

Users contribute work, participate in conversations, own artifacts, and collaborate through Spaces.

---

## Connections

### Relationship

Relationships connect Objects.

They express semantic meaning rather than hierarchy.

Examples include:

* references
* blocks
* duplicates
* belongs to
* parent
* child

Relationships enable navigation, impact analysis, dependency tracking, and relationship visualizations while preserving a single source of truth.

---

# Properties

Properties describe the state of Objects.

They answer:

> What information describes this object?

Examples include:

* Title
* Status
* Assignee
* Owner
* Due Date
* Start Date
* Labels
* Priority
* Parent
* Created At
* Updated At

Properties are structured data that can be searched, filtered, sorted, grouped, and visualized.

Views frequently derive their presentation from Properties.

---

# Capabilities

Capabilities define behaviors that Objects support.

Rather than introducing new object types, Denser prefers composing Objects through reusable Capabilities.

Examples include:

## Rich Text

Structured editing for long-form content.

---

## Conversation

Comments, messages, threads, reactions, mentions, and discussions.

Conversation can appear across multiple Objects while maintaining a consistent interaction model.

---

## Workflow

Lifecycle management through stages and transitions.

---

## Attachments

Files and external resources associated with Objects.

---

## Relationships

The ability to create semantic connections between Objects.

---

## Presence

Awareness of collaborators through online status, typing indicators, cursors, and live collaboration.

---

## AI

Capabilities for writing, summarizing, organizing, reasoning, and automation.

---

# Views

Views provide specialized ways of visualizing and interacting with structured information.

Views never become the source of truth.

Instead, they expose existing Objects and their Properties in forms optimized for different tasks.

## List

Tabular presentation optimized for browsing, filtering, sorting, and bulk editing.

---

## Tree

Hierarchical presentation of parent-child structures such as Documents and Folders.

---

## Structured Map

Spatial visualization of hierarchical structures.

Unlike Free-form Maps, Structured Maps are Views over existing Objects.

Changes made through the View directly modify the underlying Objects.

---

## Board

Visualization of Workflow stages.

Moving an item across the Board changes its Workflow state.

---

## Calendar

Visualization of Events and date-based Properties.

Calendar interactions edit the underlying Objects rather than creating duplicate information.

---

## Timeline

Visualization of temporal relationships across Objects.

---

## Relationship Graph

Visualization of semantic Relationships between Objects.

Graphs reveal connectivity rather than hierarchy.

## Views ↔ required artifact properties

A View is enabled for an artifact type when that type (or instance) supplies the properties the View needs to place, group, and manipulate items. Identity is always present on every Object — it is not a view-specific requirement.

Views do not invent data. They project existing Properties (and Relationships where relevant). An artifact can appear in multiple Views as it acquires the matching properties over time.

| View | Required properties | What the view does with them | Notes / enriching (optional) |
| --- | --- | --- | --- |
| **List / Backlog** | Title | Browse, filter, sort, bulk-edit a flat set of artifacts | Status, Assignee, Priority, Labels, Due Date, Rank/Order (for backlog prioritization). “Issue key” is presentation of identity or a tracking property — not a separate ontology concept unless we define it as one. |
| **Tree** | Parent (hierarchy edge) | Nested navigation / containment | Title for labels; Rank/Order among siblings |
| **Board** | Status *or* Workflow stage | Columns = stages; drag moves stage/status | Title; Assignee, Priority, Due Date as card chrome. Board is a view over Workflow-capable artifacts. |
| **Calendar** | A date property: single date *or* interval (Start + End / Due) | Place artifacts (and Events) on days/weeks | Title; Event objects are first-class time intervals and always calendar-eligible |
| **Timeline** | Start and End (interval) | Horizontal bars / sequencing over time | Title; Dependencies via Relationships for critical-path style overlays |
| **Structured Map / Flow Map** | Node identity + Title; plus either **Parent** (structure) or **Relationships** (flow/edges) | Spatial layout of existing objects; edits write through to source | Free-form Map content is owned by the Map artifact (Modeling), not a View over foreign properties |
| **Relationship Graph** | Relationships (typed links) | Connectivity, not hierarchy | Title for node labels; filter by relationship type (blocks, references, …) |

### Enablement rule (draft)

> An artifact type (or a given artifact instance) **can participate in a View** iff it has all of that View’s required properties (and, for Board / Conversation-heavy surfaces, the related Capability where the product model requires it — e.g. Workflow for Board).

Property acquisition is how work evolves without recreating objects: a note gains Due Date → appears on Calendar; gains Status/Workflow → appears on Board; gains Parent → appears in Tree / Structured Map.

### Open questions

- Is **Backlog** a distinct View, or a **List** configured with Rank/Priority + filters?
- Is **Flow Map** the same as **Structured Map**, or a Relationship-driven layout (closer to Relationship Graph + spatial chrome)?
- Should **Event** stay under Artifacts (this draft) or under Time (PRODUCT-MODEL)? Calendar may mix Event objects and date-bearing Documents.
- Do we treat **Rank/Order** as a first-class Property for Backlog, or as view-local ordering?

---

# Modes of Interaction

Modes of Interaction describe what users are trying to accomplish.

Unlike Views, which describe presentation, Modes describe intent.

## Authoring

Creating or modifying structured information.

Examples include:

* Writing
* Editing
* Commenting
* Defining properties
* Creating relationships

Authoring contributes directly to the workspace's source of truth.

---

## Visualization

Understanding existing structured information.

Examples include:

* Reading
* Browsing
* Filtering
* Navigating
* Comparing

Visualization reveals information without changing its meaning.

---

## Modeling

Exploring ideas before they become fully structured.

Examples include:

* Free-form Maps
* Brainstorming
* Spatial organization
* Concept exploration

Modeling helps users discover structure before formalizing it into Objects and Relationships.

---

# How Everything Fits Together

Denser separates concerns into complementary dimensions.

* **Objects** define what exists.
* **Properties** describe the current state of those Objects.
* **Capabilities** define what those Objects can do.
* **Views** define how users visualize and manipulate them.
* **Modes of Interaction** describe the user's intent while working.

This separation allows Denser to remain conceptually small while supporting a wide range of workflows.

Instead of introducing a new object for every use case, Denser encourages Objects to evolve through additional Properties and Capabilities. Views reveal those Objects from different perspectives, while Modeling provides a bridge between unstructured thinking and structured work.

Together, these concepts create a workspace where information has a single source of truth, work evolves instead of being recreated, and every new capability strengthens the coherence of the system rather than increasing its complexity.
