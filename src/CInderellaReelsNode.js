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
        this._symbolPoolManager = null;

        this._AR = null;
        this._ARTotal = null;
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
        this._spinResults = null;
        this._reelStopSchedules = null;
        this._visualSymbols = null;

        this._spinEndCount = null;
        this._stripIndex = null;
        this._remainingSymbols = null;
        this._scatterCount = null;
        this._firstLongSpinIndex = null;

        this._spinStartEvent = null;
        this._allReelsStoppedEvent = null;
    },

    _initValues: function (stripData) {
        this._AR = [];
        this._ARTotal = 6; // 심볼이 총 몇 개인지
        this.stripData = stripData;
        this._reelCount = 0;
        this._reelHeight = 3; // 릴의 세로 길이(한번에 보이는 심볼의 수)
        this._reelSymbols = [];
        this._symbolHeight = GameSettings.SYMBOL_HEIGHT; // 심볼 간격 포함 높이
        this._spinSpeed  = GameSettings.SPIN_SPEED; // 스크롤 속도 (값이 클수록 빠름)
        this._mulSymbolSize = 1; //슬롯 사이즈랑 안맞을 때 변경
        this._startPosY = 60;
        this._endPosY = this._startPosY - this._symbolHeight;
        this._reelStopSchedules = [];
        this._visualSymbols = [];

        this._spinEndCount = 0;
        this._scatterCount = 0;
        this._firstLongSpinIndex = this._reelCount+1;

        this._spinStartEvent = new cc.EventCustom(ReelEvents.SPIN_START);
        this._allReelsStoppedEvent = new cc.EventCustom(ReelEvents.ALL_REELS_STOPPED);
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
    },

    _initSymbols: function () {
        // Armature 리소스 로드
        for (var i = 0; i < this._ARTotal; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
            this._AR.push("sl_symbolAR0" + (i + 1));
        }

        //심볼 풀링매니저 생성
        this._symbolPoolManager = new SymbolPoolManager(SymbolNode);

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var reel = this._reels[reelIndex];
            var xPos = reel.getContentSize().width / 2;
            var layout = reel.layout;
            var strip = this._getStrip(reelIndex);

            for (var symbolCount = 0; symbolCount < this._reelHeight+2; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1; //strip은 1부터 시작 해서 내림
                var symbolNode = this._symbolPoolManager.getSymbol();
                symbolNode.initSymbol(this._AR, symbolIndex, this._mulSymbolSize, symbolCount);

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
        cc.eventManager.dispatchEvent(this._spinStartEvent);
        this._spinSymbols(result);
    },

    _spinSymbols: function (result) {
        this._spinEndCount = 0;
        this._stripIndex = new Array(this._reelCount).fill(0);
        this._remainingSymbols = this._reelCount * (this._reelHeight*2 + 2);
        this._spinResults = result;
        this._firstLongSpinIndex = this._reelCount+1;

        //전 VisualSymbols(결과 심볼 노드) 내리기
        this._beforeVisualSymbolsAnimation();

        //VisualSymbols 재생성
        this._createVisualSymbols();

        //릴 회전
        this.update = (dt) => {
            this._reelUpdate(dt);
        };

        this.scheduleUpdate();
    },

    _reelUpdate: function (dt) {
        // dt를 사용하여 프레임 독립적인 이동 거리 계산
        var frameIndependentSpeed = this._spinSpeed * dt;

        this._reelSymbols.forEach((symbols, reelIndex) => {
            if (reelIndex < this._spinEndCount) return;

            var strip = this._getStrip(reelIndex);
            var stripLength = strip.length;
            var stripIndex = this._stripIndex[reelIndex];

            symbols.forEach(symbol => {
                // dt를 이용한 이동 거리 계산으로 프레임 독립적인 움직임 구현
                symbol.setPositionY(symbol.getPositionY() - frameIndependentSpeed);

                if (symbol.getPositionY() <= this._endPosY) {
                    var prevStripIndex = (stripIndex + this._reelHeight + 2) % stripLength;
                    symbol.setSymbol(strip[prevStripIndex] - 1, prevStripIndex);
                    var nextPosY = Math.max(...symbols.map(s => s.getPositionY())) + this._symbolHeight + 10;
                    symbol.setPositionY(nextPosY);
                    stripIndex = (stripIndex + 1) % stripLength;
                    this._stripIndex[reelIndex] = stripIndex;
                }
            });
        });
    },

    _beforeVisualSymbolsAnimation: function () {
        if (this._visualSymbols.length > 0) {
            for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
                var symbols = this._visualSymbols[reelIndex];
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
            this._visualSymbols = [];
        }
    },

    _createVisualSymbols : function () {
        this._scatterCount = 0;

        //VisualSymbols 초기화 & 생성
        for(var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            var spinResult = this._spinResults[reelIndex];
            var strip = this._getStrip(reelIndex);
            var stripLength = strip.length;

            this._visualSymbols[reelIndex] = [];

            for(var index = 0 ; index < this._reelHeight; index++) {
                var stripIndex = (spinResult + index) % stripLength;
                var symbolIndex = strip[stripIndex] - 1;

                var symbol = this._symbolPoolManager.getSymbol();
                if (symbol.getIsNew()) {
                    symbol.initSymbol(this._AR, symbolIndex, this._mulSymbolSize, stripIndex);
                } else {
                    symbol.setSymbol(symbolIndex, stripIndex);
                }

                if(symbolIndex === SymbolType.SCATTER - 1) {
                    this._scatterCount++;
                    if(this._scatterCount === 2) {
                        this._firstLongSpinIndex = reelIndex + 1;
                    }
                }

                this._visualSymbols[reelIndex].push(symbol);
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
                this._spinEndCount++;
                this._correctSymbolsPosition(reelIndex, this._spinResults);
            })(reelIndex).bind(this);

            this.scheduleOnce(this._reelStopSchedules[reelIndex], delay);
        }
    },

    // 중간에 STOP해서 멈출 때
    spinStop: function () {
        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            if(reelIndex >= this._spinEndCount) {
                this._spinEndCount++;
                this._correctSymbolsPosition(reelIndex, this._spinResults);
                this.unschedule(this._reelStopSchedules[reelIndex]);
                this._reelStopSchedules[reelIndex] = null;
            }
        }
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
            var symbol = this._visualSymbols[reelIndex][index];
            symbol.setPosition(cc.p(xPos, spawnPosY + index * this._symbolHeight));
            layout.addChild(symbol);

            //애니메이션
            var targetY = this._startPosY + index * this._symbolHeight;
            var timeToMove = this._calculateTimeToMove(symbol, targetY);

            symbol.runAction(cc.sequence(
                cc.moveTo(timeToMove, cc.p(xPos, targetY)),
                cc.jumpBy(0.1,cc.p(0,0), -10, 1),
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
                cc.jumpBy(0.1,cc.p(0,0), -10, 1),
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
        var resultSymbols = new Array(this._AR.length).fill(0);

        for (var reelIndex = 0; reelIndex < this._reelCount; reelIndex++) {
            for(var index= 0 ; index < this._reelHeight; index++){
                var resultIndex = this._visualSymbols[reelIndex][index].getSymbolNum();
                resultSymbols[resultIndex]++;
            }
        }

        this.unschedule(this._reelUpdate);
        this._spinResults = null;

        this._allReelsStoppedEvent.resultSymbols = resultSymbols;
        cc.eventManager.dispatchEvent(this._allReelsStoppedEvent);
    },

    playSymbolAnimation : function (targetSymbolNum) {
        this._visualSymbols?.forEach((symbols) => {
            symbols.forEach((symbol) => {
                if(symbol.getSymbolNum() === targetSymbolNum){
                    symbol.setAnimation("play");
                }
            })
        })
    },

    stopSymbolAnimation : function () {
        this._visualSymbols?.forEach((symbols) => {
            symbols.forEach((symbol) => {
                symbol.setAnimation("normal");
            })
        })
    }

});
