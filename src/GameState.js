var GameState = cc.Class.extend({
    ctor: function (gameNode) {
        this.gameNode = gameNode;
    },
    enter: function () {},  // 상태 진입 시 호출
    exit: function () {},   // 상태 종료 시 호출
    onSpin: function () {}, // 스핀 버튼을 눌렀을 때
    startAuto:function () {} // 오토 횟수지정 버튼을 눌렀을 때
});

var IdleState = GameState.extend({
    enter: function () {
        cc.log("상태: IDLE");
        this.gameNode._setEnableSpin(true);
    },
    onSpin: function () {
        this.gameNode._onSpin();
    },
    startAuto:function (count, isInfinity) {
        this.gameNode._startAuto(count, isInfinity);
    }
});

var SpinningState = GameState.extend({
    enter: function () {
        cc.log("상태: SPINNING");
        this.gameNode._setEnableSpin(false);
    },
    onSpin: function () {
        this.gameNode._spinStop();
    }
});

var ResultState = GameState.extend({
    enter: function () {
        cc.log("상태: SHOWING_RESULT");
        this.gameNode._setEnableSpin(false);
    }
});