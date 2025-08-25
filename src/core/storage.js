function getLocal(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}
function setLocal(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}
module.exports = { getLocal, setLocal };
