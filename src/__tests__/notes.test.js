const { addNote, wouldDuplicate } = require('../core/notes');

describe('notes dedupe', () => {
    const base = [
        { id: '1', text: 'Buy milk', createdAt: 1 },
        { id: '2', text: 'Fix inline styling bug', createdAt: 2 },
    ];

    test('detects duplicates ignoring case/spacing', () => {
        expect(wouldDuplicate(base, '  buy   MILK  ')).toBe(true);
        expect(wouldDuplicate(base, 'fix inline   styling    bug')).toBe(true);
        expect(wouldDuplicate(base, 'new item')).toBe(false);
    });

    test('addNote skips duplicates and normalizes whitespace', () => {
        const after1 = addNote(base, 'buy milk');
        expect(after1).toHaveLength(2); // skipped

        const after2 = addNote(base, '  New   note ');
        expect(after2).toHaveLength(3);
        expect(after2[2].text).toBe('New note');
    });

    test('minLength guard prevents noise from blocking adds', () => {
        const shortBase = [{ id: 'x', text: 'ok', createdAt: 1 }];
        expect(wouldDuplicate(shortBase, 'ok', 3)).toBe(false);
    });
});
