"use strict";


module.exports = function GeoserverLayer() {

    this.getFonts = function () {
        return this.getGeoserverObject(this.types.FONT).then(function (fontsObject) {
            return fontsObject.fonts;
        });
    };

};
