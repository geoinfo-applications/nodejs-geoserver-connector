"use strict";

// eslint-disable-next-line max-statements
describe("Geoserver Layer Group Test ", () => {

    const _ = require("underscore");
    const chai = require("chai");
    const expect = chai.expect;
    const sinon = require("sinon");
    const sinonChai = require("sinon-chai");
    chai.use(sinonChai);

    const config = require("../../config");
    const GeoserverRepository = require("../../../../server/domain/geoserver/GeoserverRepository");

    let geoserverRepository, geoserverMockServer, type;
    let layerGroupConfig, allLayerNames;

    before(() => {
        geoserverMockServer = sinon.fakeServer.create();
    });

    after(() => {
        geoserverMockServer.restore();
    });

    beforeEach(() => {
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

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.isGeoserverRunning.name);
        geoserverRepository.isGeoserverRunning.returns(Promise.resolve(JSON.stringify({ about: { resource: {} } })));

        sinon.stub(geoserverRepository, GeoserverRepository.prototype.initializeWorkspace.name);
        geoserverRepository.initializeWorkspace.returns(Promise.resolve());

        type = geoserverRepository.types.LAYERGROUP;
    });

    afterEach(() => {
        geoserverRepository = null;
    });

    it("should check wms layer existance", async () => {
        geoserverRepository.geoserverObjectExists = sinon.stub().returns(Promise.resolve(true));

        const result = await geoserverRepository.layerGroupExists(layerGroupConfig);

        expect(geoserverRepository.geoserverObjectExists).to.have.been.calledWith(type, layerGroupConfig);
        expect(result).to.be.eql(true);
    });

    it("should get layer group", async () => {
        const layerGroupDetails = { layerGroup: layerGroupConfig };
        geoserverRepository.getGeoserverObject = sinon.stub().returns(Promise.resolve(layerGroupDetails));

        const result = await geoserverRepository.getLayerGroup(layerGroupConfig);

        expect(geoserverRepository.getGeoserverObject).to.have.been.calledWith(type, layerGroupConfig);
        expect(result).to.be.eql(layerGroupDetails);
    });

    it("should return layer group request object", () => {

        const layerGroupRequestObject = geoserverRepository.layerGroupRequestObject(layerGroupConfig, allLayerNames);

        expect(layerGroupRequestObject).to.have.all.keys("layerGroup", "srs", "projectionPolicy");
        expect(layerGroupRequestObject.layerGroup).to.have.all.keys("name", "title", "layers", "styles");
        expect(layerGroupRequestObject.layerGroup.name).to.be.eql("alpprodukte");
        expect(layerGroupRequestObject.layerGroup.title).to.be.eql("Alpprodukte");
        expect(layerGroupRequestObject.layerGroup.layers.layer.length).to.be.eql(2);
        expect(layerGroupRequestObject.layerGroup.layers.layer[0]).to.be.eql({ enabled: true, name: "ch.blw.alpprodukte" });
        expect(layerGroupRequestObject.layerGroup.styles.style[0]).to.be.eql("");
    });

    describe("resolver", () => {

        beforeEach(() => {
            layerGroupConfig.layerName = "alpprodukte";
        });

        it("should return correct url create", () => {
            const correctCreateUrl = geoserverRepository.resolver.create(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctCreateUrl, "layergroups")).to.be.eql(true);
        });

        it("should return correct url with get", () => {
            const correctGetUrl = geoserverRepository.resolver.get(type, layerGroupConfig).split(["/"]);

            expect(_.contains(correctGetUrl, "layergroups")).to.be.eql(true);
            expect(_.contains(correctGetUrl, "alpprodukte")).to.be.eql(true);
        });
    });

    describe("create layer group", () => {

        beforeEach(() => {
            layerGroupConfig.layerName = "alpprodukte";
            geoserverRepository.layerGroupExists = sinon.stub();
            geoserverRepository.issueLayerGroupCreateRequest = sinon.stub();
        });

        it("should create new layer group", async () => {
            geoserverRepository.layerGroupExists.returns(Promise.resolve(false));

            await geoserverRepository.createLayerGroup(layerGroupConfig, allLayerNames);

            expect(geoserverRepository.issueLayerGroupCreateRequest).callCount(1);
        });

        it("should not create new layer group", async () => {
            geoserverRepository.layerGroupExists.returns(Promise.resolve(true));

            try {
                await geoserverRepository.createLayerGroup(layerGroupConfig, allLayerNames);
            } catch (error) {
                expect(error).to.match(/already exists/);
                return;
            }
            throw new Error("should fail");
        });
    });
});
