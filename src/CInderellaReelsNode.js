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
        this.AR = null;
        this.stripData = null;
        this._normalReelBack = null;
        this._reels = null;
        this._symbolNodes = null;
        this._symbolHeight = null;
        this._scrollSpeed = null;
        this._mulSymbolSize = null;
        this._startPosY = null;
        this._reelUpdates = null;
    },

    _initValues: function (stripData) {
        this.AR = ["sl_symbolAR01", "sl_symbolAR02", "sl_symbolAR03", "sl_symbolAR04", "sl_symbolAR05", "sl_symbolAR06"];
        this.stripData = stripData;
        this._symbolNodes = [];
        this._symbolHeight = 105; // 심볼 간격 포함 높이
        this._scrollSpeed = 30; // 스크롤 속도 (값이 클수록 빠름)
        this._mulSymbolSize = 0.8; //슬롯 사이즈랑 안맞을 때 변경
        this._startPosY = 270;
        this._reelUpdates = [];
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
        for (var i = 0; i < this.AR.length; i++) {
            ccs.armatureDataManager.addArmatureFileInfo(res["symbolAR0" + (i + 1)]);
        }
    },

    _initSymbols: function () {
        for (var reelIndex = 0; reelIndex < this.stripData.length; reelIndex++) {
            var reel = this._reels[reelIndex];
            var layout = reel.layout;
            var strip = this.stripData[reelIndex];

            for (var symbolCount = 0; symbolCount < strip.length; symbolCount++) {
                var symbolIndex = strip[symbolCount] - 1;
                var symbolNode = new SymbolNode();
                symbolNode.setSymbol(this.AR, symbolIndex, this._mulSymbolSize);

                symbolNode.setPosition(
                    reel.getContentSize().width / 2,
                    this._startPosY - symbolCount * this._symbolHeight
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

        var update = function () {
            var maxY = Math.max.apply(
                Math,
                symbols.map(s => s.y)
            ); // 현재 가장 높은 심볼의 Y 좌표

            for (var i = 0; i < symbols.length; i++) {
                var symbol = symbols[i];
                symbol.y -= this._scrollSpeed;

                // 클리핑 영역을 벗어나면 정확한 간격을 유지하며 맨 위로 이동
                if (symbol.y < -this._symbolHeight) {
                    symbol.y = maxY + this._symbolHeight;
                    maxY = symbol.y; // 새로운 최상단 위치 업데이트
                }
            }
        }.bind(this);

        // 릴별 업데이트를 저장하고 실행
        this._reelUpdates[reelIndex] = update;
        this.schedule(update, 1 / 144);
    },

    spinEnd: function(result) {
        var spinResults = result; // 또는 원하는 로직에 맞게 설정

        // 1초 후에 스케줄로 stopAtTargetPosition 호출
        this.scheduleOnce(function() {
            if (spinResults !== undefined && spinResults !== null) {
                this._stopAtTargetPosition(spinResults);
            } else {
                console.error("stopIndex가 정의되지 않았습니다!");
            }
        }, 1); // 1초 후 호출
    },

    _stopAtTargetPosition: function(spinResults) {
        cc.log(spinResults);
        cc.log(this._reels.length);
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            cc.log(reelIndex);
            var stopIndex = spinResults[reelIndex];
            if (spinResults[reelIndex] < this._symbolNodes[reelIndex].length) {
                var targetSymbol = this._symbolNodes[reelIndex][stopIndex];
                var targetPosition = this._startPosY - 2 * this._symbolHeight; // 예시: 목표 위치는 0으로 설정

                // 목표 위치로 스크롤 멈추기
                var updateStop = function(targetSymbol, targetPosition) {
                    return function() {
                        if (Math.abs(targetSymbol.getPosition().y - targetPosition) < 1) {
                            cc.log(reelIndex);
                            this.unschedule(this._reelUpdates[reelIndex]);
                            //this.unschedule(updateStop); // 업데이트 중지
                        }
                    }.bind(this);
                }(targetSymbol, targetPosition,reelIndex); // 즉시 실행 함수로 값을 넘겨줌

                this.schedule(updateStop, 1 / 144); // 매 프레임마다 업데이트
            } else {
                console.error("잘못된 stopIndex:", stopIndex);
            }
        }
    }

});
