var CinderellaLayer = cc.Layer.extend({
    ctor: function () {
        this._super();

        this._init();

        return true;
    },

    _init: function () {
        this._initProperties();
        this._initValues();
        this._initGameNode();
    },

    _initProperties: function () {
        this._gameNode = null;
    },

    _initValues: function () {

    },

    _initGameNode: function () {
        this._gameNode = new CinderellaGameNode();
        this.addChild(this._gameNode);
    }
});



var Cinderella = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new CinderellaLayer();
        this.addChild(layer);
    }
});
