"use strict";

var expect = require("chai").expect;
var _ = require("underscore");

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var TestUtils = require("../../TestUtils.js");
var GeoserverMockServer = require("../../test-server.js");
var config = require("../../config");

describe("Geoserver LegendGraphic tests", function () {

    this.timeout(500);

    var testUtils = new TestUtils(config.unit_test);
    var gsRepository = testUtils.gsRepository;
    var legend = gsRepository.legend;

    var geoserverMockServer;

    // var layer = config.layer;
    var style = config.style;
    var rule = config.rule;

    var parameters = [
        "REQUEST=GetLegendGraphic",
        "VERSION=1.0.0",
        "FORMAT=" + legend.defaultImageFormat,
        "WIDTH=" + legend.defaultWidth,
        "HEIGHT=" + legend.defaultHeight,
        "LAYER=" + legend.WORKSPACE + ":" + legend.DEFAULT_LAYER,
        "RULE=" + rule.name
    ];

    var ruleWithoutStyle = _.omit(_.clone(rule), "style");
    var parametersWithStyle = parameters.concat(["STYLE=" + style.name]);

    before(function (done) {
        geoserverMockServer = new GeoserverMockServer();
        geoserverMockServer.addDefaultRequestHandlers();
        geoserverMockServer.listen(done);
    });

    after(function () {
        geoserverMockServer.tearDown();
    });

    beforeEach(function (done) {
        gsRepository = new GeoserverRepository(config.unit_test);
        gsRepository.initializeWorkspace().then(function () {
            done();
        });
    });

    afterEach(function () {
        testUtils.tearDownRepository();
    });

    describe("rules ", function () {

        it("formatParameters should return valid parameters array for a rule", function () {
            var urlParameters = gsRepository.legend.formatParameters(rule);
            expect(urlParameters).to.be.eql(parametersWithStyle);
        });

        it("getRuleUrl should fail if rule or style name is missing ", function () {
            expect(function () {
                gsRepository.legend.getRuleUrl(ruleWithoutStyle);
            }).to.throw("rule and style name required");
        });

        it("getRuleUrl should return valid getLegendGraphic for rule url ", function () {

            var legendUrl = gsRepository.legend.getRuleUrl(rule);
            var expectedUrl = gsRepository.legend.baseURL + parametersWithStyle.join("&");

            expect(legendUrl).to.be.equal(expectedUrl);
        });

    });

});
