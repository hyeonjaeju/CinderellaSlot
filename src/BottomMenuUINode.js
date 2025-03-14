BottomMenuUINode = cc.Node.extend({
    ctor: function (gameNode) {
        this._super();
        this._init(gameNode);
    },

    _init: function (gameNode) {
        this._gameNode = gameNode;

        this._initProperties();
        this._initValues();
        this._initUI();
    },

    _initProperties: function () {
        this._bottomMenuUI = null;
        this._btnSpin = null;
        this._btnAutoSpin = null;
        this._lbAutoSpin = null;
        this._autoPanel = null;
        this._autoBtnArray = null;
        this._btnFast = null;
        this._fastOnImg = null;
        this._BMlabel = null;
        this._lbWinReward = null;
        this._pnlGuideMb = null;

        this._spinBtnLong = null;
        this._autoStopSchedule = null;
    },

    _initValues: function () {
        this._spinBtnLong = false;
        this._autoStopSchedule = function () {};
    },

    _initUI: function () {
        this._bottomMenuUI = ccs.uiReader.widgetFromJsonFile(res.BottomMenuUI);
        this.addChild(this._bottomMenuUI);

        this._initSpinButton();
        this._initAutoSpinButton();
        this._initAutoPanel();
        this._initFastButton();
        this._initWinLabels();

        //처음에 가려야 되는 것들
        this._bottomMenuUI.getChildByName("pnlGuide_pad").setVisible(false);
    },

    _onAutoPanelOpen: function () {
        this._autoPanel.setVisible(true);
        this._spinBtnLong = true;
    },

    _initSpinButton: function () {
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
                        this._gameNode._state.onSpin();
                    }
                    return true; // 이벤트 처리 완료
                default:
                    return false;
            }
        }, this);
    },

    _initAutoSpinButton: function () {
        //오토 스핀 버튼
        this._btnAutoSpin = this._bottomMenuUI.getChildByName("imgSpinBase").getChildByName("btnAutoSpin");
        this._btnAutoSpin.setEnabled(false);
        this._btnAutoSpin.setVisible(false);
        this._lbAutoSpin = this._btnAutoSpin.getChildByName("lbAutoSpin");

        this._btnAutoSpin.addTouchEventListener((sender, type) => {
            switch (type) {
                case 0:
                    this._autoSpinBtnLong = false;
                    this.unschedule(this._autoStopSchedule);
                    this._autoStopSchedule = ()=>{
                        this._autoSpinBtnLong = true;
                        this._gameNode._stopAuto();
                    }
                    this.scheduleOnce(this._autoStopSchedule, 0.75);
                    return true; // 터치 시작을 받아들임
                case 2:
                    if(!this._autoSpinBtnLong){
                        this.unschedule(this._autoStopSchedule);
                        this._gameNode._state.onSpin();
                    }
                    return true; // 이벤트 처리 완료
                default:
                    return false;
            }
        }, this);
    },

    _initAutoPanel: function () {
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

            btn.addClickEventListener(()=>{
                this._gameNode._state.startAuto(count, isInfinity);
            });
        }.bind(this))
    },

    _initFastButton: function (){
        //FAST
        this._btnFast = this._bottomMenuUI.getChildByName("btnFast");
        this._btnFast.addClickEventListener(this._gameNode._toggleIsFast.bind(this._gameNode));
        this._fastOnImg = this._btnFast.getChildByName("imgFastOn");
        this._fastOnImg.setVisible(false);
    },

    _initWinLabels: function () {
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
    },

    setSpinButton: function (enable){
        this._btnSpin.setEnabled(enable);
        this._btnSpin.setColor(this._getColor(enable));
    },

    setAutoSpinButton: function (enable, value){
        this._btnAutoSpin.setEnabled(enable);
        this._btnAutoSpin.setColor(this._getColor(enable));
    },

    setValueAutoSpinLB: function (value){
        this._lbAutoSpin.setString(value);
    },

    setActiveAutoSpinButton: function (active){
        this._btnAutoSpin.setEnabled(active);
        this._btnAutoSpin.setVisible(active);
    },

    _getColor: function (enable){
        return  enable ? cc.color(255, 255, 255) : cc.color(128, 128, 128);
    },

    setAutoPanel: function (enable){
        this._autoPanel.setVisible(enable);
    },

    toggleIsFast : function () {
        this._isFast = !this._isFast;
        this._fastOnImg.setVisible(this._isFast);
    },

    setBMLabel: function (visible, value) {
        this._BMlabel.setVisible(visible);
        if(value){ this._BMlabel.setString(value); }
    },

    setWinRewardLabel: function (visible, value) {
        this._lbWinReward.setVisible(true);
        if(value) { this._lbWinReward.setString(value); }
    }
})