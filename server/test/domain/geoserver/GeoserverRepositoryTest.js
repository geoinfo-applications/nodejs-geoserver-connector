"use strict";

var fs = require("fs");
var expect = require("chai").expect;

var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
var GeoserverMockServer = require("../../test-server.js");
var config = require("../../config");

describe("Geoserver unit tests", function () {

    this.timeout(500000);

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

        it("should handle repository initialization timeout ", function (done) {

            gsRepository.dispatcher.timeout = 1;

            gsRepository.initializeWorkspace().then(function () {
                done(new Error("repository shouldn't be initialized "));
            }).catch(function (err) {
                expect(gsRepository.isEnabled).to.be.equal(false);
                expect(err.message).to.be.equal("ETIMEDOUT");
                done();
            });

        });
    });

    describe("testing online Geoserver access", function () {

        var gsRepository, geoserverMockServer, mockServer;

        var layer = config.layer;
        var style = config.style;

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
            } catch (e) {
                // already closed
            }
        });

        describe("testing Geoserver access functionalites", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.unit_test);
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
                gsRepository = new GeoserverRepository(config.unit_test);
                gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            });

            it("should fetch workspace ", function (done) {

                gsRepository.workspaceExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should fetch datastore ", function (done) {

                gsRepository.datastoreExists().then(function () {
                    done();
                }).catch(done);
            });

            it("should return true if feature type exists", function (done) {

                gsRepository.featureTypeExists(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should get feature type details ", function (done) {

                gsRepository.getFeatureType(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should delete feature type ", function (done) {

                gsRepository.deleteFeatureType(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should fail renaming feature type if new name is not supplied ", function (done) {

                gsRepository.renameFeatureType(layer).catch(function (error) {
                    expect(error.message).to.match(/name required/);
                    done();
                });
            });

            it("should rename feature type ", function (done) {

                gsRepository.renameFeatureType(layer, "newLayerName").then(function () {
                    done();
                }).catch(done);
            });

            it("should recalculate feature type BBOX ", function (done) {
                return gsRepository.recalculateFeatureTypeBBox(layer).then(function () {
                    done();
                }).catch(done);
            });

            it("should get layer details ", function (done) {

                gsRepository.getLayer(layer).then(function (layerDetails) {
                    expect(layerDetails.name).to.be.equal(layer.name);
                    done();
                }).catch(done);
            });

            it("should return false if layer does not exist ", function (done) {

                gsRepository.layerExists({name: "notExistingLayer"}).then(function (exists) {
                    expect(exists).to.be.equal(false);
                    done();
                }).catch(done);
            });

            it("should return true if layer exist ", function (done) {

                gsRepository.layerExists(layer).then(function (exists) {
                    expect(exists).to.be.equal(true);
                    done();
                }).catch(done);
            });

        });

        describe("testing Geoserver style functionalites", function () {

            beforeEach(function (done) {
                gsRepository = new GeoserverRepository(config.unit_test);
                gsRepository.initializeWorkspace().then(function () {
                    done();
                });
            });

            describe("global styles", function () {

                it("should fail if global style name is not defined ", function (done) {
                    gsRepository.getGlobalStyle().catch(function (error) {
                        expect(error.message).to.match(/name required/);
                        done();
                    });
                });

                it("should get a global style ", function (done) {
                    gsRepository.getGlobalStyle(style).then(function (styleObject) {
                        expect(styleObject.name).to.be.equal(style.name);
                        done();
                    }).catch(done);
                });

                it("should get all global styles ", function (done) {
                    gsRepository.getGlobalStyles().then(function (styles) {
                        expect(styles).to.be.instanceof(Array);
                        expect(styles.length).to.be.equal(4);
                        expect(styles[0].name).to.be.equal("point");
                        done();
                    }).catch(done);
                });

                it("should return false if global style name is not defined ", function (done) {
                    gsRepository.createGlobalStyleConfiguration().catch(function (error) {
                        expect(error.message).to.match(/name required/);
                        done();
                    });
                });

                it("should return false if global style does not exist ", function (done) {

                    gsRepository.globalStyleExists({name: "notExistingStyle"}).then(function (exists) {
                        expect(exists).to.be.equal(false);
                        done();
                    }).catch(done);
                });

                it("should return true if global style exist ", function (done) {

                    gsRepository.globalStyleExists(style).then(function (exists) {
                        expect(exists).to.be.equal(true);
                        done();
                    }).catch(done);
                });

                it("should create new global style configuration", function (done) {

                    gsRepository.createGlobalStyleConfiguration(style).then(function (result) {
                        expect(result).to.be.equal(true);
                        done();
                    }).catch(done);
                });

                it("should fail uploading global style if name is not defined", function (done) {

                    gsRepository.uploadGlobalStyleContent({sldBody: "<xml />"})
                        .catch(function (error) {
                            expect(error.message).to.match(/content required/);
                            done();
                        }).catch(done);
                });

                it("should fail uploading global style if sld body is not defined", function (done) {

                    gsRepository.uploadGlobalStyleContent(style).catch(function (error) {
                        expect(error.message).to.match(/content required/);
                        done();
                    }).catch(done);
                });

                it("should fail uploading global style if config is not defined", function (done) {

                    gsRepository.uploadGlobalStyleContent()
                        .catch(function (error) {
                            expect(error.message).to.match(/content required/);
                            done();
                        }).catch(done);
                });

                it("should replace existing global style SLD file", function (done) {

                    fs.readFile(__dirname + "/../../data/teststyle.sld", "ascii", function (err, sldContent) {

                        var styleConfig = {
                            name: style.name,
                            sldBody: sldContent
                        };

                        gsRepository.uploadGlobalStyleContent(styleConfig).then(function (result) {
                            expect(result).to.be.equal(true);
                            done();
                        }).catch(done);
                    });
                });

                it("should create global style configuration and upload SLD file content ", function (done) {

                    fs.readFile(__dirname + "/../../data/teststyle.sld", "ascii", function (err, sldContent) {

                        var styleConfig = {
                            name: style.name,
                            sldBody: sldContent
                        };

                        gsRepository.createGlobalStyle(styleConfig).then(function (result) {
                            expect(result).to.be.equal(true);
                            done();
                        }).catch(done);
                    });
                });

                it("should delete global style", function (done) {
                    gsRepository.deleteGlobalStyle(style).then(function (result) {
                        expect(result).to.be.equal(true);
                        done();
                    });
                });

            });

            describe("workspace styles", function () {

                it("should fail if workspace style name is not defined", function (done) {
                    gsRepository.getWorkspaceStyle().catch(function (error) {
                        expect(error.message).to.match(/name required/);
                        done();
                    }).catch(done);
                });

                it("should get workspace style ", function (done) {
                    gsRepository.getWorkspaceStyle(style).then(function (workspaceStyle) {
                        expect(workspaceStyle).to.be.instanceof(Object);
                        expect(workspaceStyle.name).to.be.equal(style.name);
                        expect(workspaceStyle.filename).to.be.equal(style.filename);
                        done();
                    }).catch(done);
                });

                it("should fetch all workspace styles ", function (done) {

                    gsRepository.getWorkspaceStyles().then(function (styles) {
                        expect(styles).to.be.instanceof(Array);
                        expect(styles.length).to.be.equal(4);
                        expect(styles[0].name).to.be.equal("point");
                        done();
                    }).catch(done);
                });

                it("should return false if workspace style does not exist ", function (done) {

                    gsRepository.workspaceStyleExists({name: "notExistingStyle"}).then(function (exists) {
                        expect(exists).to.be.equal(false);
                        done();
                    }).catch(done);
                });

                it("should return true if workspace style exists ", function (done) {

                    gsRepository.workspaceStyleExists(style).then(function (exists) {
                        expect(exists).to.be.equal(true);
                        done();
                    }).catch(done);
                });

                it("should return false if workspace style name is not defined ", function (done) {
                    gsRepository.createWorkspaceStyleConfiguration().catch(function (error) {
                        expect(error.message).to.match(/name required/);
                        done();
                    });
                });

                it("should create new workspace style ", function (done) {
                    gsRepository.createWorkspaceStyleConfiguration(style).then(function () {
                        done();
                    }).catch(done);
                });

                it("should fail uploading workspace style if name is not defined", function (done) {

                    gsRepository.uploadWorkspaceStyleContent({sldBody: "<xml />"})
                        .catch(function (error) {
                            expect(error.message).to.match(/content required/);
                            done();
                        });
                });

                it("should fail uploading workspace style if sld body is not defined", function (done) {

                    gsRepository.uploadWorkspaceStyleContent(style).catch(function (error) {
                        expect(error.message).to.match(/content required/);
                        done();
                    });
                });

                it("should fail uploading workspace style if config is not defined", function (done) {

                    gsRepository.uploadWorkspaceStyleContent()
                        .catch(function (error) {
                            expect(error.message).to.match(/content required/);
                            done();
                        });
                });

                it("should replace existing workspace style SLD file", function (done) {

                    fs.readFile(__dirname + "/../../data/teststyle.sld", "ascii", function (err, sldContent) {

                        var styleConfig = {
                            name: style.name,
                            sldBody: sldContent
                        };

                        gsRepository.uploadWorkspaceStyleContent(styleConfig).then(function (result) {
                            expect(result).to.be.equal(true);
                            done();
                        }).catch(done);
                    });
                });

                it("should create new global style configuration and upload SLD file content ", function (done) {

                    fs.readFile(__dirname + "/../../data/teststyle.sld", "ascii", function (err, sldContent) {

                        var styleConfig = {
                            name: style.name,
                            sldBody: sldContent
                        };

                        gsRepository.createWorkspaceStyle(styleConfig).then(function (result) {
                            expect(result).to.be.equal(true);
                            done();
                        }).catch(done);
                    });
                });

                it("should delete workspace style ", function (done) {
                    gsRepository.deleteWorkspaceStyle(style).then(function () {
                        done();
                    });
                });

            });

            describe("layer styles", function () {

                it("should fail if layer name is not defined", function (done) {
                    gsRepository.getLayerStyles().catch(function (error) {
                        expect(error.message).to.match(/name required/);
                        done();
                    }).catch(done);
                });

                it("should get default layer style name", function (done) {
                    gsRepository.getLayerDefaultStyle(layer).then(function (defaultStyle) {
                        expect(defaultStyle.name).to.be.equal(layer.defaultStyleName);
                        done();
                    }).catch(done);
                });

                it("should get all layer styles ", function (done) {
                    gsRepository.getLayerStyles(layer).then(function (styles) {
                        expect(styles).to.be.instanceof(Array);
                        expect(styles.length).to.be.equal(4);
                        expect(styles[0].name).to.be.equal("point");
                        done();
                    }).catch(done);
                });

                it("should set default layer style ", function (done) {
                    gsRepository.setLayerDefaultStyle().then(function () {
                        done();
                    }).catch(done);
                });

                it("should add style to layer ", function (done) {
                    gsRepository.setLayerDefaultStyle().then(function () {
                        done();
                    }).catch(done);
                });

                it("should remove style from layer ", function (done) {
                    gsRepository.setLayerDefaultStyle().then(function () {
                        done();
                    }).catch(done);
                });

                it("should remove and delete layer style ", function (done) {
                    gsRepository.setLayerDefaultStyle().then(function () {
                        done();
                    }).catch(done);
                });

            });

        });

    });

});

