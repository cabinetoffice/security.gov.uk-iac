//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('./app');
const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

let auth_cookie = "";

describe('/api', () => {
  describe('/api/status', () => {
    it('it should return "ok"', async () => {
      let res = await chai.request(server)
      .get('/api/status');

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('OK');
    });
  });

  describe('/api/status', () => {
    it('it should fail with a bad host', async () => {
      let res = await chai.request(server)
      .get('/api/status')
      .set('host', "host.invalid");

      expect(res.status).to.equal(400);
    });
  });

  describe('/api/auth', () => {
    describe('/api/auth/status', () => {
      it('it should not be signed in', async () => {
        let res = await chai.request(server)
        .get('/api/auth/status');

        expect(res.status).to.equal(200);
        expect(res.body.signed_in).to.equal(false);
      });
    });

    describe('/api/auth/sign-in', () => {
      it('from invalid IP, it should not sign-in', async () => {
        process.env["ALLOWED_IPS"] = "";

        let res = await chai.request(server)
        .get('/api/auth/sign-in?redirect=/private-example.html')
        .redirects(0);

        expect(res.status).to.equal(302);

        const headers = Object.keys(res.headers);
        expect(headers).to.include.members(["location", "set-cookie"]);

        const cookie_val = res.header["set-cookie"][0].split("=")[1].split(".")[0];
        expect(cookie_val).to.equal("s%3A");

        expect(res.header.location).to.equal("/no-access");
      });
    });

    describe('/api/auth/sign-in', () => {
      it('from valid IP, it should sign-in and redirect', async () => {
        process.env["ALLOWED_IPS"] = "0.0.0.0/0";

        let res = await chai.request(server)
        .get('/api/auth/sign-in?redirect=/private-example.html')
        .redirects(0);

        expect(res.status).to.equal(302);

        const headers = Object.keys(res.headers);
        expect(headers).to.include.members(["location", "set-cookie"]);

        auth_cookie = res.header["set-cookie"][0].split(";")[0];

        expect(res.header.location).to.equal("/private-example.html");
      });
    });


    describe('/api/auth/status', () => {
      it('it should be signed in with valid cookie (from previous request)', async () => {

        let res = await chai.request(server)
        .get('/api/auth/status')
        .set('cookie', auth_cookie);

        expect(res.status).to.equal(200);
        expect(res.body.signed_in).to.equal(true);
      });
    });
  });
});
