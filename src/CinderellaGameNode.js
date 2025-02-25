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
        this._reelsNode = null;
        this._Data = null;
        this._stripData = null;
    },

    _initValues: function () {
        this._Data = cc.loader.getRes("res/data.json"); // JSON 가져오기

        if (this._Data) {
            this._stripData = this._Data.strip; // strip 배열 가져오기
        } else {
            cc.log("JSON 데이터를 찾을 수 없습니다.");
        }
    },

    _initUI: function () {
        this._background = ccs.uiReader.widgetFromJsonFile( res.NormalReelBack );
        this.addChild( this._background );

        this._bottomMenuUI = ccs.uiReader.widgetFromJsonFile( res.BottomMenuUI );
        this.addChild( this._bottomMenuUI );

        this._btnSpin = this._bottomMenuUI.getChildByName("imgSpinBase").getChildByName("btnSpin");
        this._btnSpin.addClickEventListener(this._onSpin.bind(this));

        this._bottomMenuUI.getChildByName("imgAutoBase").setVisible(false);

        //릴 관리 노드 생성
        var normalReelBack = this._background.getChildByName("imgBg").getChildByName("nodeReelBack");
        this._reelsNode = new CinderellaReelsNode(normalReelBack, this._stripData);
        this.addChild( this._reelsNode );

        //노드의 자식 계층구조를 보기위한 함수
        /*function printChildren(node, depth = 0) {
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
        printChildren(this._normalReelBackUI);*/
    },

    _onSpin : function (){
        var rand = [];
        for (var count = 0; count < 5; count++) {
            rand.push(Math.random() * 59 | 0);
        }

        var randResult = [];
        for (var index = 0; index < 5; index++) {
            randResult.push(this._stripData[index][rand[index]]);
        }

        this._reelsNode.startScrolling();
        this._spin(rand);
    },

    _spin : function (result){
        this._reelsNode.spinEnd(result);
    }
})