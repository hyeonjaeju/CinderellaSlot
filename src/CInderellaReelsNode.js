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

        // 이벤트 핸들러 인스턴스 생성
        this._eventHandler = new ReelEventHandler();
    },

    _initProperties: function () {
        this._symbolPoolManager = null;

        this._AR = null;
        this._ARTotalCount = null;
        this.stripData = null;
        this._normalReelBack = null;
        this._reels = null;
        this._reelCount = null;
        this._reelHeight = null;
        this._reelSymbols = null;
        this._symbolHeight = null;
        this._spinSpeed = null;
        this._mulSymbolSize = null;
        this._startPosY = null;
        this._endPosY = null;
        this._reelStopSchedules = null;
        this._resultSymbols = null;

        this._spinEndCount = null;
        this._isReelStop = null;
        this._stripIndex = null;
        this._remainingSymbols = null;
        this._scatterCount = null;
        this._firstLongSpinIndex = null;
        this._longSpinEffect = null;
    },


    _initValues: function (stripData) {
        this._AR = [];
        this._ARTotalCount = GameSettings.AR_TOTAL_COUNT; // 심볼이 총 몇 개인지
        this.stripData = stripData;
        this._reelCount = 0;
        this._reelHeight = GameSettings.REEL_HEIGHT; // 릴의 세로 길이(한번에 보이는 심볼의 수)
        this._reelSymbols = [];
        this._symbolHeight = GameSettings.SYMBOL_HEIGHT; // 심볼 간격 포함 높이
        this._spinSpeed  = GameSettings.SPIN_SPEED; // 스크롤 속도 (값이 클수록 빠름)
        this._mulSymbolSize = GameSettings.SYMBOL_SIZE; //슬롯 사이즈랑 안맞을 때 변경
        this._startPosY = GameSettings.START_POS_Y;
        this._endPosY = this._startPosY - this._symbolHeight;
        this._reelStopSchedules = [];
        this._resultSymbols = [];

        this._spinEndCount = 0;
        this._isReelStop = false;
        this._scatterCount = 0;
        this._firstLongSpinIndex = this._reelCount+1;
    },

    _initReels: function (normalReelBack) {
        this._normalReelBack = normalReelBack;
        this._reels = this._normalReelBack.getChildren();
        this._reelCount = this._reels.length;

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var layout = new ccui.Layout();
            layout.setContentSize(this._reels[reelIndex].getContentSize());
            layout.setClippingEnabled(true);
            layout.setPosition(cc.p(0, 0));
            this._reels[reelIndex].addChild(layout);
            this._reels[reelIndex].layout = layout;

            this._reelSymbols[reelIndex] = [];
        }

        // 롱스핀 이펙트 초기화
        this._longSpinEffect = new cc.DrawNode();
        this._longSpinEffect.drawRect(
            cc.p(0, 0),
            cc.p(this._reels[0].width, this._reels[0].height),
            cc.color(0, 0, 0, 0),
            5, // 테두리 두께
            cc.color(175, 255, 255, 255)
        );

        this._longSpinEffect.setVisible(false);
        this.addChild(this._longSpinEffect, 2);
    },

    _initSymbols: function () {
        // Armature 리소스 로드
        for (var i = 0; i < this._ARTotalCount; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
            this._AR.push("sl_symbolAR0" + (i + 1));
        }

        // 심볼 풀링매니저 생성
        this._symbolPoolManager = new SymbolPoolManager(SymbolNode);

        // 스핀할 심볼들 생성
        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var reel = this._reels[reelIndex];
            var xPos = reel.getContentSize().width / 2;
            var layout = reel.layout;
            var strip = this._getStrip(reelIndex);

            for (var symbolCount = 0; symbolCount < this._reelHeight+2; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1; //strip은 1부터 시작 해서 내림
                var symbolNode = this._symbolPoolManager.getSymbol();
                symbolNode.initSymbol(this._AR, symbolIndex, this._mulSymbolSize);

                symbolNode.setPosition(xPos, this._startPosY + symbolCount * this._symbolHeight);

                layout.addChild(symbolNode, 1);
                this._reelSymbols[reelIndex].push(symbolNode);
            }
        }
    },

    _getStrip(reelIndex) {
        return this.stripData[reelIndex];
    },

    startSpin: function (result) {
        this._eventHandler.dispatchSpinStartEvent();
        this._spinSymbols(result);
    },

    _spinSymbols: function (result) {
        this._spinEndCount = 0;
        this._isReelStop = false;
        this._stripIndex = new Array(this._reelCount).fill(0);
        this._remainingSymbols = this._reelCount * (this._reelHeight*2 + 2);
        this._spinResults = result;
        this._firstLongSpinIndex = this._reelCount+1;

        //전 resultSymbols(결과 심볼 노드) 내리기
        this._beforeresultSymbolsAnimation();

        //resultSymbols 재생성
        this._createresultSymbols();

        //릴 회전
        this.update = (dt) => {
            this._reelUpdate(dt);
        };

        this.scheduleUpdate();
    },

    _reelUpdate: function (dt) {
        var frameIndependentSpeed = this._spinSpeed * dt;

        for (var reelIndex = 0; reelIndex < this._reelSymbols.length; reelIndex++) {
            if (reelIndex < this._spinEndCount) continue; // 중간 건너뛰기

            var symbols = this._reelSymbols[reelIndex];
            var strip = this._getStrip(reelIndex);
            var stripLength = strip.length;
            var stripIndex = this._stripIndex[reelIndex];

            for (var symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
                var symbol = symbols[symbolIndex];

                symbol.setPositionY(symbol.getPositionY() - frameIndependentSpeed);

                if (symbol.getPositionY() <= this._endPosY) {
                    var prevStripIndex = (stripIndex + this._reelHeight + 2) % stripLength;
                    symbol.setSymbol(strip[prevStripIndex] - 1, prevStripIndex);
                    var nextPosY = Math.max(...symbols.map(s => s.getPositionY())) + this._symbolHeight + 10;
                    symbol.setPositionY(nextPosY);
                    stripIndex = (stripIndex + 1) % stripLength;
                    this._stripIndex[reelIndex] = stripIndex;
                }
            }
        }
    },

    _beforeresultSymbolsAnimation: function () {
        if (this._resultSymbols.length > 0) {
            for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
                var symbols = this._resultSymbols[reelIndex];
                var reel = this._reels[reelIndex];
                var xPos = reel.getContentSize().width / 2;

                for (var index = 0; index < symbols.length; index++) {
                    var symbol = symbols[index];

                    var targetY = this._startPosY - (index + 1) * this._symbolHeight;
                    var timeToMove = this._calculateTimeToMove(symbol, targetY);
                    symbol.runAction(cc.sequence(
                        cc.moveTo(timeToMove, cc.p(xPos, targetY)),
                        cc.callFunc(function (symbol) {
                            this._symbolPoolManager.returnSymbol(symbol);
                        }.bind(this, symbol))
                    ));
                }
            }
            this._resultSymbols = [];
        }
    },

    _createresultSymbols : function () {
        this._scatterCount = 0;

        //resultSymbols 초기화 & 생성
        for(var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var spinResult = this._spinResults[reelIndex];
            var strip = this._getStrip(reelIndex);
            var stripLength = strip.length;

            this._resultSymbols[reelIndex] = [];

            for(var index = 0 ; index < this._reelHeight; index++) {
                var stripIndex = (spinResult + index) % stripLength;
                var symbolIndex = strip[stripIndex] - 1;

                var symbol = this._symbolPoolManager.getSymbol();
                if (symbol.getIsNew()) {
                    symbol.initSymbol(this._AR, symbolIndex, this._mulSymbolSize);
                } else {
                    symbol.setSymbol(symbolIndex, stripIndex);
                }

                if(symbolIndex === SymbolType.SCATTER - 1) {
                    this._scatterCount++;
                    if(this._scatterCount === 2) {
                        this._firstLongSpinIndex = reelIndex + 1;
                    }
                }

                this._resultSymbols[reelIndex].push(symbol);
            }
        }
    },

    // 스핀이 순서대로 잘 끝났을 때
    spinEnd: function(delayAdd) {
        var delay = 0;

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            delay += delayAdd;

            if(reelIndex >= this._firstLongSpinIndex){
                delay += delayAdd * 7; // TODO: 임시로 해놓은 수치 바꾸기
            }

            //릴 정지 스케쥴
            this._reelStopSchedules[reelIndex] = ((reelIndex) => () => {

                if(reelIndex === this._firstLongSpinIndex - 1){
                    this._eventHandler.dispatchLongSpinStartEvent();
                }

                this._spinEndCount++;
                this._correctSymbolsPosition(reelIndex, this._spinResults);
            })(reelIndex).bind(this);

            this.scheduleOnce(this._reelStopSchedules[reelIndex], delay);
        }
    },

    // 중간에 STOP해서 멈출 때
    spinStop: function () {
        this._isReelStop = true;

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            if(reelIndex >= this._spinEndCount) {
                this._spinEndCount++;
                this._correctSymbolsPosition(reelIndex, this._spinResults);
                this.unschedule(this._reelStopSchedules[reelIndex]);
                this._reelStopSchedules[reelIndex] = null;
            }
        }
    },

    _setLongSpinEffect: function(reelIndex) {
        var reelNode = this._reels[reelIndex + 1]; // 해당 릴 노드를 가져옴
        if (!reelNode || this._isReelStop) {
            if(this._longSpinEffect)
                this._longSpinEffect.setVisible(false);
            return;
        }

        var worldPos = reelNode.convertToWorldSpaceAR(cc.p(-reelNode.width / 2, -reelNode.height / 2))
        var localPos = this.convertToNodeSpaceAR(worldPos);
        this._longSpinEffect.setPosition(localPos);
        this._longSpinEffect.setVisible(true);
    },

    _correctSymbolsPosition: function (reelIndex, spinResults) {
        var reel = this._reels[reelIndex];
        var layout = reel.layout;
        var xPos = reel.getContentSize().width / 2;
        var spinResult = spinResults[reelIndex];
        var strip = this._getStrip(reelIndex);
        var stripLength = strip.length;
        var symbols = this._reelSymbols[reelIndex];
        var highestY = Math.max(...symbols.map(symbol => symbol.getPositionY()));
        var highestIndex = symbols.findIndex(symbol => symbol.getPositionY() === highestY);
        var spawnPosY = highestY + this._symbolHeight;

        // 심볼 AddChild & 애니메이션
        for(var index = 0 ; index < this._reelHeight; index++){
            var symbol = this._resultSymbols[reelIndex][index];
            symbol.setPosition(cc.p(xPos, spawnPosY + index * this._symbolHeight));
            layout.addChild(symbol);

            //애니메이션
            var targetY = this._startPosY + index * this._symbolHeight;
            var timeToMove = this._calculateTimeToMove(symbol, targetY);

            symbol.runAction(cc.sequence(
                cc.moveTo(timeToMove, cc.p(xPos, targetY)),
                cc.callFunc(function (reelIndex,index){
                    if(index + 1 >= this._reelHeight){
                        if(this._firstLongSpinIndex - 1 <= reelIndex && reelIndex < this._reelCount){
                            this._setLongSpinEffect(reelIndex);
                        }
                    }
                }.bind(this,reelIndex,index)),
                cc.jumpBy(0.25,cc.p(0,0), -10, 1).easing(cc.easeOut(2.0)),
                cc.callFunc(this._checkAllSymbolsStopped.bind(this))
            ));
        }

        //기존 심볼들 애니메이션
        for(var index = 1 ; index <= symbols.length ; index++){
            var symbol = symbols[highestIndex];
            var stripIndex = (spinResult+index+2) % stripLength;

            var targetY = this._startPosY - index * this._symbolHeight;
            var timeToMove = this._calculateTimeToMove(symbol, targetY);

            symbol.runAction(cc.sequence(
                cc.moveTo(timeToMove, cc.p(xPos, targetY)),
                cc.callFunc(function(symbol, index, stripIndex) {
                    var prevStripIndex = (stripIndex + this._reelHeight + 2) % stripLength;
                    symbol.setSymbol(strip[prevStripIndex] - 1, prevStripIndex);
                    var nextPosY = this._startPosY + this._symbolHeight * (index - 1 + this._reelHeight);
                    symbol.setPositionY(nextPosY);
                    stripIndex = (stripIndex + 1) % stripLength;
                    this._stripIndex[reelIndex] = stripIndex;
                }.bind(this, symbol, index, stripIndex)),
                cc.jumpBy(0.25,cc.p(0,0), -10, 1).easing(cc.easeOut(2.0)),
                cc.callFunc(this._checkAllSymbolsStopped.bind(this))
            ));

            highestIndex++;
            highestIndex = highestIndex % symbols.length;
        }
    },

    _calculateTimeToMove : function(symbol, targetY) {
        var distance = Math.abs(symbol.getPositionY() - targetY);
        return distance / this._spinSpeed;
    },

    _checkAllSymbolsStopped: function () {
        this._remainingSymbols--;
        if(this._remainingSymbols <= 0) {
            this.unscheduleUpdate();
            this._getResultSymbols();
        }
    },

    _getResultSymbols: function () {
        this.unschedule(this._reelUpdate);
        this._spinResults = null;

        this._eventHandler.dispatchAllReelsStoppedEvent(this._resultSymbols);
    },

    playSymbolAnimation : function (symbols) {
        symbols.forEach(symbol => {
            symbol.setAnimation("play");
            symbol.setLocalZOrder(2);
        })
    },

    stopSymbolAnimation : function () {
        this._resultSymbols?.forEach((symbols) => {
            symbols.forEach((symbol) => {
                symbol.setAnimation("normal");
                symbol.setLocalZOrder(1);
            })
        })
    }

});
