"use strict";


describe("Geoserver Wms Layer Test ", function () {

    var Q = require("q");
    var _ = require("underscore");
    var chai = require("chai");
    var expect = chai.expect;
    var sinon = require("sinon");
    var sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    this.timeout(50);
    var config = require("../../config");
    var GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    var geoserverRepository, geoserverMockServer, type, layerSearchingParameters, wmsLayerSearchingParameters;
    var wmsLayerConfig;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
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

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());

        type = geoserverRepository.types.WMSLAYER;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    describe("testing wms layer existance", function () {

        beforeEach(function () {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(true);
                done();
            }).catch(done);
        });

        it("should return that layer don't exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(false);
                done();
            }).catch(done);
        });
    });

    describe("make sure layer exists", function () {

        beforeEach(function () {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmsLayerSearchingParameters = wmsLayerConfig;
        });

        it("should return that layer exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(true);
                done();
            }).catch(done);
        });

        it("should return that layer don't exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmsLayerExists(layerSearchingParameters, wmsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(false);
                done();
            }).catch(done);
        });
    });

    it("should get wms Layer", function (done) {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";

        var wmsLayerDetails = { wmsLayer: wmsLayerConfig };

        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(wmsLayerDetails));

        geoserverRepository.getWmsLayer(wmsLayerConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmsLayerConfig);
            expect(result).to.be.eql(wmsLayerDetails);
            done();
        }).catch(done);
    });

    describe("get wms layer request parameters", function () {

        it("should return request parameters without special layer list", function (done) {
            geoserverRepository.getWmsLayerRequestParameters(wmsLayerConfig).then(function (result) {
                expect(result.length).to.be.eql(wmsLayerConfig.layerNames.split(",").length);
                expect(result[0] && result[1]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
                expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
                expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
                expect(result[1].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
                done();
            }).catch(done);
        });

        it("should return request parameters with special layer list", function (done) {
            var layerList = ["ch.are.alpenkonvention"];

            geoserverRepository.getWmsLayerRequestParameters(wmsLayerConfig, layerList).then(function (result) {
                expect(result.length).to.be.eql(layerList.length);
                expect(result[0]).to.have.all.keys("wmsLayerRequestParameters", "layerRequestParameters");
                expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
                expect(result[0].wmsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
                done();
            }).catch(done);
        });
    });

    it("should return wms layer request object", function (done) {
        wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        var requestObject = geoserverRepository.wmsLayerRequestObject(wmsLayerConfig);
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
        done();

    });

    describe("resolver", function () {
        beforeEach(function () {
            wmsLayerConfig.layerName = "ch_ch_blw_alpprodukte";
        });

        it("should return correct url with create", function () {
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "wmsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.create(type, wmsLayerConfig).split(["/"])))
                .to.be.eql("wmslayers");
        });

        it("should return correct url with get", function () {
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


    describe("make sure layer exists", function () {
        beforeEach(function () {
            geoserverRepository.wmsLayerExists = sinon.stub();
            geoserverRepository.issueWmsLayerCreateRequest = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", function (done) {
            geoserverRepository.wmsLayerExists.returns(new Q.when(false));

            geoserverRepository.makeSureWmsLayerExists({}, wmsLayerConfig).then(function (result) {
                expect(geoserverRepository.issueWmsLayerCreateRequest).callCount(1);
                expect(result).to.be.eql("ch.blw.alpprodukte");
                done();
            }).catch(done);
        });

        it("should not create new layer and return its name", function (done) {
            geoserverRepository.wmsLayerExists.returns(new Q.when(true));

            geoserverRepository.makeSureWmsLayerExists({}, wmsLayerConfig).then(function (result) {
                expect(geoserverRepository.issueWmsLayerCreateRequest).callCount(0);
                expect(result).to.be.eql("ch.blw.alpprodukte");
                done();
            }).catch(done);
        });
    });

    describe("create not existing layers", function () {
        beforeEach(function () {
            geoserverRepository.getWmsLayerRequestParameters = sinon.stub();
            geoserverRepository.makeSureWmsLayerExists = sinon.stub();

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", function (done) {
            geoserverRepository.getWmsLayerRequestParameters.returns(Q.when(["layer1", "layer2"]));

            geoserverRepository.createNotExistingWmsLayers(wmsLayerConfig).then(function () {
                expect(geoserverRepository.makeSureWmsLayerExists).callCount(2);
                done();
            }).catch(done);
        });
    });

    it("should create wms layer", function (done) {
        geoserverRepository.createNotExistingWmsLayers = sinon.stub().returns(new Q(["layer1", "layer2"]));
        geoserverRepository.createLayerGroup = sinon.stub();

        geoserverRepository.createWmsLayer(wmsLayerConfig).then(function () {
            expect(geoserverRepository.createLayerGroup).to.have.been.calledWith(wmsLayerConfig, ["layer1", "layer2"]);
            done();
        }).catch(done);
    });

    describe("delete wms layer everywhere", function () {
        beforeEach(function () {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverRepository.deleteGeoserverObject = sinon.stub();
            geoserverRepository.deleteGeoserverObject.onFirstCall().returns(new Q());

            wmsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wms layer from layer list and wms store layer list", function (done) {
            geoserverRepository.wmsLayerExists = sinon.stub().returns(new Q(true));
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q(true));

            geoserverRepository.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(2);
                done();
            }).catch(done);
        });

        it("should not delte wms layer from layer list and wms store layer list because layer doesn't exists", function (done) {
            geoserverRepository.wmsLayerExists = sinon.stub().returns(new Q(false));

            geoserverRepository.deleteWmsLayerEverywhere(layerSearchingParameters, wmsLayerSearchingParameters).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(0);
                done();
            }).catch(done);
        });
    });

    describe("delete wms layer", function () {
        beforeEach(function () {

            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q());
            geoserverRepository.getWmsLayerRequestParameters = sinon.stub().returns(new Q([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverRepository.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", function (done) {
            geoserverRepository.deleteWmsLayer(wmsLayerConfig).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(1);
                expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(geoserverRepository.types.LAYERGROUP, wmsLayerConfig);
                expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(2);
                expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
                expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmsLayerParam2");
                done();
            }).catch(done);
        });
    });

    describe("delete all unnecessary geoserver layers", function () {
        beforeEach(function () {

            geoserverRepository.getWmsLayerRequestParameters = sinon.stub().returns(new Q([
                { layerRequestParameters: "layerParam1", wmsLayerRequestParameters: "wmsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmsLayerRequestParameters: "wmsLayerParam2" }
            ]));
            geoserverRepository.deleteWmsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", function (done) {
            var layersToDelete = [ "layer1", "layer2" ];

            geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete).then(function () {
                expect(geoserverRepository.getWmsLayerRequestParameters).callCount(1);
                expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(2);
                expect(geoserverRepository.deleteWmsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmsLayerParam1");
                done();
            }).catch(done);
        });

        it("should return because there is no layers to delete", function (done) {
            var layersToDelete = [];

            geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers(wmsLayerConfig, layersToDelete).then(function () {
                expect(geoserverRepository.getWmsLayerRequestParameters).callCount(0);
                expect(geoserverRepository.deleteWmsLayerEverywhere).callCount(0);
                done();
            }).catch(done);
        });
    });

    describe("update wms layers", function () {
        beforeEach(function () {

            geoserverRepository.layerGroupExists = sinon.stub().returns(new Q(true));

            geoserverRepository.createNotExistingWmsLayers = sinon.stub().returns(new Q(["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]));
            geoserverRepository.updateLayerGroup = sinon.stub();
            geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers = sinon.stub();
        });

        it("should update wms layer", function (done) {
            var existingExternalWmsLayer = _.clone(wmsLayerConfig);
            existingExternalWmsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            geoserverRepository.updateWmsLayer(wmsLayerConfig, existingExternalWmsLayer).then(function () {
                expect(geoserverRepository.createNotExistingWmsLayers).callCount(1);
                expect(geoserverRepository.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
                expect(geoserverRepository.createNotExistingWmsLayers).to.have.been.calledWith(wmsLayerConfig);
                expect(geoserverRepository.updateLayerGroup)
                    .to.have.been.calledWith(wmsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
                expect(geoserverRepository.deleteAllUnnecessaryGeoserverWmsLayers)
                    .to.have.been.calledWith(wmsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
                done();
            }).catch(done);
        });
    });
});
