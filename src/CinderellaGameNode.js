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
        this._background = null;
        this._bottomMenuUI = null;
        this._btnSpin = null;
        this._btnFast = null;
        this._fastOnImg = null;
        this._lbWinReward = null;
        this._pnlGuideMb = null;

        this._reelsNode = null;
        this._data = null;
        this._stripData = null;
        this._payouts = null;

        this._isSpinning = null;
        this._isFast = null;
        this._resultDelay = null;
    },

    _initValues: function () {
        this._data = cc.loader.getRes("res/data.json"); // JSON 가져오기

        if (this._data) {
            this._stripData = this._data.strip; // strip 배열 가져오기
            this._payouts = this._data.payout;
            cc.log(this._payouts);
        } else {
            cc.log("JSON 데이터를 찾을 수 없습니다.");
        }

        this._isSpinning = false;
        this._isFast = false;
        this._resultDelay = 0.5;
    },

    _initUI: function () {
        this._background = ccs.uiReader.widgetFromJsonFile( res.NormalReelBack );
        this.addChild( this._background );

        this._bottomMenuUI = ccs.uiReader.widgetFromJsonFile( res.BottomMenuUI );
        this.addChild( this._bottomMenuUI );

        this._btnSpin = this._bottomMenuUI.getChildByName("imgSpinBase").getChildByName("btnSpin");
        this._btnSpin.addClickEventListener(this._onSpin.bind(this));

        this._bottomMenuUI.getChildByName("imgAutoBase").setVisible(false);

        this._btnFast = this._bottomMenuUI.getChildByName("btnFast");
        this._btnFast.addClickEventListener(this._toggleIsFast.bind(this));
        this._fastOnImg = this._btnFast.getChildByName("imgFastOn");
        this._fastOnImg.setVisible(false);

        this._lbWinReward = this._bottomMenuUI.getChildByName("lbWinReward");
        this._lbWinReward.setVisible(false);

        this._pnlGuideMb = this._bottomMenuUI.getChildByName("pnlGuide_mb");
        this._pnlGuideMb.setVisible(false);

        this._bottomMenuUI.getChildByName("pnlGuide_pad").setVisible(false);

        //릴 관리 노드 생성
        var normalReelBack = this._background.getChildByName("imgBg").getChildByName("nodeReelBack");
        this._reelsNode = new CinderellaReelsNode(normalReelBack, this._stripData);
        this.addChild( this._reelsNode );

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

    _onSpin : function (){
        if(this._isSpinning){
            this._spinStop();
            return;
        }

        var rand = [];
        var max = this._stripData[0].length - 1;
        for (var count = 0; count < 5; count++) {
            rand.push(Math.random() * max | 0);
        }

        this._reelsNode.startSpin();
        this._spin(rand);
    },

    _spin : function (result){
        this._reelsNode.spinEnd(result, this._resultDelay, this.setisSpinning.bind(this, false));
        this.setisSpinning(true);
    },

    _spinStop : function () {
        this._reelsNode.spinStop();
        this.setisSpinning(false);
    },

    setisSpinning : function (isSpinning) {
        this._isSpinning = isSpinning;
    },

    _toggleIsFast : function () {
        if(this._isFast){
            this._isFast = false;
            this._resultDelay = 0.5;
            this._fastOnImg.setVisible(false);
        }
        else{
            this._isFast = true;
            this._resultDelay = 0.25;
            this._fastOnImg.setVisible(true);
        }
    }
})