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
        this._symbolNodes = [];
        this._symbolHeight = 120; // 심볼 간격 포함 높이
        this._scrollSpeed = 30; // 스크롤 속도 (값이 클수록 빠름)
        this._isScrolling = true; // 스크롤 여부
    },

    _initValues: function (stripData) {
        this.AR = ["sl_symbolAR01", "sl_symbolAR02", "sl_symbolAR03", "sl_symbolAR04", "sl_symbolAR05", "sl_symbolAR06"];
        this.stripData = stripData;
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
            var layout = this._reels[reelIndex].layout;

            for (var symbolCount = 0; symbolCount < this.stripData[reelIndex].length; symbolCount++) {
                var symbolIndex = this.stripData[reelIndex][symbolCount] - 1;
                var symbolNode = new SymbolNode();
                symbolNode.setSymbol(this.AR, symbolIndex);

                // 심볼 위치 설정 (간격 포함)
                var startY = this._reels[reelIndex].getContentSize().height;
                symbolNode.setPosition(
                    this._reels[reelIndex].getContentSize().width / 2,
                    startY - symbolCount * this._symbolHeight
                );

                layout.addChild(symbolNode, 1);
                this._symbolNodes[reelIndex].push(symbolNode);
            }
        }
    },

    startScrolling: function () {
        for (var reelIndex = 0; reelIndex < this._reels.length; reelIndex++) {
            this._scrollSymbols(reelIndex);
        }
    },

    _scrollSymbols: function (reelIndex) {
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

        this.schedule(update, 1 / 144); // 매 프레임 업데이트
    },

    spinEnd: function(result) {
        // 예시: stopIndex는 result 값에 따라 설정됨
        var stopIndex = result; // 또는 원하는 로직에 맞게 설정

        // 1초 후에 스케줄로 stopAtTargetPosition 호출
        this.scheduleOnce(function() {
            if (stopIndex !== undefined && stopIndex !== null) {
                this._stopAtTargetPosition(stopIndex);
            } else {
                console.error("stopIndex가 정의되지 않았습니다!");
            }
        }, 1); // 1초 후 호출
    },

    _stopAtTargetPosition: function(stopIndex) {
        if (stopIndex < this._symbolNodes.length) {
            var symbols = this._symbolNodes[stopIndex];
            var targetPosition = 0; // 예시: 목표 위치는 0으로 설정

            // 목표 위치로 스크롤 멈추기
            var updateStop = function() {
                if (symbols[0].y <= targetPosition) {
                    this.unschedule(updateStop); // 업데이트 중지
                } else {
                    symbols.forEach(function(symbol) {
                        symbol.y -= 5; // 스크롤 속도 설정 (조정 필요)
                    });
                }
            }.bind(this);

            this.schedule(updateStop, 1 / 60); // 매 프레임마다 업데이트
        } else {
            console.error("잘못된 stopIndex:", stopIndex);
        }
    }

});
