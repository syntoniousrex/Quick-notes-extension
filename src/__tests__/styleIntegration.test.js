const { toggleHighlight } = require('../content/highlight');
const { setInlineStyles } = require('../content/inlineStyle');

test('highlight persists across inline style changes', () => {
    document.body.innerHTML = `<div id="blk" class="wm-highlight"></div>`;
    setInlineStyles('blk', { backgroundColor: 'yellow' });
    expect(document.getElementById('blk').classList.contains('wm-highlight')).toBe(true);

    toggleHighlight('blk'); // off
    expect(document.getElementById('blk').classList.contains('wm-highlight')).toBe(false);

    setInlineStyles('blk', { backgroundColor: 'lightgreen' }); // shouldn’t re-add/remove classes
    expect(document.getElementById('blk').classList.contains('wm-highlight')).toBe(false);

    toggleHighlight('blk'); // back on
    expect(document.getElementById('blk').classList.contains('wm-highlight')).toBe(true);
});
