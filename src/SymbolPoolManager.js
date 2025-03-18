var SymbolPoolManager = cc.Class.extend({
    ctor:function (symbolPrefab) {
        this.pool = [];
        this.symbolPrefab = symbolPrefab;
    },

    getSymbol: function() {
        var foundSymbol = null;

        // 풀을 순회하여 비활성화된 객체를 찾는다.
        this.pool.forEach(function(symbol) {
            if (!symbol.active) {
                symbol.setVisible(true);  // 객체 활성화
                return symbol;  // 순회 종료
            }
        }, this);

        // 비활성화된 객체가 없다면 새로운 객체를 생성
        return new this.symbolPrefab();
    },

    returnSymbol: function(symbol) {
        symbol.setVisible(false);  // 객체를 비활성화
    }
})