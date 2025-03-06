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
        this._reelCount = null;
        this._reelHeight = null;
        this._symbolNodes = null;
        this._symbolHeight = null;
        this._spinSpeed = null;
        this._mulSymbolSize = null;
        this._startPosY = null;
        this._reelUpdates = null;
        this._spinResults = null;
        this._reelStopSchedules = null;
        this._payoutCallback = null;
        this._isSpinningCallback = null;
        this._visibleSymbols = null;

        this._spinEndCount = null;
        this._stripIndex = null;
    },

    _initValues: function (stripData) {
        this._AR = [];
        this._ARTotal = 6; // 심볼이 총 몇 개인지
        this.stripData = stripData;
        this._reelCount = 0;
        this._reelHeight = 3; // 릴의 세로 길이(한번에 보이는 심볼의 수)
        this._symbolNodes = [];
        this._symbolHeight = 105; // 심볼 간격 포함 높이
        this._spinSpeed  = 35; // 스크롤 속도 (값이 클수록 빠름)
        this._mulSymbolSize = 0.95; //슬롯 사이즈랑 안맞을 때 변경
        this._startPosY = 60;
        this._endPosY = this._startPosY - this._symbolHeight;
        this._reelUpdates = [];
        this._reelStopSchedules = [];
        this._visibleSymbols = [];

        this._spinEndCount = 0;
    },

    initCallBacks : function (payoutCallback, isSpinningCallback) {
        this._payoutCallback = payoutCallback;
        this._isSpinningCallback = isSpinningCallback;
    },

    _initReels: function (normalReelBack) {
        this._normalReelBack = normalReelBack;
        this._reels = this._normalReelBack.getChildren();
        this._reelCount = this._reels.length;

        for (var index = 0; index < this._reelCount; index++) {
            var layout = new ccui.Layout();
            layout.setContentSize(this._reels[index].getContentSize());
            layout.setClippingEnabled(true);
            layout.setPosition(cc.p(0, 0));
            this._reels[index].addChild(layout);
            this._reels[index].layout = layout;

            this._symbolNodes[index] = [];
        }
    },

    _initSymbols: function () {
        // Armature 리소스 로드
        for (var i = 0; i < this._ARTotal; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
            this._AR.push("sl_symbolAR0" + (i + 1));
        }

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var reel = this._reels[reelIndex];
            var layout = reel.layout;
            var strip = this.stripData[reelIndex];

            for (var symbolCount = 0; symbolCount < this._reelHeight+2; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1; //strip은 1부터 시작 해서 내림
                var symbolNode = new SymbolNode();
                symbolNode.initSymbol(this._AR, symbolIndex, this._mulSymbolSize, symbolCount);

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
        this._spinSymbols();
    },

    _spinSymbols: function () {
        this._spinEndCount = 0;
        this._stripIndex = [];
        for(var i = 0; i < this._reelCount; ++i) {
            this._stripIndex.push(0);
        }

        this._reelUpdate = function(){
            for(var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
                if(reelIndex < this._spinEndCount) {continue;}

                var symbols = this._symbolNodes[reelIndex];
                var strip = this.stripData[reelIndex];
                var stripLength = strip.length;
                var symbolNodeLength = symbols.length;
                var stripIndex = this._stripIndex[reelIndex];

                for (var symbolIndex = 0; symbolIndex < symbolNodeLength; symbolIndex++) {
                    var symbol = symbols[symbolIndex];
                    symbol.setPositionY(symbol.getPositionY() - this._spinSpeed);

                    if(symbol.getPositionY() <= this._endPosY) {
                        var prevStripIndex = stripIndex + this._reelHeight + 2;
                        if(prevStripIndex >= stripLength) { prevStripIndex -= stripLength;}
                        symbol.setSymbol(strip[prevStripIndex]-1, prevStripIndex);

                        var nextPosY = Math.max(...symbols.map(symbol => symbol.getPositionY())) + this._symbolHeight;
                        symbol.setPositionY(nextPosY);
                        stripIndex = stripIndex >= stripLength ? 0 : stripIndex + 1;
                        this._stripIndex[reelIndex] = stripIndex;
                    }
                }
            }
        }.bind(this);

        this.schedule(this._reelUpdate, 1 / 144);
    },

    // 스핀이 순서대로 잘 끝났을 때
    spinEnd: function(result, delayAdd) {
        this._spinResults = result;
        var delay = 0;
        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            delay+=delayAdd;

            this._reelStopSchedules[reelIndex] = ((index) => () => {
                this._spinEndCount++;
                this._reelUpdates[index] = null;
                this.correctSymbolsPosition(index, this._spinResults);
            })(reelIndex).bind(this);

            this.scheduleOnce(this._reelStopSchedules[reelIndex], delay);
        }
    },

    // 중간에 STOP해서 멈출 때
    spinStop: function () {
        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
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
        cc.log("스핀 결과: ", spinResult);
        var selectedSymbol;
        for(symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
            var symbol = symbols[symbolIndex];
            cc.log(symbol.getStripIndex());
            if(symbol.getStripIndex() === spinResult){
                selectedSymbol = symbol;
            }
        }

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

        for (var i = 0; i < this._reelHeight + 1; i++) {
            var index = (spinResult + i) % symbols.length;
            var jumpAction = cc.jumpBy(0.2, cc.p(0, 0), -20, 1).easing(cc.easeBackOut());
            var action = reelIndex === this._reelCount - 1 && i === 3
                ? cc.sequence(jumpAction, cc.callFunc(() => { this._getResultSymbols(); }, this))
                : jumpAction;

            symbols[index].runAction(action);
        }
    },

    _getResultSymbols: function () {
        var resultSymbols = new Array(this._AR.length).fill(0);
        this._visibleSymbols = [];

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var symbols = this._symbolNodes[reelIndex];
            var spinResult = this._spinResults[reelIndex];
            for(i = 0 ; i < this._reelHeight; i++){
                var index = (spinResult + i) % symbols.length;
                this._visibleSymbols.push(symbols[index]);
                var resultIndex = symbols[index].getSymbolNum();
                resultSymbols[resultIndex]++;
            }
        }

        this._spinResults = null;
        this._payoutCallback(resultSymbols);
        this._isSpinningCallback();
    },

    playSymbolAnimation : function (targetSymbolNum) {
        this._visibleSymbols?.forEach((symbol) => {
            if(symbol.getSymbolNum() === targetSymbolNum){
                symbol.setAnimation("play");
            }
        })
    },

    stopSymbolAnimation : function () {
        this._visibleSymbols?.forEach((symbol) => {
            symbol.setAnimation("normal");
        })
    },

});
