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
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer, type, layerSearchingParameters, wmsLayerSearchingParameters;
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

        geoserverRepository = new GeoserverRepository(config.unit_test);

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());

        type = geoserverRepository.types.WMSLAYER;
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    describe("testing wms layer existance", () => {

        beforeEach(() => {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    it("should get wms Layer", async () => {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        const wmsLayerDetails = { wmsLayer: wmsLayerConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmsLayerDetails));

        const result = await geoserverRepository.getWmsLayer(wmsLayerConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmsLayerConfig);
        expect(result).to.be.eql(wmsLayerDetails);
    });

    describe("get wms layer request parameters", () => {

        it("should return request parameters without special layer list", async () => {

            const result = await geoserverRepository.getWmsLayerRequestParameters(wmsLayerConfig);

            expect(result.length).to.be.eql(wmsLayerConfig.layerNames.split(",").length);
            expect(result[0] && result[1]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
            expect(result[1].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
        });

        it("should return request parameters with special layer list", async () => {
            const layerList = ["ch.are.alpenkonvention"];

            const result = await geoserverRepository.getWmsLayerRequestParameters(wmsLayerConfig, layerList);

            expect(result.length).to.be.eql(layerList.length);
            expect(result[0]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
        });
    });

    it("should return wms layer request object", () => {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        const requestObject = geoserverRepository.wmsLayerRequestObject(wmsLayerConfig);
        expect(requestObject).to.be.eql({
            wmsLayer: {
                name: wmsLayerConfig.layerName,
                nativeName: wmsLayerConfig.nativeName,
                namespace: wmsLayerConfig.nameSpace ? wmsLayerConfig.nameSpace : geoserverRepository.geoserver.workspace,
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
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "wmsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"])))
                .to.be.eql("wmslayers");
        });

        it("should return correct url with get", () => {
            expect(_.contains(geoserverRepository.resolver.get(type, wmsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.get(type, wmsLayerConfig).split(["/"]), "wmsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.get(type, wmsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.get(type, wmsLayerConfig).split(["/"])))
                .to.be.eql("ch_ch_blw_alpprodukte");
        });
    });


    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverRepository.wmsLayerExists = sinon.stub();
            geoserverRepository.issueWmsLayerCreateRequest = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", async () => {
            geoserverRepository.wmsLayerExists.returns(Promise.resolve(false));

            const result = await geoserverRepository.makeSureWmsLayerExists({}, wmsLayerConfig);

            expect(geoserverRepository.issueWmsLayerCreateRequest).callCount(1);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });

        it("should not create new layer and return its name", async () => {
            geoserverRepository.wmsLayerExists.returns(Promise.resolve(true));

            const result = await geoserverRepository.makeSureWmsLayerExists({}, wmsLayerConfig);

            expect(geoserverRepository.issueWmsLayerCreateRequest).callCount(0);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });
    });

    describe("create not existing layers", () => {

        beforeEach(() => {
            geoserverRepository.getWmsLayerRequestParameters = sinon.stub();
            geoserverRepository.makeSureWmsLayerExists = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", async () => {
            geoserverRepository.getWmsLayerRequestParameters.returns(Promise.resolve(["layer1", "layer2"]));

            await geoserverRepository.createNotExistingWmsLayers(wmsLayerConfig);

            expect(geoserverRepository.makeSureWmsLayerExists).callCount(2);
        });

    });

    it("should create wms layer", async () => {
        geoserverRepository.createNotExistingWmsLayers = sinon.stub().returns(Promise.resolve(["layer1", "layer2"]));
        geoserverRepository.createLayerGroup = sinon.stub();

        await geoserverRepository.createWmsLayer(wmsLayerConfig);

        expect(geoserverRepository.createLayerGroup).to.have.been.calledWith(wmsLayerConfig, ["layer1", "layer2"]);
    });

    describe("delete wms layer everywhere", () => {

        beforeEach(() => {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverRepository.deleteGeoserverObject = sinon.stub();
            geoserverRepository.deleteGeoserverObject.onFirstCall().returns(Promise.resolve());

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wms layer from layer list and wms store layer list", async () => {
            geoserverRepository.wmsLayerExists = sinon.stub().returns(Promise.resolve(true));
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

            await geoserverRepository.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(geoserverRepository.deleteGeoserverObject).callCount(2);
        });

        it("should not delte wms layer from layer list and wms store layer list because layer doesn't exists", async () => {
            geoserverRepository.wmsLayerExists = sinon.stub().returns(Promise.resolve(false));

            await geoserverRepository.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters);

            expect(geoserverRepository.deleteGeoserverObject).callCount(0);
        });
    });

    describe("delete wms layer", () => {

        beforeEach(() => {
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve());
            geoserverRepository.getWmsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverRepository.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", async () => {

            await geoserverRepository.deleteWmsLayer(wmsLayerConfig);

            expect(geoserverRepository.deleteGeoserverObject).callCount(1);
            expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(geoserverRepository.types.LAYERGROUP, wmsLayerConfig);
            expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(2);
            expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
            expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmsLayerParam2");
        });
    });

    describe("delete all unnecessary geoserver layers", () => {

        beforeEach(() => {
            geoserverRepository.getWmsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverRepository.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", async () => {
            const layersToDelete = ["layer1", "layer2"];

            await geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete);

            expect(geoserverRepository.getWmsLayerRequestParameters).callCount(1);
            expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(2);
            expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
        });

        it("should return because there is no layers to delete", async () => {
            const layersToDelete = [];

            await geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete);

            expect(geoserverRepository.getWmsLayerRequestParameters).callCount(0);
            expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(0);
        });
    });

    describe("update wms layers", () => {

        beforeEach(() => {
            geoserverRepository.layerGroupExists = sinon.stub().returns(Promise.resolve(true));

            geoserverRepository.updateLayerGroup = sinon.stub();
            geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers = sinon.stub();
            geoserverRepository.createNotExistingWmsLayers = sinon.stub().returns(Promise.resolve([
                "ch.blw.alpprodukte",
                "ch.vbs.armeelogistikcenter"
            ]));
        });

        it("should update wms layer", async () => {
            const existingExternalWmsLayer = _.clone(wmsLayerConfig);
            existingExternalWmsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            await geoserverRepository.updateWmsLayer(wmsLayerConfig, existingExternalWmsLayer);

            expect(geoserverRepository.createNotExistingWmsLayers).callCount(1);
            expect(geoserverRepository.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
            expect(geoserverRepository.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
            expect(geoserverRepository.updateLayerGroup)
                .to.have.been.calledWith(wmsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
            expect(geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers)
                .to.have.been.calledWith(wmsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
        });
    });
});
