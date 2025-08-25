// Apply/merge inline styles on an element by id.
// - `styles` is an object of { prop: value } using camelCase CSS props (e.g., backgroundColor).
// - If value is null/undefined/'', the inline style is removed for that prop.
// - Returns true if the element was found and processed, false otherwise.
function setInlineStyles(blockId, styles) {
    const el = document.getElementById(blockId);
    if (!el || !styles || typeof styles !== 'object') return false;

    for (const [k, v] of Object.entries(styles)) {
        if (v === null || v === undefined || v === '') {
        el.style.removeProperty(toKebab(k));
        } else {
        el.style.setProperty(toKebab(k), String(v));
        }
    }
    return true;
}

// Toggle a single style prop between `onValue` and off (remove or `offValue`).
// - If offValue is provided, it sets that; otherwise removes the prop.
// - Returns the current value after toggle (string or '') or null if no element.
function toggleInlineStyle(blockId, prop, onValue, offValue) {
    const el = document.getElementById(blockId);
    if (!el) return null;

    const kebab = toKebab(prop);
    const current = el.style.getPropertyValue(kebab);

    if (current && current.trim() === String(onValue)) {
        if (offValue === undefined) {
        el.style.removeProperty(kebab);
        return '';
        } else {
        el.style.setProperty(kebab, String(offValue));
        return String(offValue);
        }
    } else {
        el.style.setProperty(kebab, String(onValue));
        return String(onValue);
    }
}

// Utility: convert camelCase to kebab-case for style.setProperty/removeProperty.
function toKebab(prop) {
    return prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

module.exports = { setInlineStyles, toggleInlineStyle, toKebab };
