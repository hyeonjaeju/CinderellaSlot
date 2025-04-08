SymbolManager = cc.Class.extend({
    ctor: function() {
        this._initProperties();
        this._initValues();
    },

    _initProperties: function() {
        this._symbolPoolManager = null;


        this._symbols = null;
        this._AR = null;
        this._ARTotalCount = null;
        this._reelHeight = null;
        this._symbolHeight = null;
        this._startPosY = null;
        this._mulSymbolSize = null;
    },

    _initValues: function() {
        this._symbolPoolManager = new SymbolPoolManager(SymbolNode);
        this._symbols = [];
        this._AR = [];
        this._ARTotalCount = GameSettings.AR_TOTAL_COUNT;
        this._reelHeight = GameSettings.REEL_HEIGHT;
        this._symbolHeight = GameSettings.SYMBOL_HEIGHT;
        this._startPosY = GameSettings.START_POS_Y;
        this._mulSymbolSize = GameSettings.SYMBOL_SIZE;

        // Armature 리소스 로드
        for (var i = 0; i < this._ARTotalCount; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
            this._AR.push("sl_symbolAR0" + (i + 1));
        }
    },

    createSymbols: function(reels, stripData) {

        var reelCount = reels.length;

        for (var reelIndex = 0; reelIndex < reelCount; reelIndex++) {
            this._symbols[reelIndex] = [];
        }

        // 스핀할 심볼들 생성
        for (var reelIndex = 0; reelIndex < reelCount; reelIndex++) {
            var reel = reels[reelIndex];
            var xPos = reel.getContentSize().width / 2;
            var layout = reel.layout;
            var strip = stripData[reelIndex];

            for (var symbolCount = 0; symbolCount < this._reelHeight+2; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1; //strip은 1부터 시작 해서 내림
                var symbolNode = this._symbolPoolManager.getSymbol();
                symbolNode.initSymbol(this._AR, symbolIndex, this._mulSymbolSize);

                symbolNode.setPosition(xPos, this._startPosY+ symbolCount * this._symbolHeight);

                layout.addChild(symbolNode, 1);
                this._symbols[reelIndex].push(symbolNode);
            }
        }
    }
})