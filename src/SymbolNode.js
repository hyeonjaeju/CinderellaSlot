SymbolNode = cc.Node.extend({
    ctor: function () {
        this._super();
        this._init();
    },

    _init: function () {
        this._initProperties();
        this._initValues();
        this.setAnchorPoint(cc.p(0.5, 0.5));
    },

    _initProperties: function () {
        this.armature = null;
    },

    _initValues: function () {

    },

    setSymbol: function (AR, index, mulSymbolSize) {
        this.setScale(this.getScale() * mulSymbolSize);

        var armature = new ccs.Armature(AR[index]);
        armature.getAnimation().play("normal");  // 애니메이션 실행
        armature.setAnchorPoint(cc.p(0.5, 0.5));
        this.addChild(armature);
    }
})