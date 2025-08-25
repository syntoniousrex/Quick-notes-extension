const { setInlineStyles, toggleInlineStyle, toKebab } = require('../content/inlineStyle');

describe('inline style utils', () => {
    beforeEach(() => {
        document.body.innerHTML = `
        <div id="blockA" class="wm-highlight extra-class" style="color: blue;"></div>
        <div id="blockB"></div>
        `;
    });

    test('toKebab converts camelCase -> kebab-case', () => {
        expect(toKebab('backgroundColor')).toBe('background-color');
        expect(toKebab('borderTopLeftRadius')).toBe('border-top-left-radius');
    });

    test('setInlineStyles merges without nuking existing styles', () => {
        // blockA already has color: blue inline
        const ok = setInlineStyles('blockA', { backgroundColor: 'yellow', fontWeight: '700' });
        expect(ok).toBe(true);

        const el = document.getElementById('blockA');
        expect(el.style.getPropertyValue('color')).toBe('blue');               // preserved
        expect(el.style.getPropertyValue('background-color')).toBe('yellow');   // added
        expect(el.style.getPropertyValue('font-weight')).toBe('700');           // added
    });

    test('setInlineStyles removes when value is null/undefined/empty string', () => {
        const el = document.getElementById('blockA');
        // start with color: blue; add another style then remove both
        setInlineStyles('blockA', { backgroundColor: 'yellow' });
        setInlineStyles('blockA', { color: null, backgroundColor: '' });

        expect(el.style.getPropertyValue('color')).toBe('');             // removed
        expect(el.style.getPropertyValue('background-color')).toBe('');  // removed
    });

    test('does not touch classes (preserves wm-highlight and others)', () => {
        setInlineStyles('blockA', { backgroundColor: 'yellow' });
        const el = document.getElementById('blockA');
        const classes = el.className.split(/\s+/);
        expect(classes).toEqual(expect.arrayContaining(['wm-highlight', 'extra-class']));
    });

    test('idempotence: applying same styles twice results in same inline style', () => {
        setInlineStyles('blockB', { color: 'red', fontWeight: 'bold' });
        const html1 = document.getElementById('blockB').getAttribute('style');

        setInlineStyles('blockB', { color: 'red', fontWeight: 'bold' });
        const html2 = document.getElementById('blockB').getAttribute('style');

        expect(html2).toBe(html1);
    });

    test('toggleInlineStyle sets onValue if not present, then removes when toggled again (no offValue)', () => {
        const v1 = toggleInlineStyle('blockB', 'textDecoration', 'underline');
        expect(v1).toBe('underline');
        expect(document.getElementById('blockB').style.getPropertyValue('text-decoration')).toBe('underline');

        const v2 = toggleInlineStyle('blockB', 'textDecoration', 'underline');
        expect(v2).toBe(''); // removed
        expect(document.getElementById('blockB').style.getPropertyValue('text-decoration')).toBe('');
    });

    test('toggleInlineStyle switches between onValue and custom offValue', () => {
        // Start off empty -> set onValue
        const v1 = toggleInlineStyle('blockB', 'fontWeight', '700', '400');
        expect(v1).toBe('700');
        expect(document.getElementById('blockB').style.getPropertyValue('font-weight')).toBe('700');

        // Toggle -> offValue (400)
        const v2 = toggleInlineStyle('blockB', 'fontWeight', '700', '400');
        expect(v2).toBe('400');
        expect(document.getElementById('blockB').style.getPropertyValue('font-weight')).toBe('400');

        // Toggle again -> onValue (700)
        const v3 = toggleInlineStyle('blockB', 'fontWeight', '700', '400');
        expect(v3).toBe('700');
    });

    test('gracefully handles bad element ids', () => {
        expect(setInlineStyles('nope', { color: 'red' })).toBe(false);
        expect(toggleInlineStyle('nope', 'color', 'red')).toBeNull();
    });

    test('accepts many props at once and keeps unrelated ones intact', () => {
        const el = document.getElementById('blockA');
        el.style.setProperty('letter-spacing', '1px');

        setInlineStyles('blockA', {
        color: 'green',
        backgroundColor: 'yellow',
        borderTopLeftRadius: '6px',
        });

        expect(el.style.getPropertyValue('letter-spacing')).toBe('1px');              // untouched
        expect(el.style.getPropertyValue('color')).toBe('green');
        expect(el.style.getPropertyValue('background-color')).toBe('yellow');
        expect(el.style.getPropertyValue('border-top-left-radius')).toBe('6px');
    });
});
