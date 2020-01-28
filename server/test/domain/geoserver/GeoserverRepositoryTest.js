"use strict";

describe("Geoserver repository unit tests", () => {

    const expect = require("chai").expect;

    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
    const TestUtils = require("../../TestUtils.js");
    const GeoserverMockServer = require("../../test-server.js");
    const config = require("../../config");

    const testUtils = new TestUtils(config.unit_test);
    let gsRepository = testUtils.gsRepository;

    let geoserverMockServer;

    describe("testing offline Geoserver handling ", () => {

        before(async () => {
            geoserverMockServer = new GeoserverMockServer();
            geoserverMockServer.addTimeoutRequestHandler();
            await geoserverMockServer.listen();
        });

        beforeEach(() => {
            testUtils.createRepository();
        });

        afterEach(() => {
            testUtils.tearDownRepository();
        });

        after(() => {
            geoserverMockServer.tearDown();
        });

        it("repository should be disabled if Geoserver instance is not initialized ", () => {
            expect(gsRepository.isEnabled).not.to.be.equal(true);
        });

        it("should handle repository initialization timeout ", async () => {

            gsRepository.dispatcher.timeout = 1;

            try {
                await gsRepository.initializeWorkspace();
            } catch (err) {
                expect(gsRepository.isEnabled).to.be.equal(false);
                expect(err.message).to.match(/ETIMEDOUT/);
                return;
            }

            throw new Error("repository shouldn't be initialized ");
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
            gsRepository = new GeoserverRepository(config.unit_test);
        });

        afterEach(() => {
            testUtils.tearDownRepository();
        });

        after(() => {
            geoserverMockServer.tearDown();
        });

        describe("testing Geoserver config", () => {

            it("should correctly add admin path to baseUrl if supplied", () => {

                const gsConfig = config.unit_test.geoserver;
                const expectedAdminUrl = "http://" + gsConfig.host + ":" + gsConfig.port + "/" +
                    gsConfig.context + "/" + gsConfig.adminPath + "/";

                expect(gsRepository.baseURL).to.be.equal(expectedAdminUrl);
            });
        });

        describe("testing Geoserver access functionalites", () => {

            it("should correctly fetch Geoserver details", async () => {
                await gsRepository.isGeoserverRunning();
                expect(gsRepository.isEnabled).to.be.equal(true);
            });

            it("should correctly initialize new Geoserver instance", async () => {
                await gsRepository.initializeWorkspace();

                expect(gsRepository.isEnabled).to.be.equal(true);
                expect(gsRepository.geoserverDetails["@name"]).to.be.equal("GeoServer");
            });

            it("should reload catalog", async () => {
                await gsRepository.reloadCatalog();
            });

            it("should reset cache", async () => {
                await gsRepository.resetCache();
            });
        });

        describe("testing Geoserver CRUD methods", () => {

            beforeEach(async () => {
                gsRepository = new GeoserverRepository(config.unit_test);
                await gsRepository.initializeWorkspace();
            });

            it("should fetch workspace ", async () => {
                await gsRepository.workspaceExists();
            });

            it("should fetch datastore ", async () => {
                await gsRepository.datastoreExists();
            });

            it("should return true if feature type exists", async () => {
                await gsRepository.featureTypeExists(layer);
            });

            it("should get feature type details ", async () => {
                await gsRepository.getFeatureType(layer);
            });

            it("should delete feature type ", async () => {
                await gsRepository.deleteFeatureType(layer);
            });

            it("should fail renaming feature type if new name is not supplied ", async () => {
                try {
                    await gsRepository.renameFeatureType(layer);
                } catch (error) {
                    expect(error.message).to.match(/name required/);
                    return;
                }

                throw new Error("should fail");
            });

            it("should rename feature type ", async () => {
                await gsRepository.renameFeatureType(layer, "newLayerName");
            });

            it("should recalculate feature type BBOX ", async () => {
                await gsRepository.recalculateFeatureTypeBBox(layer);
            });

            it("should get layer details using /layers/layerName format", async () => {

                const layerDetails = await gsRepository.getLayer(layer);

                expect(layerDetails.name).to.be.equal(layer.name);
            });

            it("should get layer details using /layers/workspace:layerName format ", async () => {
                const layerWithWorkspace = { name: layer.name, wsName: "testWorkspace:" };

                const layerDetails = await gsRepository.getLayer(layerWithWorkspace);

                expect(layerDetails.name).to.be.equal(layer.name);
            });

            it("should return false if layer does not exist ", async () => {

                const exists = await gsRepository.layerExists(nonExistingLayer);

                expect(exists).to.be.equal(false);
            });

            it("should return true if layer exist ", async () => {

                const exists = await gsRepository.layerExists(layer);

                expect(exists).to.be.equal(true);
            });

        });

    });

});
