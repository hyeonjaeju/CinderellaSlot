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
        this._armature = null;
        this.symbolNum = null;
        this._ARarr = null;
        this.isNew = null;
    },

    _initValues: function () {
        this._ARarr = [];
        this.isNew = true;
    },

    initSymbol: function (AR, index, mulSymbolSize, stripIndex) {
        this.setScale(this.getScale() * mulSymbolSize);
        for (var i = 0; i < AR.length; i++) {
            this._ARarr[i] = new ccs.Armature(AR[i]);
            this._ARarr[i].getAnimation().play("normal");
            this._ARarr[i].setAnchorPoint(cc.p(0.5, 0.5));
            this.addChild(this._ARarr[i]);
        }

        this.setSymbol(index, stripIndex);
        this.isNew = false;
    },

    setSymbol: function (index, stripIndex) {
        this._invisibleAllAR();
        this.symbolNum = index;
        this._armature = this._ARarr[index];
        this._armature.setVisible(true);
    },

    _invisibleAllAR: function () {
        this._ARarr?.forEach((AR)=>{
            AR.setVisible(false);
        });
    },

    setAnimation: function (animationType) {
        this._armature.getAnimation().play(animationType);
    },

    getSymbolNum :function (){
        return this.symbolNum;
    },

    getIsNew : function (){
        return this.isNew;
    }
})