CinderellaGameNode = cc.Node.extend({
    ctor: function () {
        this._super();
        this._init();
    },

    _init: function () {
        this._initProperties();
        this._initValues();
        this._initUI();
        this._setState(this._idleState);
    },

    _initProperties: function () {
        this._state = null;
        this._idleState = new IdleState(this);
        this._spinningState = new SpinningState(this);
        this._resultState = new ResultState(this);


        this._background= null;
        this._bottomMenuUINode = null;
        this._reelsNode = null;

        //data
        this._data = null;
        this._stripData = null;
        this._payoutsData = null;
        this._payouts = null;
        this._payLinesData = null;

        this._autoCount = null;
        this._autoInfinity = null
        this._isFast = null;
        this._resultDelay = null;
        this._resultDelayFast = null;
    },

    _initValues: function () {
        this._data = cc.loader.getRes("res/data.json"); // JSON 가져오기

        if (this._data) {
            this._stripData = this._data.strip; // strip 배열 가져오기
            this._payoutsData = this._data.payout;
            this._payouts = Object.values(this._payoutsData);
            this._payLinesData = this._data.payLines;
        } else {
            cc.log("JSON 데이터를 찾을 수 없습니다.");
        }

        this._autoCount = 0;
        this._autoInfinity = false;

        this._isFast = false;
        this._resultDelay = GameSettings.STOP_DELAY;
        this._resultDelayFast = GameSettings.STOP_DELAY_FAST;
    },

    _initUI: function () {
        this._initBackground();
        this._initReels();

        this._initBottomMenu();
    },

    _initBackground: function () {
        this._background = ccs.uiReader.widgetFromJsonFile(res.NormalReelBack);
        this.addChild(this._background);
    },

    _initBottomMenu: function () {
        this._bottomMenuUINode = new BottomMenuUINode(this);
        this.addChild(this._bottomMenuUINode);
    },

    _initReels: function () {
        var normalReelBack = this._background.getChildByName("imgBg").getChildByName("nodeReelBack");
        this._reelsNode = new CinderellaReelsNode(normalReelBack, this._stripData);

        cc.eventManager.addCustomListener(ReelEvents.SPIN_START, this.onReelSpinStart.bind(this));
        cc.eventManager.addCustomListener(ReelEvents.ALL_REELS_STOPPED, this.calcPayout.bind(this));
        cc.eventManager.addCustomListener(ReelEvents.LONG_SPIN_START, this.onLongSpinStart.bind(this));


        this.addChild( this._reelsNode );
    },

    _setState: function (newState) {
        if (this._state) this._state.exit();
        this._state = newState;
        this._state.enter();
    },

    onReelSpinStart:function (){
        this._setEnableSpin(false);
    },

    onLongSpinStart : function (){
        this._setEnableSpin(false);
    },

    _startAuto: function (count, isInfinity){
        this._bottomMenuUINode.setAutoPanel(false);
        this._autoCount = count;
        this._autoInfinity = isInfinity;
        this._bottomMenuUINode.setActiveAutoSpinButton(true);
        this._useAuto();
    },

    _stopAuto: function () {
        this._autoCount = 0;
        this._autoInfinity = false;
        this._bottomMenuUINode.setActiveAutoSpinButton(false);
    },

    _useAuto : function () {
        if(this._autoInfinity){
            this._state.onSpin();
            return;
        }

        if(this._autoCount <= 0){
            this._bottomMenuUINode.setActiveAutoSpinButton(false);
            return;
        }

        this._autoCount--;
        this._bottomMenuUINode.setValueAutoSpinLB(this._autoCount);
        this._state.onSpin();
    },

    _onSpin : function (){
        this._reelsNode.stopSymbolAnimation();

        //임시로 5개 고정
        var rand = [];
        var max = this._stripData[0].length - 1;
        for (var count = 0; count < 5; count++) {
            rand.push(Math.random() * max | 0);
        }

        this._spin(rand);
    },

    _spin : function (result){
        this._bottomMenuUINode.setBMLabel(false);
        this._setState(this._spinningState);
        this._reelsNode.startSpin(result);

        //스핀 종료 딜레이 스케쥴
        var delay = this._resultDelay;
        if(this._isFast) {delay = this._resultDelayFast;}

        this.scheduleOnce(function() {
            this._reelsNode.spinEnd(delay);
            this._setEnableSpin(true);
        }, 0.3);
    },

    _spinStop : function () {
        this._setEnableSpin(false);
        this._reelsNode.spinStop();
    },

    _setEnableSpin : function (enable) {
        this._bottomMenuUINode.setSpinButton(enable);
        this._bottomMenuUINode.setAutoSpinButton(enable);
    },

    _toggleIsFast : function () {
        this._isFast = !this._isFast;
        this._bottomMenuUINode.setFastButton(this._isFast);
    },

    calcPayout : function (data) {
        var resultSymbols = data.resultSymbols;
        var highestPayout = 0;
        var highestIndex = 0;

        { // HAVE NOT PAYLINE
            var result = new Array(GameSettings.AR_TOTAL_COUNT).fill(0);

            for (var reelIndex = 0; reelIndex < GameSettings.REEL_COUNT; reelIndex++) {
                for (var index = 0; index < GameSettings.REEL_HEIGHT; index++) {
                    var resultIndex = resultSymbols[reelIndex][index].getSymbolNum();
                    result[resultIndex]++;
                }
            }

            for (var index = 0; index < result.length; index++) {
                var payout = result[index] * this._payouts[index];
                if (payout > highestPayout) {
                    highestPayout = payout;
                    highestIndex = index;
                }
            }

            this._reelsNode.playSymbolAnimation(highestIndex);
            this._showPayout(highestIndex, highestPayout);
        }

        { // HAVE PAYLINE
            var resultSymbols = this.convertReelsToRows(data.resultSymbols);


        }
    },

    convertReelsToRows: function(reels) {
        var rows = [];
        if (reels.length === 0) return rows;

        var rowCount = reels[0].length; // 릴 하나의 심볼 개수 (세로줄 길이 기준)

        for (var row = 0; row < rowCount; row++) {
            var rowData = [];
            for (var reel = 0; reel < reels.length; reel++) {
                rowData.push(reels[reel][row]);
            }
            rows.push(rowData);
        }
        return rows;
    },

    _showPayout : function (highestIndex, highestPayout) {
        // 숫자가 점차적으로 늘어나는 애니메이션
        var targetNumber = highestPayout; // 목표 숫자 (변경하려는 최종 숫자)
        var step = 25;
        this._setState(this._resultState);

        var currentNumber = 0;
        var updateNumber = function () {
            if (currentNumber < targetNumber) {
                currentNumber += step;
                if (currentNumber > targetNumber) currentNumber = targetNumber; // 목표 숫자 초과 방지
                this._bottomMenuUINode.setBMLabel(true, currentNumber.toString());// 숫자 갱신
            } else {
                this.unschedule(updateNumber); // 애니메이션 종료
                this._bottomMenuUINode.setWinRewardLabel(true, targetNumber);

                this._setState(this._idleState);
                this._useAuto();
            }
        }.bind(this);

        this.schedule(updateNumber, 1 / 60); // 1/60초마다 updateNumber 호출
    }
    
})