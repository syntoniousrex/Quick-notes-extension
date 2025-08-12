# AGENTS.md

This file outlines the core agents (components/scripts) responsible for the behavior and structure of this Chrome extension.

---

## Overview

This Chrome extension provides a minimalist, customizable note-taking interface with persistent storage, keyboard shortcuts, and a modern grid-based design. The application is composed of the following main agents:

---

## background.js

- **Role**: Core logic and data management  
- **Responsibilities**:
  - Handles creation, deletion, editing, and movement of notes
  - Syncs note data with `chrome.storage.local`
  - Initializes the extension popup and loads saved notes
  - Contains utility functions for generating unique IDs, throttling storage writes, and managing UI state

---

## popup.html

- **Role**: Frontend markup  
- **Responsibilities**:
  - Renders the extension UI in the popup window
  - Hosts search bar, icons, and note container (`.mainBox`)
  - Provides semantic structure for injecting dynamic content via JavaScript

---

## index.css

- **Role**: Styling and layout  
- **Responsibilities**:
  - Defines modern, responsive styles for the note grid layout
  - Implements radial dot background grid
  - Styles individual notes, hover states, icons, and search bar
  - Controls spacing, shadows, animations, and overall visual design

---

## manifest.json

- **Role**: Extension configuration  
- **Responsibilities**:
  - Declares the extension’s metadata, permissions, and resources
  - Connects scripts and styles to the popup
  - Enables access to `chrome.storage`, permissions, and popup behavior

---

## Future Considerations

- Add resizing support for notes using grid alignment
- Investigate animation or transition agents for enhanced interactivity
- Consider bundling assets and using a build system if scale increases

---

Last updated: July 23, 2025
