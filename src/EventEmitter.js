var EventEmitter = cc.Class.extend({
    ctor: function() {
        this._listeners = {};
    },

    on: function(eventType, callback, target) {
        if (!this._listeners[eventType]) {
            this._listeners[eventType] = [];
        }
        this._listeners[eventType].push({
            callback: callback,
            target: target || null
        });
    },

    off: function(eventType, callback, target) {
        if (!this._listeners[eventType]) return;

        var listeners = this._listeners[eventType];
        for (var i = listeners.length - 1; i >= 0; i--) {
            var listener = listeners[i];
            if (listener.callback === callback &&
                (!target || listener.target === target)) {
                listeners.splice(i, 1);
            }
        }
    },

    emit: function(eventType, data) {
        if (!this._listeners[eventType]) return;

        var listeners = this._listeners[eventType].slice(); // 복사본 생성
        listeners.forEach(function(listener) {
            listener.callback.call(listener.target, data);
        });
    }
});