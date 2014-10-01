"use strict";

var fs = require("fs");
var expect = require("chai").expect;

var GeoserverRepository = require("../../../server/domain/geoserver/GeoserverRepository");
var GeoserverMockServer = require("../test-server.js");
var config = require("../config.js");

describe("Geoserver instance ", function () {

    this.timeout(500);

    describe("testing offline Geoserver access ", function () {

        var gsRepository, geoserverMockServer, mockServer;

        before(function (done) {

            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addTimeoutRequestHandler();

            mockServer = geoserverMockServer.getServer().listen(3003, function () {
                done();
            });

        });

        beforeEach(function (done) {
            gsRepository = new GeoserverRepository(config.unit_test);
            done();
        });

        afterEach(function () {
            gsRepository = null;
        });

        after(function () {
            try {
                mockServer.close();
            } catch (e) {
                // already closed
            }
        });

        it("repository should be disabled if Geoserver instance is not initialized ", function (done) {
            expect(gsRepository.isEnabled).not.to.be.equal(true);
            done();
        });

    });

});

