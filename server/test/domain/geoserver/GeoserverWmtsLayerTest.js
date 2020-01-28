"use strict";


// eslint-disable-next-line max-statements
describe("Geoserver Wmts Layer Test ", () => {

    const _ = require("underscore");
    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type, layerSearchingParameters, wmtsLayerSearchingParameters;
    let wmtsLayerConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(async () => {
        wmtsLayerConfig = {
            id: 227,
            name: "produkte",
            label: "Produkte",
            layerNames: "ch.blw.alpprodukte,ch.blw.bergprodukte",
            externalWmtsService: {
                id: 45,
                name: "ch",
                label: "CH",
                url: "http://wmts.geo.admin.ch",
                username: null,
                password: null
            },
            category: {
                id: 4,
                label: "Bodenbedeckung, Bodennutzung",
                labelShort: "Bodenbedeckung, -nutzung",
                kennzahl: 112,
                notation: "A2",
                level: 3,
                isIso: true
            },
            dataStock: null
        };

        geoserverConnector = new GeoserverConnector(config.unit_test);

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.isGeoserverRunning.name);
        geoserverConnector.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverConnector, GeoserverConnector.prototype.initializeWorkspace.name);
        geoserverConnector.initializeWorkspace.returns(Promise.resolve());

        type = geoserverConnector.types.WMTSLAYER;
    });

    describe("testing wmts layer existance", () => {

        beforeEach(() => {
            geoserverConnector.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverConnector.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverConnector.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverConnector.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    it("should get wmts Layer", async () => {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        const wmtsLayerDetails = { wmtsLayer: wmtsLayerConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmtsLayerDetails));

        const result = await geoserverConnector.getWmtsLayer(wmtsLayerConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, wmtsLayerConfig);
        expect(result).to.be.eql(wmtsLayerDetails);
    });

    describe("get wmts layer request parameters", () => {

        it("should return request parameters without special layer list", async () => {

            const result = await geoserverConnector.getWmtsLayerRequestParameters(wmtsLayerConfig);

            expect(result.length).to.be.eql(wmtsLayerConfig.layerNames.split(",").length);
            expect(result[0] && result[1]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
            expect(result[1].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
        });

        it("should return request parameters with special layer list", async () => {
            const layerList = ["ch.are.alpenkonvention"];

            const result = await geoserverConnector.getWmtsLayerRequestParameters(wmtsLayerConfig, layerList);

            expect(result.length).to.be.eql(layerList.length);
            expect(result[0]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
        });
    });

    it("should return wmts layer request object", () => {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmtsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        const requestObject = geoserverConnector.wmtsLayerRequestObject(wmtsLayerConfig);
        expect(requestObject).to.be.eql({
            wmtsLayer: {
                name: wmtsLayerConfig.layerName,
                nativeName: wmtsLayerConfig.nativeName,
                namespace: wmtsLayerConfig.nameSpace ? wmtsLayerConfig.nameSpace : geoserverConnector.geoserver.workspace,
                srs: wmtsLayerConfig.srs ? wmtsLayerConfig.srs : "EPSG:2056",
                wmtsStore: { name: wmtsLayerConfig.externalWmtsService.name },
                projectionPolicy: "REPROJECT_TO_DECLARED"
            }
        });
    });

    describe("resolver", () => {

        beforeEach(() => {
            wmtsLayerConfig.layerName = "ch_ch_blw_alpprodukte";
        });

        it("should return correct url with create", () => {
            expect(_.contains(geoserverConnector.resolver.create(type, wmtsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.create(type, wmtsLayerConfig).split(["/"]), "wmtsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.create(type, wmtsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverConnector.resolver.create(type, wmtsLayerConfig).split(["/"])))
                .to.be.eql("wmtslayers");
        });

        it("should return correct url with get", () => {
            expect(_.contains(geoserverConnector.resolver.get(type, wmtsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.get(type, wmtsLayerConfig).split(["/"]), "wmtsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.get(type, wmtsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverConnector.resolver.get(type, wmtsLayerConfig).split(["/"])))
                .to.be.eql("ch_ch_blw_alpprodukte");
        });
    });


    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverConnector.wmtsLayerExists = sinon.stub();
            geoserverConnector.issueWmtsLayerCreateRequest = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", async () => {
            geoserverConnector.wmtsLayerExists.returns(Promise.resolve(false));

            const result = await geoserverConnector.makeSureWmtsLayerExists({}, wmtsLayerConfig);

            expect(geoserverConnector.issueWmtsLayerCreateRequest).callCount(1);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });

        it("should not create new layer and return its name", async () => {
            geoserverConnector.wmtsLayerExists.returns(Promise.resolve(true));

            const result = await geoserverConnector.makeSureWmtsLayerExists({}, wmtsLayerConfig);

            expect(geoserverConnector.issueWmtsLayerCreateRequest).callCount(0);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });
    });

    describe("create not existing layers", () => {

        beforeEach(() => {
            geoserverConnector.getWmtsLayerRequestParameters = sinon.stub();
            geoserverConnector.makeSureWmtsLayerExists = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", async () => {
            geoserverConnector.getWmtsLayerRequestParameters.returns(Promise.resolve(["layer1", "layer2"]));

            await geoserverConnector.createNotExistingWmtsLayers(wmtsLayerConfig);

            expect(geoserverConnector.makeSureWmtsLayerExists).callCount(2);
        });

    });

    it("should create wmts layer", async () => {
        geoserverConnector.createNotExistingWmtsLayers = sinon.stub().returns(Promise.resolve(["layer1", "layer2"]));
        geoserverConnector.createLayerGroup = sinon.stub();

        await geoserverConnector.createWmtsLayer(wmtsLayerConfig);

        expect(geoserverConnector.createLayerGroup).to.have.been.calledWith(wmtsLayerConfig, ["layer1", "layer2"]);
    });

    describe("delete wmts layer everywhere", () => {

        beforeEach(() => {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmtsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverConnector.deleteGeoserverObject = sinon.stub();
            geoserverConnector.deleteGeoserverObject.onFirstCall().returns(Promise.resolve());

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wmts layer from layer list and wmts store layer list", async () => {
            geoserverConnector.wmtsLayerExists = sinon.stub().returns(Promise.resolve(true));
            geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

            await geoserverConnector.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(geoserverConnector.deleteGeoserverObject).callCount(2);
        });

        it("should not delte wmts layer from layer list and wmts store layer list because layer doesn't exists", async () => {
            geoserverConnector.wmtsLayerExists = sinon.stub().returns(Promise.resolve(false));

            await geoserverConnector.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(geoserverConnector.deleteGeoserverObject).callCount(0);
        });
    });

    describe("delete wmts layer", () => {

        beforeEach(() => {
            geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve());
            geoserverConnector.getWmtsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverConnector.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", async () => {

            await geoserverConnector.deleteWmtsLayer(wmtsLayerConfig);

            expect(geoserverConnector.deleteGeoserverObject).callCount(1);
            expect(geoserverConnector.deleteGeoserverObject).to.have.been.calledWith(geoserverConnector.types.LAYERGROUP, wmtsLayerConfig);
            expect(geoserverConnector.deleteWmtsLayerEverywhere).callCount(2);
            expect(geoserverConnector.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
            expect(geoserverConnector.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmtsLayerParam2");
        });
    });

    describe("delete all unnecessary geoserver layers", () => {

        beforeEach(() => {
            geoserverConnector.getWmtsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverConnector.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", async () => {
            const layersToDelete = ["layer1", "layer2"];

            await geoserverConnector.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete);

            expect(geoserverConnector.getWmtsLayerRequestParameters).callCount(1);
            expect(geoserverConnector.deleteWmtsLayerEverywhere).callCount(2);
            expect(geoserverConnector.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
        });

        it("should return because there is no layers to delete", async () => {
            const layersToDelete = [];

            await geoserverConnector.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete);

            expect(geoserverConnector.getWmtsLayerRequestParameters).callCount(0);
            expect(geoserverConnector.deleteWmtsLayerEverywhere).callCount(0);
        });
    });

    describe("update wmts layers", () => {

        beforeEach(() => {
            geoserverConnector.layerGroupExists = sinon.stub().returns(Promise.resolve(true));

            geoserverConnector.updateLayerGroup = sinon.stub();
            geoserverConnector.deleteAllUnnecessaryGeoserverWmtsLayers = sinon.stub();
            geoserverConnector.createNotExistingWmtsLayers = sinon.stub().returns(Promise.resolve([
                "ch.blw.alpprodukte",
                "ch.vbs.armeelogistikcenter"
            ]));
        });

        it("should update wmts layer", async () => {
            const existingExternalWmtsLayer = _.clone(wmtsLayerConfig);
            existingExternalWmtsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            await geoserverConnector.updateWmtsLayer(wmtsLayerConfig, existingExternalWmtsLayer);

            expect(geoserverConnector.createNotExistingWmtsLayers).callCount(1);
            expect(geoserverConnector.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
            expect(geoserverConnector.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
            expect(geoserverConnector.updateLayerGroup)
                .to.have.been.calledWith(wmtsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
            expect(geoserverConnector.deleteAllUnnecessaryGeoserverWmtsLayers)
                .to.have.been.calledWith(wmtsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
        });
    });
});
