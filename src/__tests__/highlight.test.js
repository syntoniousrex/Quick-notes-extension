const { toggleHighlight } = require('../content/highlight');

describe('highlight toggle', () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="blockA"></div>`;
    });

    test('adds class when not highlighted', () => {
        const state = toggleHighlight('blockA');
        expect(state).toBe(true);
        expect(document.getElementById('blockA').classList.contains('wm-highlight')).toBe(true);
    });

    test('removes class when highlighted', () => {
        const el = document.getElementById('blockA');
        el.classList.add('wm-highlight');
        const state = toggleHighlight('blockA');
        expect(state).toBe(false);
        expect(el.classList.contains('wm-highlight')).toBe(false);
    });

    test('force param sets explicit state', () => {
        toggleHighlight('blockA', true);
        expect(document.getElementById('blockA').classList.contains('wm-highlight')).toBe(true);
        toggleHighlight('blockA', false);
        expect(document.getElementById('blockA').classList.contains('wm-highlight')).toBe(false);
    });
});
