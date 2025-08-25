// Toggle a highlight class on an element by id.
// Returns the state after toggle (true = highlighted)
function toggleHighlight(blockId, force) {
    const el = document.getElementById(blockId);
    if (!el) return false;
    const cls = 'wm-highlight';
    const next = (typeof force === 'boolean') ? force : !el.classList.contains(cls);
    if (next) el.classList.add(cls);
    else el.classList.remove(cls);
    return next;
}

module.exports = { toggleHighlight };
