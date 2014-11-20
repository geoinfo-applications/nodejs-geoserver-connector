"use strict";

var expect = require("chai").expect;
var _ = require("underscore");

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var TestUtils = require("../../TestUtils.js");
var config = require("../../config");

describe("Geoserver LegendGraphic tests", function () {

    this.timeout(500);

    var testUtils = new TestUtils(config.unit_test);
    var gsRepository = testUtils.gsRepository;
    var legend = gsRepository.legend;

    var layer = config.layer;
    var style = config.style;
    var rule = config.rule;
    rule.layer = layer.name;

    var parameters = [
        "REQUEST=GetLegendGraphic",
        "VERSION=1.0.0",
        "FORMAT=" + legend.defaultImageFormat,
        "WIDTH=" + legend.defaultWidth,
        "HEIGHT=" + legend.defaultHeight,
        "LAYER=" + layer.name,
        "TRANSPARENT=true",
        "RULE=" + rule.name
    ];

    var ruleWithoutStyle = _.omit(_.clone(rule), "style");
    var parametersWithStyle = parameters.concat(["STYLE=" + style.name]);

    beforeEach(function () {
        gsRepository = new GeoserverRepository(config.unit_test);
    });

    afterEach(function () {
        testUtils.tearDownRepository();
    });

    describe("rules ", function () {

        it("formatParameters should return valid parameters array for a rule", function () {
            var urlParameters = legend.formatParameters(rule);

            expect(urlParameters).to.be.eql(parametersWithStyle);
        });

        it("getBaseURL should return correct workspace url ", function () {
            var expectedURL = gsRepository.baseURL + legend.defaultWorkspace + "/wms?";

            var baseURL = legend.getBaseURL();

            expect(baseURL).to.be.eql(expectedURL);
        });

        it("getRuleUrl should fail if rule or style name is missing ", function () {
            expect(function () {
                legend.getRuleUrl(ruleWithoutStyle);
            }).to.throw("rule, style and layer name required");
        });

        it("getRuleUrl should return valid getLegendGraphic for rule url ", function () {

            var legendUrl = legend.getRuleUrl(rule);
            var expectedUrl = legend.getBaseURL(rule) + parametersWithStyle.join("&");

            expect(legendUrl).to.be.equal(expectedUrl);
        });

    });

});
