"use strict";

//var request = require("request");
var expect = require("chai").expect;
//var pass = require("../../TestUtils").pass;
//var fail = require("../../TestUtils").fail;

//var util = require("util");
//var Q = require("q");

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var GeoserverMockServer = require("../../test-server.js");
var config = require("../../config.js");

describe("Geoserver instance", function () {

    this.timeout(600 * 1000);

    var geoserverMockServer = new GeoserverMockServer(config.test.geoserver);

    var gsRepository;

    beforeEach(function (done) {
        gsRepository = new GeoserverRepository(config.test);
        done();
    });

    afterEach(function () {
        try {
            gsRepository = null;
        } catch (e) {
            // already closed
        }
    });

    after(function () {
        geoserverMockServer.close();
    });

    describe("testing Geoserver access", function () {

        it("GS repository should be disabled if Geoserver instance is not initialized", function (done) {
            expect(gsRepository.isEnabled).not.to.be.equal(true);
            done();
        });

        it("should handle Geoserver initialization timeout", function (done) {

            geoserverMockServer.get("/geoserver/about/version.json", function () {
                // timeout
                var a = 1;
            });

            gsRepository.isEnabled = false;
            gsRepository.timeout = 1;

            gsRepository.initializeWorkspace().then(function () {
                done(new Error("GS shouldn't be initialized"));
            }).catch(function (err) {
                expect(gsRepository.isEnabled).to.be.equal(false);
                expect(err.reason).to.be.equal("ETIMEDOUT");
                done();
            });

        });

        it("should correctly fetch Geoserver details ", function (done) {

            gsRepository.initializeWorkspace().then(function (gsInstance) {
                expect(gsInstance.isEnabled).to.be.equal(true);
                expect(gsInstance.geoserverDetails["@name"]).to.be.equal("GeoServer");
                done();
            }).catch(done);

        });

    });
});



