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
    it('it should return "ok"', (done) => {
      chai.request(server)
      .get('/api/status')
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal('OK');
        done();
      });
    });
  });

  describe('/api/status', () => {
    it('it should fail with a bad host', (done) => {
      chai.request(server)
      .get('/api/status')
      .set('host', "host.invalid")
      .end((err, res) => {
        expect(res.status).to.equal(400);
        done();
      });
    });
  });

  describe('/api/auth', () => {
    describe('/api/auth/status', () => {
      it('it should not be signed in', (done) => {
        chai.request(server)
        .get('/api/auth/status')
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.signed_in).to.equal(false);
          done();
        });
      });
    });

    describe('/api/auth/sign-in', () => {
      it('from invalid IP, it should not sign-in', (done) => {
        process.env["ALLOWED_IPS"] = "";

        chai.request(server)
        .get('/api/auth/sign-in?redirect=/private-example.html')
        .redirects(0)
        .end((err, res) => {
          expect(res.status).to.equal(302);

          const headers = Object.keys(res.headers);
          expect(headers).to.include.members(["location", "set-cookie"]);

          const cookie_val = res.header["set-cookie"][0].split("=")[1].split(".")[0];
          expect(cookie_val).to.equal("s%3A");

          expect(res.header.location).to.equal("/");
          done();
        });
      });
    });

    describe('/api/auth/sign-in', () => {
      it('from valid IP, it should sign-in and redirect', (done) => {
        process.env["ALLOWED_IPS"] = "0.0.0.0/0";

        chai.request(server)
        .get('/api/auth/sign-in?redirect=/private-example.html')
        .redirects(0)
        .end((err, res) => {
          expect(res.status).to.equal(302);

          const headers = Object.keys(res.headers);
          expect(headers).to.include.members(["location", "set-cookie"]);

          auth_cookie = res.header["set-cookie"][0].split(";")[0];

          expect(res.header.location).to.equal("/private-example.html");
          done();
        });
      });
    });


    describe('/api/auth/status', () => {
      it('it should be signed in with valid cookie (from previous request)', (done) => {
        chai.request(server)
        .get('/api/auth/status')
        .set('cookie', auth_cookie)
        .end((err, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.signed_in).to.equal(true);
          done();
        });
      });
    });
  });
});
