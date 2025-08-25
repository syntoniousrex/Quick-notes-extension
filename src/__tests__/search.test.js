const { filterNotes } = require('../core/search');

const notes = [
    { id: '1', text: 'Add keyboard shortcut for save', createdAt: 1 },
    { id: '2', text: 'Fix highlight toggle regression', createdAt: 2 },
    { id: '3', text: 'Style: align search bar with icons', createdAt: 3 },
];

test('returns all when query empty', () => {
    expect(filterNotes(notes, '')).toHaveLength(3);
});

test('case/space-insensitive match', () => {
    expect(filterNotes(notes, '  highlight   TOGGLE ')).toHaveLength(1);
    expect(filterNotes(notes, 'search bar')).toHaveLength(1);
});
