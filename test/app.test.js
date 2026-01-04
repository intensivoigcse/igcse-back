const request = require("supertest");
const { sequelize } = require("../src/models");
const app = require("../src/app").app; // export `app` separately in app.js

describe("App endpoints", () => {
    beforeAll(async () => {
        await sequelize.authenticate();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it("should return Hello World on /", async () => {
        const res = await request(app.callback()).get("/");
        expect(res.status).toBe(200);
        const body = res.body;
        const message = body.message;
        expect(message).toBe("Hello World");
    });
});
