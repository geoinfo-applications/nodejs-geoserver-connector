"use strict";

describe("Geoserver Connector unit tests", () => {

    const expect = require("chai").expect;

    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");
    const TestUtils = require("../../TestUtils.js");
    const GeoserverMockServer = require("../../test-server.js");
    const config = require("../../config");

    const testUtils = new TestUtils(config.unit_test);
    let gsConnector = testUtils.gsConnector;

    let geoserverMockServer;

    describe("testing offline Geoserver handling ", () => {

        before(async () => {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addTimeoutRequestHandler();
            await geoserverMockServer.listen();
        });

        beforeEach(() => {
            testUtils.createConnector();
        });

        afterEach(() => {
            testUtils.tearDownConnector();
        });

        after(() => {
            geoserverMockServer.tearDown();
        });

        it("connector should be disabled if Geoserver instance is not initialized ", () => {
            expect(gsConnector.isEnabled).not.to.be.equal(true);
        });

        it("should handle connector initialization timeout ", async () => {

            gsConnector.dispatcher.timeout = 1;

            try {
                await gsConnector.initializeWorkspace();
            } catch (err) {
                expect(gsConnector.isEnabled).to.be.equal(false);
                expect(err.message).to.match(/ETIMEDOUT/);
                return;
            }

            throw new Error("connector shouldn't be initialized ");
        });
    });

    describe("testing online Geoserver access", () => {

        const layer = config.layer;
        const nonExistingLayer = config.nonExistingLayer;

        before(async () => {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addDefaultRequestHandlers();
            await geoserverMockServer.listen();
        });

        beforeEach(() => {
            gsConnector = new GeoserverConnector(config.unit_test);
        });

        afterEach(() => {
            testUtils.tearDownConnector();
        });

        after(() => {
            geoserverMockServer.tearDown();
        });

        describe("testing Geoserver config", () => {

            it("should correctly add admin path to baseUrl if supplied", () => {

                const gsConfig = config.unit_test.geoserver;
                const expectedAdminUrl = "http://" + gsConfig.host + ":" + gsConfig.port + "/" +
                    gsConfig.context + "/" + gsConfig.adminPath + "/";

                expect(gsConnector.baseURL).to.be.equal(expectedAdminUrl);
            });
        });

        describe("testing Geoserver access functionalites", () => {

            it("should correctly fetch Geoserver details", async () => {
                await gsConnector.isGeoserverRunning();
                expect(gsConnector.isEnabled).to.be.equal(true);
            });

            it("should correctly initialize new Geoserver instance", async () => {
                await gsConnector.initializeWorkspace();

                expect(gsConnector.isEnabled).to.be.equal(true);
                expect(gsConnector.geoserverDetails["@name"]).to.be.equal("GeoServer");
            });

            it("should reload catalog", async () => {
                await gsConnector.reloadCatalog();
            });

            it("should reset cache", async () => {
                await gsConnector.resetCache();
            });
        });

        describe("testing Geoserver CRUD methods", () => {

            beforeEach(async () => {
                gsConnector = new GeoserverConnector(config.unit_test);
                await gsConnector.initializeWorkspace();
            });

            it("should fetch workspace ", async () => {
                await gsConnector.workspaceExists();
            });

            it("should fetch datastore ", async () => {
                await gsConnector.datastoreExists();
            });

            it("should return true if feature type exists", async () => {
                await gsConnector.featureTypeExists(layer);
            });

            it("should get feature type details ", async () => {
                await gsConnector.getFeatureType(layer);
            });

            it("should delete feature type ", async () => {
                await gsConnector.deleteFeatureType(layer);
            });

            it("should fail renaming feature type if new name is not supplied ", async () => {
                try {
                    await gsConnector.renameFeatureType(layer);
                } catch (error) {
                    expect(error.message).to.match(/name required/);
                    return;
                }

                throw new Error("should fail");
            });

            it("should rename feature type ", async () => {
                await gsConnector.renameFeatureType(layer, "newLayerName");
            });

            it("should recalculate feature type BBOX ", async () => {
                await gsConnector.recalculateFeatureTypeBBox(layer);
            });

            it("should get layer details using /layers/layerName format", async () => {

                const layerDetails = await gsConnector.getLayer(layer);

                expect(layerDetails.name).to.be.equal(layer.name);
            });

            it("should get layer details using /layers/workspace:layerName format ", async () => {
                const layerWithWorkspace = { name: layer.name, wsName: "testWorkspace:" };

                const layerDetails = await gsConnector.getLayer(layerWithWorkspace);

                expect(layerDetails.name).to.be.equal(layer.name);
            });

            it("should return false if layer does not exist ", async () => {

                const exists = await gsConnector.layerExists(nonExistingLayer);

                expect(exists).to.be.equal(false);
            });

            it("should return true if layer exist ", async () => {

                const exists = await gsConnector.layerExists(layer);

                expect(exists).to.be.equal(true);
            });

        });

    });

});
