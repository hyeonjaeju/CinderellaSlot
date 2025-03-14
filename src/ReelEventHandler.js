var ReelEventHandler = cc.Class.extend({
    ctor: function () {
        this._spinStartEvent = new cc.EventCustom(ReelEvents.SPIN_START);
        this._allReelsStoppedEvent = new cc.EventCustom(ReelEvents.ALL_REELS_STOPPED);
        this._longSpinStartEvent = new cc.EventCustom(ReelEvents.LONG_SPIN_START);
    },

    dispatchSpinStartEvent: function () {
        cc.eventManager.dispatchEvent(this._spinStartEvent);
    },

    dispatchAllReelsStoppedEvent: function (visualSymbols) {
        this._allReelsStoppedEvent.visualSymbols = visualSymbols;
        cc.eventManager.dispatchEvent(this._allReelsStoppedEvent);
    },

    dispatchLongSpinStartEvent: function () {
        cc.eventManager.dispatchEvent(this._longSpinStartEvent);
    }
});
