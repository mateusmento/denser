# Denser Product Ontology

Denser is built around a small set of fundamental concepts. Rather than thinking in terms of features or applications, it distinguishes between **what exists**, **what it can do**, **how users interact with it**, and **how it is presented**.

These classifications provide a shared vocabulary for designing new capabilities while keeping the product coherent.

> **v1 filing direction:** For spaces, artifacts, conversations (regular/direct), tabs, and DMs, prefer [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md). Conversation is an **Artifact kind** in v1.

---

# Objects

Objects are the fundamental entities of the system.

An Object has:

- identity
- structured data
- lifecycle
- history
- permissions
- capabilities

Objects answer:

> **What exists in the workspace?**

Examples include:

- Document
- Channel
- Map
- Event
- Project
- Workflow
- User

Objects are the source of truth for the workspace.

---

# Properties

Properties describe the state and metadata of an Object.

Properties answer:

> **What information describes this object?**

Examples include:

- Title
- Status
- Assignee
- Due Date
- Labels
- Priority
- Owner
- Parent
- Created At
- Updated At

Properties are part of an Object's source of truth. They are structured data that can be searched, filtered, sorted, validated, and visualized across different Views.

For example:

- A **Board** visualizes the **Status** property.
- A **Calendar** visualizes **Due Dates** and **Events**.
- A **Timeline** visualizes **Start** and **End Dates**.
- A **Tree** visualizes the **Parent** property.
- A **Relationship Graph** visualizes **Relationships**.

Properties should remain simple and composable. Rather than introducing new object types for every use case, Denser should prefer enriching existing Objects with meaningful Properties whenever they express state without introducing new behavior.

---

# Capabilities

Capabilities define the behaviors available on an object.

They do not exist independently; they enrich objects.

Capabilities answer:

> **What can this object do?**

Examples include:

- Rich Text
- Conversation
- Workflow
- Attachments
- Relationships
- Presence
- AI

A Document may support Rich Text, Conversation, Workflow, and Relationships.

A Channel may support Conversation and Presence.

Capabilities should be composable. Instead of introducing entirely new object types, Denser prefers enriching existing objects with additional capabilities whenever it reduces complexity.

---

## Properties vs Capabilities

Properties and Capabilities complement one another.

A Property describes an Object.

A Capability defines what an Object can do.

For example, an Issue-like Document may have:

**Properties**

- Status
- Assignee
- Priority
- Due Date

**Capabilities**

- Rich Text
- Conversation
- Workflow
- Relationships

Changing a Property changes the state of an Object.

Adding a Capability expands what an Object is capable of doing.

This distinction allows Objects to remain small, composable, and adaptable while avoiding unnecessary specialization.

---

# Views

Views are visualization and interaction models over one or more objects.

Views answer:

> **How do I see and manipulate information?**

Views do not define new domain concepts. Instead, they expose existing structured information in ways that are optimized for different tasks.

Examples include:

- List
- Tree
- Structured Map
- Board
- Timeline
- Calendar
- Relationship Graph

A Board visualizes and edits Workflow.

A Calendar visualizes and edits Events or date-based properties.

A Structured Map visualizes and edits hierarchical structures such as Documents and Folders.

The same underlying data may be presented through many different Views without creating duplicate information.

---

# Modes of Interaction

Modes of Interaction describe the user's intent while working with information.

Unlike Views, which describe presentation, Modes describe the kind of work being performed.

## Authoring

Authoring is the creation or modification of structured information.

It produces or changes the source of truth.

Examples:

- Writing a document
- Editing properties
- Adding comments
- Creating Mermaid diagrams
- Uploading attachments

---

## Visualization

Visualization helps users understand existing structured information.

It reveals information without changing its meaning.

Examples:

- Reading a document
- Viewing a Calendar
- Exploring a Relationship Graph
- Navigating a Tree
- Browsing a Board

Many visualization modes also support direct editing without changing their fundamental purpose.

---

## Modeling

Modeling helps users explore ideas before they become fully structured.

Unlike Authoring, Modeling is intentionally exploratory.

Examples:

- Free-form Maps
- Brainstorming
- AI clustering

Modeling creates understanding before creating structure.

Ideas generated during Modeling may later become Documents, Relationships, Events, or other Objects.

---

# Object Categories

Objects themselves can be grouped into broader conceptual categories.

These categories are useful for reasoning about the product but are not necessarily exposed directly to users.

## Artifacts

Artifacts are Objects that capture work or knowledge.

They are intentionally created by users and evolve over time.

Artifacts:

- accumulate context
- preserve history
- become richer
- evolve instead of being recreated

Examples:

- Document
- Map

Artifacts embody one of Denser's central principles:

> **Work should evolve, not be recreated.**

---

## Spaces

Spaces organize collaboration.

Rather than containing work, they contain people, conversations, and shared context.

Examples:

- Channel
- Project
- Workspace

---

## Processes

Processes organize execution.

They define how work progresses through time.

Examples:

- Workflow
- Sprint
- Milestone

---

## Relationships

Relationships connect Objects.

Rather than containing information themselves, they describe how information fits together.

Examples:

- references
- blocks
- belongs to
- duplicates
- parent/child

Relationships enable visualizations such as Relationship Graphs while preserving a single source of truth.

---

# The Overall Model

```text
Object
├── Artifact
│     ├── Document
│     └── Map
│
├── Space
│     ├── Channel
│     ├── Project
│     └── Workspace
│
├── Process
│     ├── Workflow
│     ├── Sprint
│     └── Milestone
│
├── Relationship
│
├── Event
│
└── User
```

Objects are enriched by **Capabilities**, experienced through **Views**, and manipulated through different **Modes of Interaction**.

---

# Design Philosophy

These classifications reinforce one another instead of competing.

- **Objects** answer: **What exists?**
- **Capabilities** answer: **What behaviors does it support?**
- **Views** answer: **How is it visualized and manipulated?**
- **Modes of Interaction** answer: **What is the user trying to accomplish?**

Together, they support Denser's broader philosophy:

- **Information has one source of truth.**
- **Work should evolve, not be recreated.**
- **Every capability should reduce complexity somewhere else.**
- **Every context deserves its own interface.**

This framework gives Denser a stable conceptual foundation. New features shouldn't require inventing new concepts; they should fit naturally into one of these dimensions. That's what keeps the product cohesive as it grows.
