var res = {
    MainSprite : "res/image/sl_mainAtlas.png",
    MainPlist : "res/image/sl_mainAtlas.plist",
    BottomMenuSprite : "res/image/SL_bottomMenuAtlas.png",
    BottomMenuPlist : "res/image/SL_bottomMenuAtlas.plist",
    NormalReelBack : "res/SL_mainUI.ExportJson",
    BottomMenuUI : "res/SL_bottomMenuUI.ExportJson",
    symbolAR01: "res/sl_symbolAR01.ExportJson",
    symbolAR02: "res/sl_symbolAR02.ExportJson",
    symbolAR03: "res/sl_symbolAR03.ExportJson",
    symbolAR04: "res/sl_symbolAR04.ExportJson",
    symbolAR05: "res/sl_symbolAR05.ExportJson",
    symbolAR06: "res/sl_symbolAR06.ExportJson",
    Data : "res/data.json"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
