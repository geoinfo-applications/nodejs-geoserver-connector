"use strict";


describe("Geoserver Wmts Layer Test ", function () {

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

    var geoserverRepository, geoserverMockServer, type, layerSearchingParameters, wmtsLayerSearchingParameters;
    var wmtsLayerConfig;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
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

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());

        type = geoserverRepository.types.WMTSLAYER;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    describe("testing wmts layer existance", function () {

        beforeEach(function () {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(true);
                done();
            }).catch(done);
        });

        it("should return that layer don't exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(false);
                done();
            }).catch(done);
        });
    });

    describe("make sure layer exists", function () {

        beforeEach(function () {
            geoserverRepository.geoserverObjectExists = sinon.stub();

            layerSearchingParameters = { name: wmtsLayerConfig.layerName, workspace: geoserverRepository.geoserver.workspace };
            wmtsLayerSearchingParameters = wmtsLayerConfig;
        });

        it("should return that layer exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(true));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(true);
                done();
            }).catch(done);
        });

        it("should return that layer don't exist", function (done) {
            geoserverRepository.geoserverObjectExists.onFirstCall().returns(Q.when(false));
            geoserverRepository.geoserverObjectExists.onSecondCall().returns(Q.when(true));

            geoserverRepository.wmtsLayerExists(layerSearchingParameters, wmtsLayerSearchingParameters).then(function (result) {
                expect(result).to.be.eql(false);
                done();
            }).catch(done);
        });
    });

    it("should get wmts Layer", function (done) {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";

        var wmtsLayerDetails = { wmtsLayer: wmtsLayerConfig };

        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(wmtsLayerDetails));

        geoserverRepository.getWmtsLayer(wmtsLayerConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, wmtsLayerConfig);
            expect(result).to.be.eql(wmtsLayerDetails);
            done();
        }).catch(done);
    });

    describe("get wmts layer request parameters", function () {

        it("should return request parameters without special layer list", function (done) {
            geoserverRepository.getWmtsLayerRequestParameters(wmtsLayerConfig).then(function (result) {
                expect(result.length).to.be.eql(wmtsLayerConfig.layerNames.split(",").length);
                expect(result[0] && result[1]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
                expect(result[0].layerRequestParameters && result[1].layerRequestParameters).to.have.all.keys("name", "workspace");
                expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_alpprodukte");
                expect(result[1].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_blw_bergprodukte");
                done();
            }).catch(done);
        });

        it("should return request parameters with special layer list", function (done) {
            var layerList = ["ch.are.alpenkonvention"];

            geoserverRepository.getWmtsLayerRequestParameters(wmtsLayerConfig, layerList).then(function (result) {
                expect(result.length).to.be.eql(layerList.length);
                expect(result[0]).to.have.all.keys("wmtsLayerRequestParameters", "layerRequestParameters");
                expect(result[0].layerRequestParameters).to.have.all.keys("name", "workspace");
                expect(result[0].wmtsLayerRequestParameters.layerName).to.be.eql("ch_ch_are_alpenkonvention");
                done();
            }).catch(done);
        });
    });

    it("should return wmts layer request object", function (done) {
        wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        wmtsLayerConfig.nativeName = "ch_ch_blw_alpprodukte";

        var requestObject = geoserverRepository.wmtsLayerRequestObject(wmtsLayerConfig);
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
        done();

    });

    describe("resolver", function () {
        beforeEach(function () {
            wmtsLayerConfig.layerName = "ch_ch_blw_alpprodukte";
        });

        it("should return correct url with create", function () {
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "geoportal"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "wmtsstores"))
                .to.be.eql(true);
            expect(_.contains(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"]), "ch"))
                .to.be.eql(true);
            expect(_.last(geoserverRepository.resolver.create(type, wmtsLayerConfig).split(["/"])))
                .to.be.eql("wmtslayers");
        });

        it("should return correct url with get", function () {
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


    describe("make sure layer exists", function () {
        beforeEach(function () {
            geoserverRepository.wmtsLayerExists = sinon.stub();
            geoserverRepository.issueWmtsLayerCreateRequest = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should create new layer and return its name", function (done) {
            geoserverRepository.wmtsLayerExists.returns(new Q.when(false));

            geoserverRepository.makeSureWmtsLayerExists({}, wmtsLayerConfig).then(function (result) {
                expect(geoserverRepository.issueWmtsLayerCreateRequest).callCount(1);
                expect(result).to.be.eql("ch.blw.alpprodukte");
                done();
            }).catch(done);
        });

        it("should not create new layer and return its name", function (done) {
            geoserverRepository.wmtsLayerExists.returns(new Q.when(true));

            geoserverRepository.makeSureWmtsLayerExists({}, wmtsLayerConfig).then(function (result) {
                expect(geoserverRepository.issueWmtsLayerCreateRequest).callCount(0);
                expect(result).to.be.eql("ch.blw.alpprodukte");
                done();
            }).catch(done);
        });
    });

    describe("create not existing layers", function () {
        beforeEach(function () {
            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub();
            geoserverRepository.makeSureWmtsLayerExists = sinon.stub();

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should check two layers if exists", function (done) {
            geoserverRepository.getWmtsLayerRequestParameters.returns(Q.when(["layer1", "layer2"]));

            geoserverRepository.createNotExistingWmtsLayers(wmtsLayerConfig).then(function () {
                expect(geoserverRepository.makeSureWmtsLayerExists).callCount(2);
                done();
            }).catch(done);
        });
    });

    it("should create wmts layer", function (done) {
        geoserverRepository.createNotExistingWmtsLayers = sinon.stub().returns(new Q(["layer1", "layer2"]));
        geoserverRepository.createLayerGroup = sinon.stub();

        geoserverRepository.createWmtsLayer(wmtsLayerConfig).then(function () {
            expect(geoserverRepository.createLayerGroup).to.have.been.calledWith(wmtsLayerConfig, ["layer1", "layer2"]);
            done();
        }).catch(done);
    });

    describe("delete wmts layer everywhere", function () {
        beforeEach(function () {
            layerSearchingParameters = { name: "ch.blw.alpprodukte", workspace: "ch" };
            wmtsLayerSearchingParameters = { layerName: "ch_ch_blw_alpprodukte", nativeName: "ch.blw.alpprodukte" };

            geoserverRepository.deleteGeoserverObject = sinon.stub();
            geoserverRepository.deleteGeoserverObject.onFirstCall().returns(new Q());

            wmtsLayerConfig.layerName = "ch.blw.alpprodukte";
        });

        it("should delte wmts layer from layer list and wmts store layer list", function (done) {
            geoserverRepository.wmtsLayerExists = sinon.stub().returns(new Q(true));
            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q(true));

            geoserverRepository.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(2);
                done();
            }).catch(done);
        });

        it("should not delte wmts layer from layer list and wmts store layer list because layer doesn't exists", function (done) {
            geoserverRepository.wmtsLayerExists = sinon.stub().returns(new Q(false));

            geoserverRepository.deleteWmtsLayerEverywhere(layerSearchingParameters, wmtsLayerSearchingParameters).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(0);
                done();
            }).catch(done);
        });
    });

    describe("delete wmts layer", function () {
        beforeEach(function () {

            geoserverRepository.deleteGeoserverObject = sinon.stub().returns(new Q());
            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub().returns(new Q([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverRepository.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should check 2 layers for deletion", function (done) {
            geoserverRepository.deleteWmtsLayer(wmtsLayerConfig).then(function () {
                expect(geoserverRepository.deleteGeoserverObject).callCount(1);
                expect(geoserverRepository.deleteGeoserverObject).to.have.been.calledWith(geoserverRepository.types.LAYERGROUP, wmtsLayerConfig);
                expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(2);
                expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
                expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam2", "wmtsLayerParam2");
                done();
            }).catch(done);
        });
    });

    describe("delete all unnecessary geoserver layers", function () {
        beforeEach(function () {

            geoserverRepository.getWmtsLayerRequestParameters = sinon.stub().returns(new Q([
                { layerRequestParameters: "layerParam1", wmtsLayerRequestParameters: "wmtsLayerParam1" },
                { layerRequestParameters: "layerParam2", wmtsLayerRequestParameters: "wmtsLayerParam2" }
            ]));
            geoserverRepository.deleteWmtsLayerEverywhere = sinon.stub();
        });

        it("should delete layers", function (done) {
            var layersToDelete = [ "layer1", "layer2" ];

            geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete).then(function () {
                expect(geoserverRepository.getWmtsLayerRequestParameters).callCount(1);
                expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(2);
                expect(geoserverRepository.deleteWmtsLayerEverywhere).to.have.been.calledWith("layerParam1", "wmtsLayerParam1");
                done();
            }).catch(done);
        });

        it("should return because there is no layers to delete", function (done) {
            var layersToDelete = [];

            geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers(wmtsLayerConfig, layersToDelete).then(function () {
                expect(geoserverRepository.getWmtsLayerRequestParameters).callCount(0);
                expect(geoserverRepository.deleteWmtsLayerEverywhere).callCount(0);
                done();
            }).catch(done);
        });
    });

    describe("update wmts layers", function () {
        beforeEach(function () {

            geoserverRepository.layerGroupExists = sinon.stub().returns(new Q(true));

            geoserverRepository.createNotExistingWmtsLayers = sinon.stub().returns(new Q(["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]));
            geoserverRepository.updateLayerGroup = sinon.stub();
            geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers = sinon.stub();
        });

        it("should update wmts layer", function (done) {
            var existingExternalWmtsLayer = _.clone(wmtsLayerConfig);
            existingExternalWmtsLayer.layerNames = "ch.blw.alpprodukte,ch.vbs.armeelogistikcenter";

            geoserverRepository.updateWmtsLayer(wmtsLayerConfig, existingExternalWmtsLayer).then(function () {
                expect(geoserverRepository.createNotExistingWmtsLayers).callCount(1);
                expect(geoserverRepository.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
                expect(geoserverRepository.createNotExistingWmtsLayers).to.have.been.calledWith(wmtsLayerConfig);
                expect(geoserverRepository.updateLayerGroup)
                    .to.have.been.calledWith(wmtsLayerConfig, ["ch.blw.alpprodukte", "ch.vbs.armeelogistikcenter"]);
                expect(geoserverRepository.deleteAllUnnecessaryGeoserverWmtsLayers)
                    .to.have.been.calledWith(wmtsLayerConfig, ["ch.vbs.armeelogistikcenter"]);
                done();
            }).catch(done);
        });
    });
});
