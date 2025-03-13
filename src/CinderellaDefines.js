// CinderellaDefines.js

// 이벤트 타입 정의
var ReelEvents = {
    SPIN_START: "spin_start",
    SPIN_STOP: "spin_stop",
    ALL_REELS_STOPPED: "all_reels_stopped",
    SYMBOL_ANIMATION_START: "symbol_animation_start",
    SYMBOL_ANIMATION_END: "symbol_animation_end",
    RESULT_CALCULATED: "result_calculated"
};

// 심볼 인덱스 정의
var SymbolIndex = {
    NORMAL: 0,
    WILD: 1,
    SCATTER: 2,
};

// 설정 값들
var GameSettings = {
    REEL_COUNT: 5,
    VISIBLE_SYMBOLS: 3,
    SYMBOL_HEIGHT: 105,
    SPIN_SPEED: 1200,
    STOP_DELAY: 0.25,
    STOP_DELAY_FAST: 0.15
};