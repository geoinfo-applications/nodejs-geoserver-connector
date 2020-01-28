"use strict";


// eslint-disable-next-line max-statements
describe("Geoserver Wms Layer Test ", () => {

    const _ = require("underscore");
    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverConnector = require("../../../../server/domain/geoserver/GeoserverConnector");

    let geoserverConnector, geoserverMockServer, type, layerSearchingParameters, wmsLayerSearchingParameters;
    let wmsLayerConfig;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(async () => {
        wmsLayerConfig = {
            id: 227,
            name: "produkte",
            label: "Produkte",
            layerNames: "ch.blw.alpprodukte,ch.blw.bergprodukte",
            externalWmsService: {
                id: 45,
                name: "ch",
                label: "CH",
                url: "http://wms.geo.admin.ch",
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

        type = geoserverConnector.types.WMSLAYER;
    });

    describe("testing wms layer existance", () => {

        beforeEach(() => {
            geoserverConnector.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverConnector.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverConnector.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverConnector.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverConnector.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverConnector.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverConnector.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    it("should get wms Layer", async () => {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        const wmsLayerDetails = { wmsLayer: wmsLayerConfig };
        geoserverConnector.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmsLayerDetails));

        const result = await geoserverConnector.getWmsLayer(wmsLayerConfig);

        expect(geoserverConnector.getGeoserverObject).to.have.been.calledWith(type, wmsLayerConfig);
        expect(result).to.be.eql(wmsLayerDetails);
    });

    describe("get wms layer request parameters", () => {

        it("should return request parameters without special layer list", async () => {

            const result = await geoserverConnector.getWmsLayerRequestParameters(wmsLayerConfig);

            expect(result.length).to.be.eql(wmsLayerConfig.layerNames.split(",").length);
            expect(result[0] && result[1]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
            expect(result[1].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
        });

        it("should return request parameters with special layer list", async () => {
            const layerList = ["ch.are.alpenkonvention"];

            const result = await geoserverConnector.getWmsLayerRequestParameters(wmsLayerConfig, layerList);

            expect(result.length).to.be.eql(layerList.length);
            expect(result[0]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
        });
    });

    it("should return wms layer request object", () => {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        const requestObject = geoserverConnector.wmsLayerRequestObject(wmsLayerConfig);
        expect(requestObject).to.be.eql({
            wmsLayer: {
                name: wmsLayerConfig.layerName,
                nativeName: wmsLayerConfig.nativeName,
                namespace: wmsLayerConfig.nameSpace ? wmsLayerConfig.nameSpace : geoserverConnector.geoserver.workspace,
                srs: wmsLayerConfig.srs ? wmsLayerConfig.srs : "EPSG:2056",
                wmsStore: { name: wmsLayerConfig.externalWmsService.name },
                projectionPolicy: "REPROJECT_TO_DECLARED"
            }
        });
    });

    describe("resolver", () => {

        beforeEach(() => {
            wmsLayerConfig.layerName = "ch_ch_blw_alpprodukte";
        });

        it("should return correct url with create", () => {
            expect(_.contains(geoserverConnector.resolver.create(type, wmsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.create(type, wmsLayerConfig).split(["/"]), "wmsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.create(type, wmsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverConnector.resolver.create(type, wmsLayerConfig).split(["/"])))
                .to.be.eql("wmslayers");
        });

        it("should return correct url with get", () => {
            expect(_.contains(geoserverConnector.resolver.get(type, wmsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.get(type, wmsLayerConfig).split(["/"]), "wmsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverConnector.resolver.get(type, wmsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverConnector.resolver.get(type, wmsLayerConfig).split(["/"])))
                .to.be.eql("ch_ch_blw_alpprodukte");
        });
    });


    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverConnector.wmsLayerExists = sinon.stub();
            geoserverConnector.issueWmsLayerCreateRequest = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", async () => {
            geoserverConnector.wmsLayerExists.returns(Promise.resolve(false));

            const result = await geoserverConnector.makeSureWmsLayerExists({}, wmsLayerConfig);

            expect(geoserverConnector.issueWmsLayerCreateRequest).callCount(1);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });

        it("should not create new layer and return its name", async () => {
            geoserverConnector.wmsLayerExists.returns(Promise.resolve(true));

            const result = await geoserverConnector.makeSureWmsLayerExists({}, wmsLayerConfig);

            expect(geoserverConnector.issueWmsLayerCreateRequest).callCount(0);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });
    });

    describe("create not existing layers", () => {

        beforeEach(() => {
            geoserverConnector.getWmsLayerRequestParameters = sinon.stub();
            geoserverConnector.makeSureWmsLayerExists = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", async () => {
            geoserverConnector.getWmsLayerRequestParameters.returns(Promise.resolve(["layer1", "layer2"]));

            await geoserverConnector.createNotExistingWmsLayers(wmsLayerConfig);

            expect(geoserverConnector.makeSureWmsLayerExists).callCount(2);
        });

    });

    it("should create wms layer", async () => {
        geoserverConnector.createNotExistingWmsLayers = sinon.stub().returns(Promise.resolve(["layer1", "layer2"]));
        geoserverConnector.createLayerGroup = sinon.stub();

        await geoserverConnector.createWmsLayer(wmsLayerConfig);

        expect(geoserverConnector.createLayerGroup).to.have.been.calledWith(wmsLayerConfig, ["layer1", "layer2"]);
    });

    describe("delete wms layer everywhere", () => {

        beforeEach(() => {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverConnector.deleteGeoserverObject = sinon.stub();
            geoserverConnector.deleteGeoserverObject.onFirstCall().returns(Promise.resolve());

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wms layer from layer list and wms store layer list", async () => {
            geoserverConnector.wmsLayerExists = sinon.stub().returns(Promise.resolve(true));
            geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

            await geoserverConnector.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(geoserverConnector.deleteGeoserverObject).callCount(2);
        });

        it("should not delte wms layer from layer list and wms store layer list because layer doesn't exists", async () => {
            geoserverConnector.wmsLayerExists = sinon.stub().returns(Promise.resolve(false));

            await geoserverConnector.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(geoserverConnector.deleteGeoserverObject).callCount(0);
        });
    });

    describe("delete wms layer", () => {

        beforeEach(() => {
            geoserverConnector.deleteGeoserverObject = sinon.stub().returns(Promise.resolve());
            geoserverConnector.getWmsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverConnector.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", async () => {

            await geoserverConnector.deleteWmsLayer(wmsLayerConfig);

            expect(geoserverConnector.deleteGeoserverObject).callCount(1);
            expect(geoserverConnector.deleteGeoserverObject).to.have.been.calledWith(geoserverConnector.types.LAYERGROUP, wmsLayerConfig);
            expect(geoserverConnector.deleteWmsLayerEverywhere).callCount(2);
            expect(geoserverConnector.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
            expect(geoserverConnector.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmsLayerParam2");
        });
    });

    describe("delete all unnecessary geoserver layers", () => {

        beforeEach(() => {
            geoserverConnector.getWmsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverConnector.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", async () => {
            const layersToDelete = ["layer1", "layer2"];

            await geoserverConnector.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete);

            expect(geoserverConnector.getWmsLayerRequestParameters).callCount(1);
            expect(geoserverConnector.deleteWmsLayerEverywhere).callCount(2);
            expect(geoserverConnector.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
        });

        it("should return because there is no layers to delete", async () => {
            const layersToDelete = [];

            await geoserverConnector.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete);

            expect(geoserverConnector.getWmsLayerRequestParameters).callCount(0);
            expect(geoserverConnector.deleteWmsLayerEverywhere).callCount(0);
        });
    });

    describe("update wms layers", () => {

        beforeEach(() => {
            geoserverConnector.layerGroupExists = sinon.stub().returns(Promise.resolve(true));

            geoserverConnector.updateLayerGroup = sinon.stub();
            geoserverConnector.deleteAllUnnecessaryGeoserverWmsLayers = sinon.stub();
            geoserverConnector.createNotExistingWmsLayers = sinon.stub().returns(Promise.resolve([
                "ch.blw.alpprodukte",
                "ch.vbs.armeelogistikcenter"
            ]));
        });

        it("should update wms layer", async () => {
            const existingExternalWmsLayer = _.clone(wmsLayerConfig);
            existingExternalWmsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            await geoserverConnector.updateWmsLayer(wmsLayerConfig, existingExternalWmsLayer);

            expect(geoserverConnector.createNotExistingWmsLayers).callCount(1);
            expect(geoserverConnector.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
            expect(geoserverConnector.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
            expect(geoserverConnector.updateLayerGroup)
                .to.have.been.calledWith(wmsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
            expect(geoserverConnector.deleteAllUnnecessaryGeoserverWmsLayers)
                .to.have.been.calledWith(wmsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
        });
    });
});
