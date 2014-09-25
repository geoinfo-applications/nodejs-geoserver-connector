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

    this.timeout(100000);

    describe("testing offline Geoserver access", function () {

        var gsRepository, geoserverMockServer, mockServer;

        before(function (done) {

            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addTimeoutRequestHandler();

            mockServer = geoserverMockServer.getServer().listen(3003, function () {
                done();
            });

        });

        beforeEach(function (done) {
            gsRepository = new GeoserverRepository(config.test);
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

        it("GS repository should be disabled if Geoserver instance is not initialized", function (done) {
            expect(gsRepository.isEnabled).not.to.be.equal(true);
            done();
        });

        it("should handle Geoserver initialization timeout", function (done) {

            gsRepository.dispatcher.timeout = 1;

            gsRepository.initializeWorkspace().then(function () {
                done(new Error("Geoserver instance shouldn't be initialized"));
            }).catch(function (err) {
                expect(gsRepository.isEnabled).to.be.equal(false);
                expect(err.message).to.be.equal("ETIMEDOUT");
                done();
            });

        });
    });

    describe("testing online Geoserver access", function () {

        var gsRepository, geoserverMockServer, mockServer;

        before(function (done) {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addDefaultRequestHandlers();

            mockServer = geoserverMockServer.getServer().listen(3003, function () {
                done();
            });
        });

        beforeEach(function (done) {
            gsRepository = new GeoserverRepository(config.test);
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

        it("should correctly fetch Geoserver details ", function (done) {

            gsRepository.isGeoserverRunning().then(function () {
                expect(gsRepository.isEnabled).to.be.equal(true);
                done();
            }).catch(done);

        });

        it("should correctly initialize new Geoserver instance ", function (done) {

            gsRepository.initializeWorkspace().then(function (gsInstance) {
                expect(gsInstance.isEnabled).to.be.equal(true);
                expect(gsInstance.geoserverDetails["@name"]).to.be.equal("GeoServer");
                done();
            }).catch(done);

        });

        describe("testing Geoserver style functionalites", function () {

            it("should get workspace styles ", function (done) {
                gsRepository.getWorkspaceStyles().then(function () {
                    done();
                });
            });

            it("should get default layer style ", function (done) {
                gsRepository.getLayerDefaultStyle().then(function () {
                    done();
                });
            });

            it("should get all layer styles ", function (done) {
                gsRepository.getLayerStyles().then(function () {
                    done();
                });
            });

            it("should set default layer style ", function (done) {
                gsRepository.setLayerDefaultStyle().then(function () {
                    done();
                });
            });

            it("should create new geoserver style ", function (done) {
                gsRepository.createStyle().then(function () {
                    done();
                });
            });

            it("should upload new SLD file ", function (done) {
                gsRepository.uploadStyle().then(function () {
                    done();
                });
            });

        });

    });



});



