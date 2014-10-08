"use strict";

var expect = require("chai").expect;

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var TestUtils = require("../../TestUtils.js");
var GeoserverMockServer = require("../../test-server.js");
var config = require("../../config");

describe.only("Geoserver LegendGraphic tests", function () {

    this.timeout(500);

    var testUtils = new TestUtils(config.unit_test);
    var gsRepository = testUtils.gsRepository;

    var geoserverMockServer;

    var layer = config.layer;
    var style = config.style;
    var rule = config.rule;


    before(function (done) {
        geoserverMockServer = new GeoserverMockServer();
        geoserverMockServer.addLegendRequestHandlers();
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

    describe("global styles", function () {


        it("should create a getLegendGraphic url ", function (done) {
            gsRepository.legend.getRuleUrl(rule).then(function () {
                done();
            }).catch(done)
        });


    });

});
