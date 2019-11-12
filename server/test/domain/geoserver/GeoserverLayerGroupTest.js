"use strict";

describe("Geoserver Layer Group Test ", function () {

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

    var geoserverRepository, geoserverMockServer, type;
    var layerGroupConfig, allLayerNames;

    before(function () {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(function () {
        geoserverMockServer.restore();
    });

    beforeEach(function (done) {
        layerGroupConfig = {
            id: 227,
            name: "alpprodukte",
            label: "Alpprodukte",
            layerNames: "ch.blw.alpprodukte",
            externalWmsService: {
                id: 45,
                name: "ch",
                label: "ch",
                url: "http://wms.geo.admin.ch",
                username: null,
                password: null
            }
        };

        allLayerNames = ["ch.blw.alpprodukte", "ch.blw.bergprodukte"];

        geoserverRepository = new GeoserverRepository(config.unit_test);

        geoserverRepository.isGeoserverRunning = sinon.stub().returns(
            new Q(JSON.stringify({ about: { resource: {} } }))
        );
        geoserverRepository.initializeWorkspace = sinon.stub().returns(new Q());
        type = geoserverRepository.types.LAYERGROUP;

        geoserverRepository.initializeWorkspace().then(function () {
            done();
        }).catch(done);
    });

    afterEach(function () {
        geoserverRepository = null;
    });

    it("should check wms layer existance", function (done) {
        geoserverRepository.geoserverObjectExists = sinon.stub().returns(new Q(true));
        geoserverRepository.layerGroupExists(layerGroupConfig).then(function (result) {
            expect(geoserverRepository.geoserverObjectExists).to.have.been.calledWith(type, layerGroupConfig);
            expect(result).to.be.eql(true);
            done();
        }).catch(done);
    });

    it("should get layer group", function (done) {
        var layerGroupDetails = { layerGroup: layerGroupConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(new Q(layerGroupDetails));

        geoserverRepository.getLayerGroup(layerGroupConfig).then(function (result) {
            expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, layerGroupConfig);
            expect(result).to.be.eql(layerGroupDetails);
            done();
        }).catch(done);
    });

    it("should return layer group request object", function () {

        var layerGroupRequestObject = geoserverRepository.layerGroupRequestObject(layerGroupConfig, allLayerNames);

        expect(layerGroupRequestObject).to.have.all.keys("layerGroup", "srs", "projectionPolicy");
        expect(layerGroupRequestObject.layerGroup).to.have.all.keys("name", "title", "layers", "styles");
        expect(layerGroupRequestObject.layerGroup.name).to.be.eql("alpprodukte");
        expect(layerGroupRequestObject.layerGroup.title).to.be.eql("Alpprodukte");
        expect(layerGroupRequestObject.layerGroup.layers.layer.length).to.be.eql(2);
        expect(layerGroupRequestObject.layerGroup.layers.layer[0]).to.be.eql({ enabled: true, name: "ch.blw.alpprodukte" });
        expect(layerGroupRequestObject.layerGroup.styles.style[0]).to.be.eql("");
    });

    describe("resolver", function () {
        beforeEach(function () {
            layerGroupConfig.layerName = "alpprodukte";
        });

        it("should return correct url create", function () {
            var correctCreateUrl = geoserverRepository.resolver.create(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctCreateUrl, "layergroups")).to.be.eql(true);
        });

        it("should return correct url with get", function () {
            var correctGetUrl = geoserverRepository.resolver.get(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctGetUrl, "layergroups")).to.be.eql(true);
            expect(_.contains(correctGetUrl, "alpprodukte")).to.be.eql(true);
        });
    });

    describe("create layer group", function () {
        beforeEach(function () {
            layerGroupConfig.layerName = "alpprodukte";
            geoserverRepository.layerGroupExists = sinon.stub();
            geoserverRepository.issueLayerGroupCreateRequest = sinon.stub();
        });

        it("should create new layer group", function (done) {
            geoserverRepository.layerGroupExists.returns(new Q(false));

            geoserverRepository.createLayerGroup(layerGroupConfig, allLayerNames).then(function () {
                expect(geoserverRepository.issueLayerGroupCreateRequest).callCount(1);
                done();
            }).catch(done);
        });

        it("should not create new layer group", function () {
            geoserverRepository.layerGroupExists.returns(new Q(true));

            var promise = geoserverRepository.createLayerGroup(layerGroupConfig, allLayerNames);

            return promise.then(function () {
                expect(promise.isRejected()).to.be.eql(true);
            }).catch(function (error) {
                expect(error).to.match(/already exists/);
            });
        });
    });
});
