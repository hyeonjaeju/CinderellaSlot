CinderellaGameNode = cc.Node.extend({
    ctor: function () {
        this._super();
        this._init();
    },

    _init: function () {
        this._initProperties();
        this._initValues();
        this._initUI();
    },

    _initProperties: function () {
        this._state = null;

        this._background = null;
        this._bottomMenuUI = null;
        this._btnSpin = null;
        this._btnAutoSpin = null;
        this._autoPanel = null;
        this._autoBtnArray = null;
        this._btnFast = null;
        this._fastOnImg = null;
        this._lbWinReward = null;
        this._pnlGuideMb = null;

        this._autoCount = null;
        this._autoInfinity = null;

        this._reelsNode = null;
        this._data = null;
        this._stripData = null;
        this._payoutsData = null;
        this._payouts = null;

        this._isSpinning = null;
        this._isFast = null;
        this._resultDelay = null;
        this._resultDelayFast = null;
        this._spinBtnLong = null;
    },

    _initValues: function () {
        this._data = cc.loader.getRes("res/data.json"); // JSON 가져오기

        if (this._data) {
            this._stripData = this._data.strip; // strip 배열 가져오기
            this._payoutsData = this._data.payout;
            this._payouts = Object.values(this._payoutsData);
        } else {
            cc.log("JSON 데이터를 찾을 수 없습니다.");
        }

        this._autoCount = 0;
        this._autoInfinity = false;

        this._isSpinning = false;
        this._isFast = false;
        this._resultDelay = 0.25;
        this._resultDelayFast = 0.15;
    },

    _initUI: function () {
        this._initBackground();
        this._initBottomMenu();
        this._initReels();
    },

    _initBackground: function () {
        this._background = ccs.uiReader.widgetFromJsonFile(res.NormalReelBack);
        this.addChild(this._background);
    },

    _initBottomMenu: function () {
        this._bottomMenuUI = ccs.uiReader.widgetFromJsonFile(res.BottomMenuUI);
        this.addChild(this._bottomMenuUI);

        //스핀 버튼
        this._btnSpin = this._bottomMenuUI.getChildByName("imgSpinBase").getChildByName("btnSpin");

        this._btnSpin.addTouchEventListener((sender, type) => {
            switch (type) {
                case 0:
                    this._spinBtnLong = false;
                    this._autoPanel.setVisible(false);
                    this.scheduleOnce(this._onAutoPanelOpen, 0.75);
                    return true; // 터치 시작을 받아들임
                case 2:
                    if(!this._spinBtnLong){
                        this.unschedule(this._onAutoPanelOpen);
                        this._onSpin();
                    }
                    return true; // 이벤트 처리 완료
                default:
                    return false;
            }
        }, this);

        //오토 스핀 버튼
        this._btnAutoSpin = this._bottomMenuUI.getChildByName("imgSpinBase").getChildByName("btnAutoSpin");
        this._btnAutoSpin.setEnabled(false);
        this._btnAutoSpin.setVisible(false);
        this._lbAutoSpin = this._btnAutoSpin.getChildByName("lbAutoSpin");

        this._btnAutoSpin.addTouchEventListener((sender, type) => {
            switch (type) {
                case 0:
                    this._spinBtnLong = true;
                    this._autoPanel.setVisible(false);
                    this.scheduleOnce(this._stopAuto, 0.75);
                    return true; // 터치 시작을 받아들임
                case 2:
                    if(this._spinBtnLong){
                        this.unschedule(this._stopAuto);
                    }
                    return true; // 이벤트 처리 완료
                default:
                    return false;
            }
        }, this);

        //오토 패널
        this._autoPanel = this._bottomMenuUI.getChildByName("imgAutoBase");
        this._autoPanel.setVisible(false);
        this._autoBtnArray = this._autoPanel.getChildren();
        this._autoBtnArray.forEach(function (btn, index) {
            var labelText = null;
            if(index !== this._autoBtnArray.length - 1)
                labelText = btn.getChildren()[0].getString();  // 라벨의 텍스트 가져오기

            var count = 0;
            if(labelText !== null)
                count = parseInt(labelText);

            var isInfinity = count <= 0;

            btn.addClickEventListener(this._startAuto.bind(this, count, isInfinity));
        }.bind(this))

        //FAST
        this._btnFast = this._bottomMenuUI.getChildByName("btnFast");
        this._btnFast.addClickEventListener(this._toggleIsFast.bind(this));
        this._fastOnImg = this._btnFast.getChildByName("imgFastOn");
        this._fastOnImg.setVisible(false);
        //WIN
        this._lbWinReward = this._bottomMenuUI.getChildByName("lbWinReward");
        this._lbWinReward.setVisible(false);
        //WIN_MB
        this._pnlGuideMb = this._bottomMenuUI.getChildByName("pnlGuide_mb");
        this._pnlGuideMb.setVisible(false);
        // BMFont 레이블 생성
        this._BMlabel = new cc.LabelBMFont(0, res.BMFont);
        this._BMlabel.setPosition(this._pnlGuideMb.getPosition());
        this._BMlabel.setVisible(false);
        this.addChild(this._BMlabel);

        //처음에 가려야 되는 것들
        this._bottomMenuUI.getChildByName("pnlGuide_pad").setVisible(false);

        /*//노드의 자식 계층구조를 보기위한 함수
        function printChildren(node, depth = 0) {
            if (!node) return;

            var prefix = " ".repeat(depth * 2); // 계층 깊이에 따라 들여쓰기 추가
            cc.log(prefix + "- " + node.getName());

            var children = node.getChildren();
            children.forEach(function(child) {
                printChildren(child, depth + 1); // 재귀 호출
            });
        }

        // 바텀 메뉴 UI의 전체 구조 출력
        cc.log("=== 전체 구조 ===");
        printChildren(this._bottomMenuUI);*/
    },

    _initReels: function () {
        var normalReelBack = this._background.getChildByName("imgBg").getChildByName("nodeReelBack");
        this._reelsNode = new CinderellaReelsNode(normalReelBack, this._stripData);

        this._reelsNode.on(ReelEvents.SPIN_START, this.onReelSpinStart, this);
        this._reelsNode.on(ReelEvents.ALL_REELS_STOPPED, this.calPayout, this);

        this.addChild( this._reelsNode );
    },

    onReelSpinStart:function (){
        this._setEnableSpin(false);
    },

    _onAutoPanelOpen: function () {
        this._autoPanel.setVisible(true);
        this._spinBtnLong = true;
    },

    _startAuto: function (count, isInfinity){
        if(this._isSpinning) { return; }

        this._autoPanel.setVisible(false);
        this._autoCount = count;
        this._autoInfinity = isInfinity;
        this._lbAutoSpin.setString(this._autoCount);
        this._btnAutoSpin.setEnabled(true);
        this._btnAutoSpin.setVisible(true);
        this._useAuto();
    },

    _stopAuto: function () {
        this._autoCount = 0;
        this._autoInfinity = false;
        this._btnAutoSpin.setEnabled(false);
        this._btnAutoSpin.setVisible(false);
    },

    _useAuto : function () {
        if(this._autoInfinity){
            this._onSpin();
            return;
        }

        if(this._autoCount <= 0){
            this._btnAutoSpin.setEnabled(false);
            this._btnAutoSpin.setVisible(false);
            return;
        }

        this._autoCount--;
        this._lbAutoSpin.setString(this._autoCount);
        this._onSpin();
    },

    _onSpin : function (){
        if(this._isSpinning){
            this._spinStop();
            return;
        }

        this._reelsNode.stopSymbolAnimation();

        //임시로 5개 고정
        var rand = [];
        var max = this._stripData[0].length - 1;
        for (var count = 0; count < 5; count++) {
            rand.push(Math.random() * max | 0);
        }

        this._reelsNode.startSpin();
        this._spin(rand);
    },

    _spin : function (result){
        var delay = this._resultDelay;
        if(this._isFast) {delay = this._resultDelayFast;}
        this.scheduleOnce(function() {
            this._reelsNode.spinEnd(result, delay);
            this._setIsSpinning(true);
            this._setEnableSpin(true);
        }, 0.3);  // 두 번째 인자는 딜레이 시간(초 단위)
    },

    _spinStop : function () {
        this._reelsNode.spinStop();
        this._setIsSpinning(false);
        this._setEnableSpin(false);
    },

    _setEnableSpin : function (enable) {
        this._btnSpin.setEnabled(enable);
        this._btnSpin.setOpacity(enable ? 255 : 128);
    },

    _setIsSpinning : function (isSpinning) {
        this._isSpinning = isSpinning;
    },

    _toggleIsFast : function () {
        this._isFast = !this._isFast;
        this._fastOnImg.setVisible(this._isFast);
    },

    calPayout : function (resultSymbols) {
        var highestPayout = 0;
        var highestIndex = 0;

        for(var index = 0; index < resultSymbols.length; index++) {
            var payout = resultSymbols[index] * this._payouts[index];
            if(payout > highestPayout){
                highestPayout = payout;
                highestIndex = index;
            }
        }

        this._reelsNode.playSymbolAnimation(highestIndex);
        this._showPayout(highestIndex, highestPayout);
    },

    _showPayout : function (highestIndex, highestPayout) {
        this._BMlabel.setVisible(true);

        // 숫자가 점차적으로 늘어나는 애니메이션
        var targetNumber = highestPayout; // 목표 숫자 (변경하려는 최종 숫자)
        var step = 25;

        var currentNumber = 0;
        var updateNumber = function () {
            if (currentNumber < targetNumber) {
                currentNumber += step;
                if (currentNumber > targetNumber) currentNumber = targetNumber; // 목표 숫자 초과 방지
                this._BMlabel.setString(currentNumber.toString()); // 숫자 갱신
            } else {
                this.unschedule(updateNumber); // 애니메이션 종료
                this._lbWinReward.setString(targetNumber);
                this._lbWinReward.setVisible(true);

                //버튼 클릭 활성화
                this._setEnableSpin(true);
                this._setIsSpinning(false);
                this._useAuto();
            }
        }.bind(this);

        this.schedule(updateNumber, 1 / 60); // 1/60초마다 updateNumber 호출
    }
})