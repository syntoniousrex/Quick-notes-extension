/**************************************
* GLOBAL STATE
**************************************/

// Notes data array
let array = [];

// Formatting flags (not currently used, but preserved for future)
let ITALIC = false;
let BOLD = false;
let UNDERLINE = false;
let HIGHLIGHT = false;
let start = 0;
let end = 0;

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
const header = document.querySelector("header");
const mainBox = document.getElementById("mainBox");
const settings = document.getElementById("settings");
const close_settings = document.getElementById("close_settings");
const settings_menu = document.getElementById("settings_menu");
const newNoteButton = document.getElementById("newNote");
const clearCacheButton = document.getElementById("clear-cache");
const exportButton = document.getElementById("export-notes");
const lightModeToggle = document.getElementById("light-mode-toggle");
const searchInput = document.getElementById("search-input");
const container = document.getElementById("mainBox"); // used for search filtering

if (lightModeToggle) {
    chrome.storage.sync.get("lightMode", (res) => {
        if (res.lightMode) {
            body.classList.add("light-mode");
            lightModeToggle.checked = true;
        }
    });

    lightModeToggle.addEventListener("change", () => {
        const enabled = lightModeToggle.checked;
        body.classList.toggle("light-mode", enabled);
        chrome.storage.sync.set({ lightMode: enabled });
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

    const saveNote = debounce(() => {
        noteObj.title = titleInput.value;
        noteObj.body = bodyInput.innerHTML;

        console.log("[saveNote] Updated note object:", noteObj);
        console.log("[saveNote] Full array:", array);

        chrome.storage.sync.set({ "Table": JSON.stringify(array) }, () => {
            console.log("[saveNote] Storage updated");
        });

        clone.classList.add("saved");
        setTimeout(() => clone.classList.remove("saved"), 800);
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
    styleButtons.forEach((btn) => {
        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            const type = btn.dataset.type;
            if (type) {
                document.execCommand(type, false, null);
                bodyInput.focus();
            }
        });
    });

    bodyInput.addEventListener("keydown", () => {
        const text = bodyInput.innerText.trim();
        const words = text === "" ? 0 : text.split(/\s+/).length;
        wordCount.innerText = words;
    });

    bodyInput.addEventListener("keyup", () => {
        styleButtons.forEach((btn) => {
            const type = btn.dataset.type;
            btn.classList.toggle("active", document.queryCommandState(type));
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

function setStorage(key, value) {
    chrome.storage.sync.set({[key] : value}, function() {
        console.log("[setStorage] Key:", key, "Value:", value);
        chrome.storage.sync.get(key, function(result) {
            console.log("[setStorage] Confirmed saved:", result[key]);
        });
    });
}

function loadNotesFromStorage() {
    console.log("[loadNotesFromStorage] Loading notes…");

    chrome.storage.sync.get("Table", function (result) {
        let data = [];

        if (result["Table"]) {
            try {
                data = JSON.parse(result["Table"]);
            } catch (e) {
                console.error("Error parsing Table:", e);
            }
        }

        console.log("[loadNotesFromStorage] Loaded data:", data);
        array = data;

        if (array.length === 0) {
            console.log("[loadNotesFromStorage] No notes found. Creating one.");
            newNote();
            return;
        }

        array.forEach(noteData => {
            if (typeof noteData === "object" && noteData !== null) {
                newNote(noteData);
            }
        });

        console.log("[loadNotesFromStorage] All notes rendered");
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

            console.log("[drag] New array order:", array);
            chrome.storage.sync.set({ Table: JSON.stringify(array) });

            setTimeout(() => event.item.classList.add("saved"), 200);
            setTimeout(() => event.item.classList.remove("saved"), 1000);
        }
    });
}

function clearAllNotes() {
    array = [];
    chrome.storage.sync.remove("Table", () => {
        console.log("[clearAllNotes] Storage cleared");
    });
    mainBox.innerHTML = "";
    newNote();
}

function exportNotes() {
    chrome.storage.sync.get("Table", (result) => {
        let data = [];
        if (result["Table"]) {
            try {
                data = JSON.parse(result["Table"]);
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

        console.log("[exportNotes] Notes exported");
    });
}

clearCacheButton.onclick = clearAllNotes;
exportButton.onclick = exportNotes;

window.onload = () => {
    console.log("[onload] Extension loaded");
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
        console.log("[newNoteButton] Clicked");
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