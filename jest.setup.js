global.chrome = {
    storage: {
        local: {
        get: (keys, cb) => cb({}),
        set: (_obj, cb) => cb && cb(),
        },
    },
    runtime: { sendMessage: jest.fn() },
};

// Simple localStorage mock
class LocalStorageMock {
    constructor(){ this.store = {}; }
    getItem(k){ return this.store[k] ?? null; }
    setItem(k,v){ this.store[k] = String(v); }
    removeItem(k){ delete this.store[k]; }
    clear(){ this.store = {}; }
}
Object.defineProperty(global, 'localStorage', { value: new LocalStorageMock() });
