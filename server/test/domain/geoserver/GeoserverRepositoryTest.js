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

        afterEach(function () {
            gsRepository = null;
        });

        after(function () {
            try {
                mockServer.close();
                gsRepository = null;
            } catch (e) {
                // already closed
            }
        });

        var layer = { name: "fooLayer", featureType: "fooLayer"};

        describe("testing Geoserver access functionalites", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.test);
                done();
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
        });

        describe("testing Geoserver CRUD methods", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.test);
                gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            });

            it("should fetch Geoserver workspace ", function (done) {

                gsRepository.workspaceExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should fetch Geoserver datastore ", function (done) {

                gsRepository.datastoreExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should return true if Geoserver layer exists", function (done) {

                gsRepository.layerExists(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should get Geoserver layer details ", function (done) {

                gsRepository.getLayer(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should delete Geoserver layer ", function (done) {

                gsRepository.deleteLayer(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should fail renaming layer if new name is not supplied ", function (done) {

                gsRepository.renameLayer(layer).catch(function (error) {
                    expect(error.message).to.match(/layer name required/);
                    done();
                });
            });

            it("should rename Geoserver layer ", function (done) {

                gsRepository.renameLayer(layer, "newLayerName").then(function () {
                    done();
                }).catch(done);
            });

            it("should recalculate layer BBOX", function (done) {
                return gsRepository.recalculateLayerBBox(layer).then(function () {
                    done();
                }).catch(done);
            });
        });

        describe("testing Geoserver style functionalites", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.test);
                gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            });

            // TODO mock styles
            it.skip("should get public styles ", function (done) {
                gsRepository.getPublicStyles().then(function () {
                    done();
                });
            });

            // TODO mock styles
            it.skip("should fetch default workspace styles if name is not supplied ", function (done) {

                gsRepository.getWorkspaceStyles().then(function (styles) {
                    expect(styles).to.be.instanceof(Array);
                    done();
                });
            });

            it("should get workspace styles ", function (done) {
                gsRepository.getWorkspaceStyles({ name: "testWorkspace"}).then(function () {
                    done();
                });
            });

            it("should get default layer style ", function (done) {
                gsRepository.getLayerDefaultStyle(layer).then(function () {
                    done();
                });
            });

            it("should get all layer styles ", function (done) {
                gsRepository.getLayerStyles(layer).then(function () {
                    done();
                });
            });

            it("should set default layer style ", function (done) {
                gsRepository.setLayerDefaultStyle().then(function () {
                    done();
                });
            });

            it("should create new geoserver style ", function (done) {
                gsRepository.createWorkspaceStyle("newStyle").then(function () {
                    done();
                });
            });

            it("should upload new SLD file ", function (done) {
                gsRepository.uploadStyleContent().then(function () {
                    done();
                });
            });

        });

    });

});

