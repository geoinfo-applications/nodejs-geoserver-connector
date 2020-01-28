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
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer, type, layerSearchingParameters, wmtsLayerSearchingParameters;
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

        geoserverRepository = new GeoserverRepository(config.unit_test);

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());

        type = geoserverRepository.types.WMTSLAYER;
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    describe("testing wmts layer existance", () => {

        beforeEach(() => {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(true);
        });

        it("should return that layer don't exist", async () => {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Promise.resolve(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Promise.resolve(true));

            const result = await geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(result).to.be.eql(false);
        });
    });

    it("should get wmts Layer", async () => {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        const wmtsLayerDetails = { wmtsLayer: wmtsLayerConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(wmtsLayerDetails));

        const result = await geoserverRepository.getWmtsLayer(wmtsLayerConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmtsLayerConfig);
        expect(result).to.be.eql(wmtsLayerDetails);
    });

    describe("get wmts layer request parameters", () => {

        it("should return request parameters without special layer list", async () => {

            const result = await geoserverRepository.getWmtsLayerRequestParameters(wmtsLayerConfig);

            expect(result.length).to.be.eql(wmtsLayerConfig.layerNames.split(",").length);
            expect(result[0] && result[1]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
            expect(result[1].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
        });

        it("should return request parameters with special layer list", async () => {
            const layerList = ["ch.are.alpenkonvention"];

            const result = await geoserverRepository.getWmtsLayerRequestParameters(wmtsLayerConfig, layerList);

            expect(result.length).to.be.eql(layerList.length);
            expect(result[0]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
            expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
            expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
        });
    });

    it("should return wmts layer request object", () => {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmtsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        const requestObject = geoserverRepository.wmtsLayerRequestObject(wmtsLayerConfig);
        expect(requestObject).to.be.eql({
            wmtsLayer: {
                name: wmtsLayerConfig.layerName,
                nativeName: wmtsLayerConfig.nativeName,
                namespace: wmtsLayerConfig.nameSpace ? wmtsLayerConfig.nameSpace : geoserverRepository.geoserver.workspace,
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
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "wmtsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"])))
                .to.be.eql("wmtslayers");
        });

        it("should return correct url with get", () => {
            expect(_.contains(geoserverRepository.resolver.get(type, wmtsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.get(type, wmtsLayerConfig).split(["/"]), "wmtsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.get(type, wmtsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.get(type, wmtsLayerConfig).split(["/"])))
                .to.be.eql("ch_ch_blw_alpprodukte");
        });
    });


    describe("make sure layer exists", () => {

        beforeEach(() => {
            geoserverRepository.wmtsLayerExists = sinon.stub();
            geoserverRepository.issueWmtsLayerCreateRequest = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", async () => {
            geoserverRepository.wmtsLayerExists.returns(Promise.resolve(false));

            const result = await geoserverRepository.makeSureWmtsLayerExists({}, wmtsLayerConfig);

            expect(geoserverRepository.issueWmtsLayerCreateRequest).callCount(1);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });

        it("should not create new layer and return its name", async () => {
            geoserverRepository.wmtsLayerExists.returns(Promise.resolve(true));

            const result = await geoserverRepository.makeSureWmtsLayerExists({}, wmtsLayerConfig);

            expect(geoserverRepository.issueWmtsLayerCreateRequest).callCount(0);
            expect(result).to.be.eql("ch.blw.alpprodukte");
        });
    });

    describe("create not existing layers", () => {

        beforeEach(() => {
            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub();
            geoserverRepository.makeSureWmtsLayerExists = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", async () => {
            geoserverRepository.getWmtsLayerRequestParameters.returns(Promise.resolve(["layer1", "layer2"]));

            await geoserverRepository.createNotExistingWmtsLayers(wmtsLayerConfig);

            expect(geoserverRepository.makeSureWmtsLayerExists).callCount(2);
        });

    });

    it("should create wmts layer", async () => {
        geoserverRepository.createNotExistingWmtsLayers = sinon.stub().returns(Promise.resolve(["layer1", "layer2"]));
        geoserverRepository.createLayerGroup = sinon.stub();

        await geoserverRepository.createWmtsLayer(wmtsLayerConfig);

        expect(geoserverRepository.createLayerGroup).to.have.been.calledWith(wmtsLayerConfig, ["layer1", "layer2"]);
    });

    describe("delete wmts layer everywhere", () => {

        beforeEach(() => {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmtsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverRepository.deleteGeoserverObject = sinon.stub();
            geoserverRepository.deleteGeoserverObject.onFirstCall().returns(Promise.resolve());

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wmts layer from layer list and wmts store layer list", async () => {
            geoserverRepository.wmtsLayerExists = sinon.stub().returns(Promise.resolve(true));
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve(true));

            await geoserverRepository.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(geoserverRepository.deleteGeoserverObject).callCount(2);
        });

        it("should not delte wmts layer from layer list and wmts store layer list because layer doesn't exists", async () => {
            geoserverRepository.wmtsLayerExists = sinon.stub().returns(Promise.resolve(false));

            await geoserverRepository.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters);

            expect(geoserverRepository.deleteGeoserverObject).callCount(0);
        });
    });

    describe("delete wmts layer", () => {

        beforeEach(() => {
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(Promise.resolve());
            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverRepository.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", async () => {

            await geoserverRepository.deleteWmtsLayer(wmtsLayerConfig);

            expect(geoserverRepository.deleteGeoserverObject).callCount(1);
            expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(geoserverRepository.types.LAYERGROUP, wmtsLayerConfig);
            expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(2);
            expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
            expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmtsLayerParam2");
        });
    });

    describe("delete all unnecessary geoserver layers", () => {

        beforeEach(() => {
            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub().returns(Promise.resolve([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverRepository.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", async () => {
            const layersToDelete = ["layer1", "layer2"];

            await geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete);

            expect(geoserverRepository.getWmtsLayerRequestParameters).callCount(1);
            expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(2);
            expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
        });

        it("should return because there is no layers to delete", async () => {
            const layersToDelete = [];

            await geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete);

            expect(geoserverRepository.getWmtsLayerRequestParameters).callCount(0);
            expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(0);
        });
    });

    describe("update wmts layers", () => {

        beforeEach(() => {
            geoserverRepository.layerGroupExists = sinon.stub().returns(Promise.resolve(true));

            geoserverRepository.updateLayerGroup = sinon.stub();
            geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers = sinon.stub();
            geoserverRepository.createNotExistingWmtsLayers = sinon.stub().returns(Promise.resolve([
                "ch.blw.alpprodukte",
                "ch.vbs.armeelogistikcenter"
            ]));
        });

        it("should update wmts layer", async () => {
            const existingExternalWmtsLayer = _.clone(wmtsLayerConfig);
            existingExternalWmtsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            await geoserverRepository.updateWmtsLayer(wmtsLayerConfig, existingExternalWmtsLayer);

            expect(geoserverRepository.createNotExistingWmtsLayers).callCount(1);
            expect(geoserverRepository.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
            expect(geoserverRepository.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
            expect(geoserverRepository.updateLayerGroup)
                .to.have.been.calledWith(wmtsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
            expect(geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers)
                .to.have.been.calledWith(wmtsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
        });
    });
});
