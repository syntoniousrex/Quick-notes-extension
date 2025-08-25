const { getLocal, setLocal } = require('../core/storage');

describe('storage wrappers', () => {
    beforeEach(() => {
        // fresh stub for each test
        chrome.storage.local.get = (_keys, cb) => cb({ notes: [{ id:'1', text:'hi', createdAt:1 }] });
        chrome.storage.local.set = (_obj, cb) => cb && cb();
    });

    test('getLocal returns data via promise', async () => {
        const data = await getLocal(['notes']);
        expect(Array.isArray(data.notes)).toBe(true);
        expect(data.notes[0].text).toBe('hi');
    });

    test('setLocal resolves after write', async () => {
        const spy = jest.fn((obj, cb) => cb && cb());
        chrome.storage.local.set = spy;
        await expect(setLocal({ notes: [] })).resolves.toBeUndefined();
        expect(spy).toHaveBeenCalledWith({ notes: [] }, expect.any(Function));
    });

    test('graceful empty keys', async () => {
        chrome.storage.local.get = (_keys, cb) => cb({});
        const data = await getLocal(); // undefined -> all
        expect(typeof data).toBe('object');
    });
});
