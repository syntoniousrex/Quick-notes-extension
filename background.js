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
        if (sel.rangeCount > 0) {
            selectionRange = sel.getRangeAt(0).cloneRange();
        }
    }

    function isHighlighted() {
        const current = document.queryCommandValue("hiliteColor");
        return current === "rgb(255, 255, 0)" || current === "yellow";
    }

    function selectionHasHighlight(range) {
        function hasHighlight(node) {
            while (node && node !== bodyInput) {
                if (node.nodeType === 1) {
                    const bg = getComputedStyle(node).backgroundColor;
                    if (bg === "yellow" || bg === "rgb(255, 255, 0)") {
                        return true;
                    }
                }
                node = node.parentNode;
            }
            return false;
        }

        if (hasHighlight(range.startContainer) || hasHighlight(range.endContainer)) {
            return true;
        }

        const fragment = range.cloneContents();
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode();
        while (node) {
            const bg = node.style.backgroundColor;
            if (bg === "yellow" || bg === "rgb(255, 255, 0)") {
                return true;
            }
            node = walker.nextNode();
        }
        return false;
    }
  
    styleButtons.forEach((btn) => {
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const type = btn.dataset.type;
            if (!type) return;

            let value = btn.dataset.value || null;
            if (type === "createLink" && !value) {
                value = prompt("Enter a URL");
                if (!value) return;
            }

            const sel = window.getSelection();
            bodyInput.focus();

            if (selectionRange) {
                sel.removeAllRanges();
                sel.addRange(selectionRange);
            }

            if (type === "hiliteColor") {
                if (sel.isCollapsed && isHighlighted()) {
                    // Split existing highlight at the caret so future text isn't highlighted
                    let node = sel.anchorNode;
                    while (node && node !== bodyInput) {
                        if (node.nodeType === 1 && getComputedStyle(node).backgroundColor === "rgb(255, 255, 0)") {
                            const restore = sel.getRangeAt(0).cloneRange();
                            const clear = document.createRange();
                            clear.setStart(sel.anchorNode, sel.anchorOffset);
                            clear.setEndAfter(node);
                            sel.removeAllRanges();
                            sel.addRange(clear);
                            document.execCommand(type, false, "transparent");
                            sel.removeAllRanges();
                            sel.addRange(restore);
                            break;
                        }
                        node = node.parentNode;
                    }
                } else {
                    const range = sel.getRangeAt(0);
                    const toggleValue = selectionHasHighlight(range) ? "transparent" : value;
                    document.execCommand(type, false, toggleValue);
                }
            } else {
                document.execCommand(type, false, value);
            }

            const sel2 = window.getSelection();
            if (sel2.rangeCount > 0) {
                selectionRange = sel2.getRangeAt(0).cloneRange();
            }

            saveSelection();
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
                btn.classList.toggle("active", isHighlighted());
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
