const expect         = require("chai").expect;
const origin_request = require("./router.js");

fixture = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/.well-known/status",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_1 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "//guidance.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ],
            "origin": [
              {
                "key": "Origin",
                "value": "d123.cf.net"
              }
            ],
            "ignore-this": [
              {
                "key": "ignore-this",
                "value": "123"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_2 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/private-example.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_3 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/index.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ],
            "cookie": [
              {
                "key": "Cookie",
                "value": "Session=s%3A%7B%22signed_in%22%3Atrue%7D.YZC6hJ1xWVfbngz220Dl3pS5YMGNBCZCp4Ynay%2BkgZI"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_4 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/example-file/File Name With Spaces.pdf",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_5 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

describe("origin_request", function() {
  it('no fixture - to return false', function(done) {
    origin_request.wrap_handler({}, {}, function(na, res) {
      expect(res).to.equal(false);
      done();
    });
  });

  it('fixture - to return "OK"', function(done) {
    origin_request.wrap_handler(fixture, {}, function(na, res) {
      expect(res.status).to.equal(200);
      expect(res.body).to.equal('OK');
      done();
    });
  });

  it('fixture_1 - to be valid', function(done) {
    origin_request.wrap_handler(fixture_1, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/guidance/');
      done();
    });
  });

  it('fixture_2 - testing private routes (deny)', function(done) {
    origin_request.wrap_handler(fixture_2, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/api/auth/sign-in?redirect=/private-example.html');
      done();
    });
  });

  it('fixture_3', function(done) {
    origin_request.wrap_handler(fixture_3, {}, function(na, res) {
      expect(res.uri).to.equal('/index.html');
      done();
    });
  });

  it('fixture_4 - test URI with spaces', function(done) {
    origin_request.wrap_handler(fixture_4, {}, function(na, res) {
      expect(res.uri).to.equal('/example-file/File%20Name%20With%20Spaces.pdf');
      done();
    });
  });

  it('fixture_5', function(done) {
    origin_request.wrap_handler(fixture_5, {}, function(na, res) {
      expect(res.uri).to.equal('/index.html');
      done();
    });
  });
});
