/**************************************
* GLOBAL STATE
**************************************/

// Notes data array
let array = [];

// Formatting flags (not currently used, but preserved for future)

/**************************************
* CONSTANTS
**************************************/

const placeholders = [
    "What's on your mind?",
    "Start typing...",
    "Don't forget milk and eggs!",
    "World domination plans...",
    "What was I gonna write?",
    "Write it before you forget it!",
    "Meeting notes... or something like that.",
    "Therapist said write it down.",
    "Capture the moment before it fades.",
    "Worst idea wins, go.",
    "Type. Don't think."
];

function getRandomPlaceholder() {
    return placeholders[Math.floor(Math.random() * placeholders.length)];
}

/**************************************
* DOM REFERENCES
**************************************/

const body = document.body;
const mainBox = document.getElementById("mainBox");
const settings = document.getElementById("settings");
const close_settings = document.getElementById("close_settings");
const settings_menu = document.getElementById("settings_menu");
const newNoteButton = document.getElementById("newNote");
const clearCacheButton = document.getElementById("clear-cache");
const exportButton = document.getElementById("export-notes");
const lightModeToggle = document.getElementById("light-mode-toggle");
const searchInput = document.getElementById("search-input");

if (lightModeToggle) {
    getStorage("lightMode", (value) => {
        if (value) {
            body.classList.add("light-mode");
            lightModeToggle.checked = true;
        }
    });

    lightModeToggle.addEventListener("change", () => {
        const enabled = lightModeToggle.checked;
        body.classList.toggle("light-mode", enabled);
        setStorage("lightMode", enabled);
    });
}

/*************************************
* NOTE CONSTRUCTORS
*************************************/

function createNoteElement(noteObj) {
    const template = document.getElementById("note-template");
    const clone = template.content.firstElementChild.cloneNode(true);

    const titleInput = clone.querySelector(".note-title");
    const bodyInput = clone.querySelector(".noteContents");

    titleInput.value = noteObj.title || "";
    bodyInput.innerHTML = noteObj.body || "";

    if (!noteObj.body) {
        bodyInput.setAttribute("data-placeholder", getRandomPlaceholder());
    }

    clone.noteObj = noteObj;
    mainBox.appendChild(clone);

    return clone;
}

function bindNoteEvents(clone, noteObj) {
    const titleInput = clone.querySelector(".note-title");
    const bodyInput = clone.querySelector(".noteContents");
    const wordCount = clone.querySelector(".word-count");
    let hiliteTypingOn = false;
    let selectionRange = null;

    const saveNote = debounce(() => {
        noteObj.title = titleInput.value;
        noteObj.body = bodyInput.innerHTML;
        setStorage("Table", JSON.stringify(array));
        clone.classList.add("saved");
        setTimeout(() => clone.classList.remove("saved"), 1000);
    }, 500);

    titleInput.addEventListener("input", saveNote);
    bodyInput.addEventListener("input", saveNote);

    clone.querySelector(".fa-trash-can").onclick = function () {
        clone.classList.add("fade-out");
        setTimeout(() => {
            const index = array.indexOf(noteObj);
            if (index !== -1) array.splice(index, 1);
            setStorage("Table", JSON.stringify(array));
            clone.remove();
        }, 200);
    };

    const styleButtons = clone.querySelectorAll(".style-actions .action");
    
    function saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) {
            selectionRange = sel.getRangeAt(0).cloneRange();
        }
    }

    function getMarkAncestor(node) {
        while (node && node !== bodyInput) {
            if (node.nodeType === 1 && node.tagName === "MARK") return node;
            node = node.parentNode;
        }
        return null;
    }

    function wrapRangeInMark(range) {
        const frag = range.cloneContents();
        const mark = document.createElement("mark");
        mark.appendChild(frag);
        range.deleteContents();
        range.insertNode(mark);

        // put caret at end of new mark for a natural feel
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(mark);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        return mark;
    }

    function unwrapMark(el) {
        if (!el || el.tagName !== "MARK" || !el.parentNode) return;
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
    }

    function getMarkAtCaret(range) {
        // 1) If caret is inside a <mark>, return it
        const inMark = getMarkAncestor(range.startContainer);
        if (inMark) return inMark;

        // 2) If caret is at a text boundary next to a <mark>, grab that neighbor
        let container = range.startContainer;
        let offset = range.startOffset;

        // Normalize to an element and index
        if (container.nodeType === 3) { // Text node
            const parent = container.parentNode;
            if (!parent) return null;

            // Caret at start of text and previous sibling is <mark>
            if (offset === 0 && parent.previousSibling && parent.previousSibling.nodeType === 1 && parent.previousSibling.tagName === "MARK") {
            return parent.previousSibling;
            }
            // Caret at end of text and next sibling is <mark>
            if (offset === container.nodeValue.length && parent.nextSibling && parent.nextSibling.nodeType === 1 && parent.nextSibling.tagName === "MARK") {
            return parent.nextSibling;
            }
            // Also check parent itself if it is a <mark>
            if (parent.nodeType === 1 && parent.tagName === "MARK") return parent;
            return null;
        } else if (container.nodeType === 1) { // Element node
            // If caret is between child nodes, see the neighbor on either side
            const el = container;
            const childBefore = el.childNodes[offset - 1] || null;
            const childAfter  = el.childNodes[offset] || null;

            if (childBefore && childBefore.nodeType === 1 && childBefore.tagName === "MARK") return childBefore;
            if (childAfter  && childAfter.nodeType === 1 && childAfter.tagName === "MARK") return childAfter;

            // If the element itself is a mark
            if (el.tagName === "MARK") return el;
            return null;
        }
        return null;
    }

    function splitMarkAtCaret(range, markEl) {
        // If the caret isn't actually inside this mark, bail
        if (!markEl || markEl.tagName !== "MARK") return;

        const sel = window.getSelection();

        // Create a range for the LEFT part (mark start -> caret)
        const left = document.createRange();
        left.selectNodeContents(markEl);
        // Only split if the caret is within the mark's subtree
        if (!markEl.contains(range.startContainer)) {
            // Caret not inside the mark—nothing to split
            return;
        }
        left.setEnd(range.startContainer, range.startOffset);

        // Extract LEFT fragment out of the original mark
        const leftFrag = left.extractContents();

        // Build a new <mark> for the LEFT fragment and insert it before the original mark
        const leftMark = document.createElement("mark");
        leftMark.appendChild(leftFrag);
        markEl.parentNode.insertBefore(leftMark, markEl);

        // The original mark now contains only the RIGHT part (caret -> end).
        // We want the RIGHT part to be plain text → unwrap the original mark.
        // Unwrap: move its children out, then remove it.
        while (markEl.firstChild) {
            markEl.parentNode.insertBefore(markEl.firstChild, markEl);
        }
        markEl.remove();

        // Place the caret just after the preserved LEFT mark
        const after = document.createTextNode("\u200B");
        leftMark.parentNode.insertBefore(after, leftMark.nextSibling);
        const r = document.createRange();
        r.setStart(after, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);

        // Clean the zero-width after the next input
        const cleanup = () => {
            if (after.parentNode) after.remove();
            bodyInput.removeEventListener("input", cleanup);
        };
        bodyInput.addEventListener("input", cleanup);
    }

    styleButtons.forEach((btn) => {
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();

            const sel = window.getSelection();

            // keep the editor focused so selection/caret lives in .noteContents
            bodyInput.focus();

            // if the current selection isn't inside this editor but you have a last real range, restore it
            const insideEditor = sel.rangeCount && bodyInput.contains(sel.anchorNode);
            if (!insideEditor && selectionRange) {
                sel.removeAllRanges();
                sel.addRange(selectionRange);
            }
            // if there's no valid selection in the editor, create a caret at the end
            if (!sel.rangeCount || !bodyInput.contains(sel.anchorNode)) {
                const r = document.createRange();
                r.selectNodeContents(bodyInput);
                r.collapse(false);
                sel.removeAllRanges();
                sel.addRange(r);
            }
            const type = btn.dataset.type;
            if (!type) return;

            let value = btn.dataset.value || null;
            if (type === "createLink" && !value) {
                value = prompt("Enter a URL");
                if (!value) return;
            }
            if (type === "hiliteColor") {
                const sel = window.getSelection();
                if (!sel.rangeCount) return;

                const range = sel.getRangeAt(0);

                if (!range.collapsed) {
                    // Selection: if selection touches a <mark>, unwrap one; else wrap selection
                    const startMark = getMarkAncestor(range.startContainer);
                    const endMark   = getMarkAncestor(range.endContainer);
                    if (startMark || endMark) {
                        unwrapMark(startMark || endMark);
                    } else {
                        wrapRangeInMark(range);
                    }
                } else {
                    // Caret: toggle inline. If INSIDE a <mark>, split it at the caret.
                    // If merely ADJACENT to a <mark>, leave the mark alone (we just turn typing off).
                    const insideMark = getMarkAncestor(range.startContainer);
                    if (insideMark) {
                        splitMarkAtCaret(range, insideMark);
                    } else {
                        // enter highlight typing: create empty mark and place caret inside
                        const mark = document.createElement("mark");
                        const z = document.createTextNode("\u200B"); // caret placeholder
                        mark.appendChild(z);
                        range.insertNode(mark);

                        const r = document.createRange();
                        r.setStart(z, 1);
                        r.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(r);

                        const cleanup = () => {
                            if (z.parentNode && z.nodeValue === "\u200B") z.remove();
                            bodyInput.removeEventListener("input", cleanup);
                        };
                        bodyInput.addEventListener("input", cleanup);
                    }
                } 
            } else {
                document.execCommand(type, false, value);
            }

            // Store current selection so if user selects text and clicks an action, we can restore it above.
            const sel2 = window.getSelection();
            if (sel2.rangeCount > 0 && !sel2.isCollapsed) {
                selectionRange = sel2.getRangeAt(0).cloneRange();
            }
        });
    });

    bodyInput.addEventListener("keydown", () => {
        const text = bodyInput.innerText.trim();
        const words = text === "" ? 0 : text.split(/\s+/).length;
        wordCount.innerText = words;
    });

    bodyInput.addEventListener("mouseup", saveSelection);
    bodyInput.addEventListener("keyup", () => {
        saveSelection();
        styleButtons.forEach((btn) => {
            const type = btn.dataset.type;
            if (type === "hiliteColor") {
                btn.classList.toggle("active", !!getMarkAncestor(window.getSelection().anchorNode));
            } else {
                btn.classList.toggle("active", document.queryCommandState(type));
            }
        });
    });
}

// CONSTRUCT NEW NOTE //
function newNote(noteContents = "") {
    let noteObj;

    if (typeof noteContents === "object") {
        noteObj = noteContents;
    } else {
        noteObj = { title: "", body: noteContents || "" };
        array.push(noteObj);
    }

    const clone = createNoteElement(noteObj);
    bindNoteEvents(clone, noteObj);
}

// Save a key/value pair to chrome.storage with basic error handling
function setStorage(key, value, callback) {
    chrome.storage.sync.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
            console.error("Storage set failed:", chrome.runtime.lastError);
        } else if (callback) {
            callback();
        }
    });
}

// Retrieve a value from chrome.storage
function getStorage(key, callback) {
    chrome.storage.sync.get(key, (result) => {
        if (chrome.runtime.lastError) {
            console.error("Storage get failed:", chrome.runtime.lastError);
            callback(null);
            return;
        }
        callback(result[key]);
    });
}

function loadNotesFromStorage() {
    getStorage("Table", (stored) => {
        let data = [];
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing Table:", e);
            }
        }

        array = data;
        if (array.length === 0) {
            newNote();
            return;
        }

        array.forEach((noteData) => {
            if (typeof noteData === "object" && noteData !== null) {
                newNote(noteData);
            }
        });
    });
}

function enableDragSorting() {
    Sortable.create(mainBox, {
        animation: 150,
        onEnd: (event) => {
            const movingNote = array.splice(event.oldIndex, 1)[0];
            let targetIndex = event.newIndex;
            if (event.newIndex > event.oldIndex) {
                targetIndex--;
            }
            array.splice(targetIndex, 0, movingNote);

            setStorage("Table", JSON.stringify(array));

            setTimeout(() => event.item.classList.add("saved"), 200);
            setTimeout(() => event.item.classList.remove("saved"), 1200);
        }
    });
}

function clearAllNotes() {
    array = [];
    chrome.storage.sync.remove("Table", () => {
        if (chrome.runtime.lastError) {
            console.error("Storage remove failed:", chrome.runtime.lastError);
        }
    });
    mainBox.innerHTML = "";
    newNote();
}

function exportNotes() {
    getStorage("Table", (stored) => {
        let data = [];
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing Table:", e);
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "notes-export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

clearCacheButton.onclick = clearAllNotes;
exportButton.onclick = exportNotes;

window.onload = () => {
    loadNotesFromStorage();
    enableDragSorting();
    setupUI();
};

function setupUI() {
    // Settings toggle
    settings.onclick = () => {
        settings_menu.classList.toggle("open");
    };

    close_settings.onclick = () => {
        settings_menu.classList.remove("open");
    };

    // Search functionality
    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        const notes = mainBox.querySelectorAll(".note");
        notes.forEach(note => {
            const title = note.querySelector(".note-title").value.toLowerCase();
            const body = note.querySelector(".noteContents").innerText.toLowerCase();
            const match = title.includes(searchTerm) || body.includes(searchTerm);
            note.style.display = match ? "" : "none";
        });
    });

    // Hover effect on new note button
    newNoteButton.onmouseover = () => {
        newNoteButton.style.opacity = 0.8;
    };
    newNoteButton.onmouseleave = () => {
        newNoteButton.style.opacity = 1;
    };

    // New note creation
    newNoteButton.onclick = () => {
        newNote();
    };
}

function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
