SymbolNode = cc.Node.extend({
    ctor: function () {
        this._super();
        this._init();
    },

    _init: function () {
        this._initProperties();
        this._initValues();
    },

    _initProperties: function () {
        this.armature = null;
        this.symbolNum = null;
    },

    _initValues: function () {

    },

    setSymbol: function (AR, index) {
        this.symbolNum = index;

        var armature = new ccs.Armature(AR[index]);
        armature.getAnimation().play("normal");  // 애니메이션 실행
        this.addChild(armature);
    }
})