function normalizeText(s) {
    return String(s).trim().replace(/\s+/g, ' ');
}

function wouldDuplicate(existing, candidateText, minLength = 2) {
    const c = normalizeText(candidateText).toLowerCase();
    if (c.length < minLength) return false;
    return existing.some(n => normalizeText(n.text).toLowerCase() === c);
}

function uid() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addNote(existing, text, now = Date.now) {
    if (wouldDuplicate(existing, text)) return existing;
    const note = { id: uid(), text: normalizeText(text), createdAt: now() };
    return [...existing, note];
}

module.exports = { normalizeText, wouldDuplicate, addNote };
