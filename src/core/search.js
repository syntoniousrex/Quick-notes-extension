const { normalizeText } = require('./notes');

function filterNotes(notes, query) {
    const q = normalizeText(query).toLowerCase();
    if (!q) return notes;
    return notes.filter(n => normalizeText(n.text).toLowerCase().includes(q));
}

module.exports = { filterNotes };
