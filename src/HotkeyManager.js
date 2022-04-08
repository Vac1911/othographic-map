class HotkeyManager {
    constructor() {
        this.keyBinds = [];
        document.addEventListener('keydown', this._keyHandle.bind(this));
    }
    setHotkey(keys, callback, id) {
        if (typeof keys === 'string')
            keys = keys.split('+');
        this.keyBinds.push({
            id: id,
            char: keys.pop().toLowerCase(),
            ctrl: keys.includes('ctrl'),
            alt: keys.includes('alt'),
            meta: keys.includes('meta'),
            shift: keys.includes('shift'),
            callback: callback
        });
    }
    _keyHandle(e) {
        this.keyBinds.filter(bind =>
            bind.char === e.key.toLowerCase() &&
            bind.ctrl === e.ctrlKey &&
            bind.alt === e.altKey &&
            bind.meta === e.metaKey &&
            bind.shift === e.shiftKey
        ).forEach(bind => bind.callback(e))
    }
}

export default new HotkeyManager();