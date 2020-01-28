"use strict";

describe("Geoserver Styles tests", () => {
    const expect = require("chai").expect;

    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");
    const TestUtils = require("../../TestUtils.js");
    const GeoserverMockServer = require("../../test-server.js");
    const config = require("../../config");


    const testUtils = new TestUtils(config.unit_test);
    let gsRepository = testUtils.gsRepository;

    let geoserverMockServer;

    const layer = config.layer;
    const style = config.style;
    let sldContent;

    before(async () => {
        geoserverMockServer = new GeoserverMockServer();
        geoserverMockServer.addDefaultRequestHandlers();
        await geoserverMockServer.listen();
    });

    after(() => {
        geoserverMockServer.tearDown();
    });

    beforeEach(async () => {
        gsRepository = new GeoserverRepository(config.unit_test);
        await gsRepository.initializeWorkspace();
    });

    afterEach(() => {
        testUtils.tearDownRepository();
    });

    describe("global styles", () => {

        before(async () => {
            sldContent = await testUtils.readStyleContent();
        });

        after(() => {
            sldContent = null;
        });

        it("should fail if global style name is not defined ", async () => {
            try {
                await gsRepository.getGlobalStyle();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get a global style ", async () => {

            const styleObject = await gsRepository.getGlobalStyle(style);

            expect(styleObject.name).to.be.equal(style.name);
        });

        it("should get all global styles ", async () => {

            const styles = await gsRepository.getGlobalStyles();

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should return false if global style name is not defined ", async () => {
            try {
                await gsRepository.createGlobalStyleConfiguration();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should return false if global style does not exist ", async () => {

            const exists = await gsRepository.globalStyleExists({ name: "notExistingStyle" });

            expect(exists).to.be.equal(false);
        });

        it("should return true if global style exist ", async () => {

            const exists = await gsRepository.globalStyleExists(style);

            expect(exists).to.be.equal(true);
        });

        it("should create new global style configuration", async () => {
            await gsRepository.createGlobalStyleConfiguration(style);
        });

        it("should fail uploading global style if name is not defined", async () => {

            try {
                await gsRepository.uploadGlobalStyleContent({ sldBody: "<xml />" });
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }

            throw new Error("should fail");
        });

        it("should fail uploading global style if sld body is not defined", async () => {

            try {
                await gsRepository.uploadGlobalStyleContent(style);
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading global style if config is not defined", async () => {
            try {
                await gsRepository.uploadGlobalStyleContent();
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should replace existing global style SLD file", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsRepository.uploadGlobalStyleContent(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should create new global style configuration and upload SLD file content ", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsRepository.createGlobalStyle(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should delete global style", async () => {
            await gsRepository.deleteGlobalStyle(style);
        });

    });

    describe("workspace styles", () => {

        before(async () => {
            sldContent = await testUtils.readStyleContent();
        });

        after(() => {
            sldContent = null;
        });

        it("should fail if workspace style name is not defined", async () => {
            try {
                await gsRepository.getWorkspaceStyle();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get workspace style ", async () => {

            const workspaceStyle = await gsRepository.getWorkspaceStyle(style);

            expect(workspaceStyle).to.be.instanceof(Object);
            expect(workspaceStyle.name).to.be.equal(style.name);
            expect(workspaceStyle.filename).to.be.equal(style.filename);
        });

        it("should fetch all workspace styles ", async () => {

            const styles = await gsRepository.getWorkspaceStyles();

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should return false if workspace style does not exist ", async () => {

            const exists = await gsRepository.workspaceStyleExists({ name: "notExistingStyle" });

            expect(exists).to.be.equal(false);
        });

        it("should return true if workspace style exists ", async () => {

            const exists = await gsRepository.workspaceStyleExists(style);

            expect(exists).to.be.equal(true);
        });

        it("should return false if workspace style name is not defined ", async () => {
            try {
                await gsRepository.createWorkspaceStyleConfiguration();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should create new workspace style ", async () => {
            await gsRepository.createWorkspaceStyleConfiguration(style);
        });

        it("should fail uploading workspace style if name is not defined", async () => {
            try {
                await gsRepository.uploadWorkspaceStyleContent({ sldBody: "<xml />" });
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading workspace style if SLD body is not defined", async () => {

            try {
                await gsRepository.uploadWorkspaceStyleContent(style);
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should fail uploading workspace style if config is not defined", async () => {
            try {
                await gsRepository.uploadWorkspaceStyleContent();
            } catch (error) {
                expect(error.message).to.match(/content required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should replace existing workspace style SLD file", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsRepository.uploadWorkspaceStyleContent(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should create new workspace style configuration and upload SLD file content ", async () => {
            const styleConfig = {
                name: style.name,
                sldBody: sldContent
            };

            const result = await gsRepository.createWorkspaceStyle(styleConfig);

            expect(result).to.be.equal(true);
        });

        it("should delete workspace style ", async () => {
            await gsRepository.deleteWorkspaceStyle(style);
        });

    });

    describe("layer styles", () => {

        it("should fail if layer name is not defined", async () => {
            try {
                await gsRepository.getLayerStyles();
            } catch (error) {
                expect(error.message).to.match(/name required/);
                return;
            }
            throw new Error("should fail");
        });

        it("should get default layer style name", async () => {
            const defaultStyle = await gsRepository.getLayerDefaultStyle(layer);

            expect(defaultStyle.name).to.be.equal(layer.defaultStyleName);
        });

        it("should get all layer styles ", async () => {
            const styles = await gsRepository.getLayerStyles(layer);

            expect(styles).to.be.instanceof(Array);
            expect(styles.length).to.be.equal(4);
            expect(styles[0].name).to.be.equal("point");
        });

        it("should update default layer style ", async () => {
            await gsRepository.setLayerDefaultStyle(layer, style.name);
        });

    });

});
