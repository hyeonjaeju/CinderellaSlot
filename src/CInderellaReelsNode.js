CinderellaReelsNode = cc.Node.extend({
    ctor: function (normalReelBack, stripData) {
        this._super();
        this._init(normalReelBack, stripData);
    },

    _init: function (normalReelBack, stripData) {
        this._initProperties();
        this._initValues(stripData);
        this._initReels(normalReelBack);
        this._initSymbols();
    },

    _initProperties: function () {
        this._AR = null;
        this._ARTotal = null;
        this.stripData = null;
        this._normalReelBack = null;
        this._reels = null;
        this._symbolNodes = null;
        this._symbolHeight = null;
        this._spinSpeed = null;
        this._mulSymbolSize = null;
        this._startPosY = null;
        this._reelUpdates = null;
        this._spinResults = null;
        this._reelStopSchedules = null;
    },

    _initValues: function (stripData) {
        this._AR = [];
        this._ARTotal = 6; // 심볼이 총 몇 개인지
        this.stripData = stripData;
        this._symbolNodes = [];
        this._symbolHeight = 105; // 심볼 간격 포함 높이
        this._spinSpeed  = 35; // 스크롤 속도 (값이 클수록 빠름)
        this._mulSymbolSize = 0.95; //슬롯 사이즈랑 안맞을 때 변경
        this._startPosY = 60;
        this._endPosY = this._startPosY - this._symbolHeight;
        this._reelUpdates = [];
        this._reelStopSchedules = [];
    },

    _initReels: function (normalReelBack) {
        this._normalReelBack = normalReelBack;
        this._reels = this._normalReelBack.getChildren();

        for (var index = 0; index < this._reels.length; index++) {
            var layout = new ccui.Layout();
            layout.setContentSize(this._reels[index].getContentSize());
            layout.setClippingEnabled(true);
            layout.setPosition(cc.p(0, 0));
            this._reels[index].addChild(layout);
            this._reels[index].layout = layout;

            this._symbolNodes[index] = [];
        }

        // Armature 리소스 로드
        for (var i = 0; i < this._ARTotal; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
            this._AR.push("sl_symbolAR0" + (i + 1));
        }
    },

    _initSymbols: function () {
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            var reel = this._reels[reelIndex];
            var layout = reel.layout;
            var strip = this.stripData[reelIndex];

            for (var symbolCount = 0; symbolCount < strip.length; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1; //strip에는 1부터 시작 해서 내림
                var symbolNode = new SymbolNode();
                symbolNode.setSymbol(this._AR, symbolIndex, this._mulSymbolSize);

                symbolNode.setPosition(
                    reel.getContentSize().width / 2, //해당 릴의 중앙
                    this._startPosY + symbolCount * this._symbolHeight
                );

                layout.addChild(symbolNode, 1);
                this._symbolNodes[reelIndex].push(symbolNode);
            }
        }
    },

    startSpin: function () {
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            this._spinSymbols(reelIndex);
        }
    },

    _spinSymbols: function (reelIndex) {
        var symbols = this._symbolNodes[reelIndex];

        this._reelUpdates[reelIndex] = function () {
            for (var symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
                var symbol = symbols[symbolIndex];
                symbol.setPositionY(symbol.getPositionY() - this._spinSpeed);

                if(symbol.getPositionY() <= this._endPosY) {
                    var prevSymbolIndex = symbolIndex - 1;
                    if(prevSymbolIndex < 0) { prevSymbolIndex = symbols.length - 1;}

                    var nextPosY = symbols[prevSymbolIndex].getPositionY() + this._symbolHeight;
                    symbol.setPositionY(nextPosY);
                }
            }
        }.bind(this);

        // 릴별 업데이트를 저장하고 실행
        this.schedule(this._reelUpdates[reelIndex], 1 / 144);
    },

    spinEnd: function(result, delayAdd, callback) {
        this._spinResults = result;
        var delay = 0;
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            delay+=delayAdd;

            this._reelStopSchedules[reelIndex] = ((index) => () => {
                this.unschedule(this._reelUpdates[index]);
                this._reelUpdates[index] = null;
                this.correctSymbolsPosition(index, this._spinResults);
                if(index === this._reels.length - 1) {callback();}
            })(reelIndex);

            this.scheduleOnce(this._reelStopSchedules[reelIndex], delay);
        }
    },

    spinStop: function () {
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            if(this._reelUpdates[reelIndex] !== null){
                this.unschedule(this._reelUpdates[reelIndex]);
                this.correctSymbolsPosition(reelIndex, this._spinResults);
                this.unschedule(this._reelStopSchedules[reelIndex]);
                this._reelStopSchedules[reelIndex] = null;
            }
        }
    },

    correctSymbolsPosition: function (reelIndex, spinResults) {
        var symbols = this._symbolNodes[reelIndex];
        var spinResult = spinResults[reelIndex];
        var selectedSymbol = symbols[spinResult];

        // 선택된 심볼의 Y 위치를 시작 위치로 설정
        selectedSymbol.setPositionY(this._startPosY);

        // spinResult 이후 심볼들 위치 설정
        var posY = selectedSymbol.getPositionY() + this._symbolHeight;
        for (var symbolIndex = spinResult + 1; symbolIndex < symbols.length; symbolIndex++) {
            symbols[symbolIndex].setPositionY(posY);
            posY += this._symbolHeight;
        }

        // spinResult 이전 심볼들 위치 설정
        for (var symbolIndex = 0; symbolIndex < spinResult; symbolIndex++) {
            symbols[symbolIndex].setPositionY(posY);
            posY += this._symbolHeight;
        }
        this.animateSymbolsOnStop(reelIndex, spinResult);
    },
    animateSymbolsOnStop: function (reelIndex, spinResult) {
        var symbols = this._symbolNodes[reelIndex];

        // 선택된 심볼 인덱스 spinResult와 그 위쪽 3개 심볼에만 점프 애니메이션 적용
        for (var symbolIndex = spinResult; symbolIndex < spinResult + 4; symbolIndex++) {
            var index = symbolIndex >= symbols.length ? symbolIndex - symbols.length : symbolIndex;
            symbols[index].runAction(
                cc.sequence(cc.jumpBy(0.2, cc.p(0, 0), -20, 1)).easing(cc.easeBackOut())
            );
        }
    }
});
