// CinderellaDefines.js

// 이벤트 타입 정의
var ReelEvents = {
    SPIN_START: "spin_start",
    SPIN_STOP: "spin_stop",
    ALL_REELS_STOPPED: "all_reels_stopped",
    SYMBOL_ANIMATION_START: "symbol_animation_start",
    SYMBOL_ANIMATION_END: "symbol_animation_end",
    RESULT_CALCULATED: "result_calculated",
    LONG_SPIN_START: "long_spin_start"
};

// 심볼 인덱스 정의
var SymbolType = {
    NORMAL: 0,
    WILD: 1,
    SCATTER: 5,
};

// 설정 값들
var GameSettings = {
    REEL_COUNT: 5, //지금 당장은 쓰진 않음
    REEL_HEIGHT: 3,
    START_POS_Y: 60,
    AR_TOTAL_COUNT: 6,
    SYMBOL_HEIGHT: 105,
    SYMBOL_SIZE: 1,
    SPIN_SPEED: 1200,
    LONG_SPIN_MUL: 7,
    STOP_DELAY: 0.25,
    STOP_DELAY_FAST: 0.1,
};