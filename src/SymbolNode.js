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
        this.symbolNum = null;
    },

    _initValues: function () {

    },

    setSymbol: function (AR, index, mulSymbolSize) {
        this.setScale(this.getScale() * mulSymbolSize);

        this.armature = new ccs.Armature(AR[index]);
        this.setAnimation("normal"); // 애니메이션 실행
        this.armature.setAnchorPoint(cc.p(0.5, 0.5));
        this.addChild(this.armature);

        this.symbolNum = index;
    },

    setAnimation: function (animationType) {
        this.armature.getAnimation().play(animationType);
    },

    getSymbolNum :function (){
        return this.symbolNum;
    }
})