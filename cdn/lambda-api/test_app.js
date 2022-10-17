const dotenv = require('dotenv');
dotenv.config();

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
        expect(cookie_val).to.contain("signed_in%22%3Afalse");
        expect(res.header.location).to.contain("/auth/oidc?");
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

    describe('/api/auth/oidc_callback', () => {
      it('oidc_callback should work', async () => {
        process.env["ALLOWED_IPS"] = "";

        let res = await chai.request(server)
        .get('/api/auth/sign-in?redirect=/private-example.html')
        .redirects(0);
        auth_cookie = res.header["set-cookie"][0].split(";")[0];

        const ac = decodeURIComponent(auth_cookie).split('"');
        const state = ac[9];

        let res2 = await chai.request(server)
        .get('/api/auth/oidc_callback?code=123&state=' + state)
        .set('cookie', auth_cookie)
        .redirects(0);

        console.log(res2.body);

        expect(res2.status).not.to.equal(200);
      });
    });


    describe('/api/auth/sign-out', () => {
      it('it should sign-out and redirect home', async () => {
        let res = await chai.request(server)
        .get('/api/auth/sign-out')
        .redirects(0);

        expect(res.status).to.equal(302);

        const headers = Object.keys(res.headers);
        expect(headers).to.include.members(["location", "set-cookie"]);

        const cookie_val = res.header["set-cookie"][0].split("=")[1].split(".")[0];
        expect(cookie_val).to.equal("s%3A");

        expect(res.header.location).to.equal("/");
      });
    });
  });
});
