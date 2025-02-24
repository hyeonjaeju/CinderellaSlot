CinderellaReelsNode = cc.Node.extend({
    ctor: function (normalReelBack) {
        this._super();
        this._init(normalReelBack);
    },

    _init: function (normalReelBack) {
        this._initProperties();
        this._initValues();
        this._initReels(normalReelBack);
    },

    _initProperties: function () {
        this.AR = null;
        this.stripData = null;
        this._normalReelBack = null;
        this._reels = null;

    },

    _initValues: function () {
        this.AR = ["sl_symbolAR01","sl_symbolAR02","sl_symbolAR03","sl_symbolAR04","sl_symbolAR05","sl_symbolAR06"];
        this.stripData = [];
    },

    _initReels: function (normalReelBack) {
        this._normalReelBack = normalReelBack;
        this._reels = this._normalReelBack.getChildren();

        // 릴 배경에 클리핑 영역 생성 및 자식으로 추가
        for (var index = 0; index < this._reels.length; index++) {
            var layout = new ccui.Layout();
            layout.setContentSize(this._reels[index].getContentSize());
            layout.setClippingEnabled(true);
            this._reels[index].addChild(layout);
            this._reels[index].layout = layout;
        }

        // Armature 리소스 로드
        {
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR01);
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR02);
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR03);
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR04);
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR05);
            ccs.armatureDataManager.addArmatureFileInfo(res.symbolAR06);
        }

        //테스트
        var rand = Math.random() * 5 | 0;

        var symbolObject = new SymbolObject();
        symbolObject.setSymbol(this.AR, rand);
        symbolObject.setPosition(this._reels[rand].getContentSize().width/2, this._reels[rand].getContentSize().height/2);

        rand = Math.random() * 5 | 0;
        this._reels[rand].layout.addChild(symbolObject, 1);
    },
})