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
                "value": "www.nonprod.security.gov.uk"
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
                "value": "www.nonprod.security.gov.uk"
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
          "uri": "/private-example",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.nonprod.security.gov.uk"
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
                "value": "www.nonprod.security.gov.uk"
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
                "value": "www.nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_4_5 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/example-file/file%20name%20with%20spaces.pdf",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.nonprod.security.gov.uk"
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
                "value": "www.nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_6 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/robots.txt",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.nonprod.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_7 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/robots.txt",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_8 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/guidance/",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_9 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/guidance",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_10 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/guidance/index.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_11 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/guidance.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_12 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/private-example/index.html",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
              }
            ]
          }
        }
      }
    }
  ]
}

fixture_13 = {
  "Records": [
    {
      "cf": {
        "config": {
          "distributionId": "EXAMPLE"
        },
        "request": {
          "uri": "/example-file/",
          "method": "GET",
          "clientIp": "2001:cdba::3257:9652",
          "headers": {
            "host": [
              {
                "key": "Host",
                "value": "www.security.gov.uk"
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
      expect(headers).to.include.members(["location", "set-cookie"]);
      expect(res.headers["location"][0].value).to.equal('/api/auth/sign-in');
      expect(res.headers["set-cookie"][0].value).to.match(/L3ByaXZhdGUtZXhhbXBsZQ==/);
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
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/example-file/file%20name%20with%20spaces.pdf');
      done();
    });
  });

  it('fixture_4_5 - test URI with spaces', function(done) {
    origin_request.wrap_handler(fixture_4_5, {}, function(na, res) {
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

  it('fixture_6', function(done) {
    origin_request.wrap_handler(fixture_6, {}, function(na, res) {
      expect(res.status).to.equal(200);
      expect(res.body).to.contain('Disallow');
      done();
    });
  });

  it('fixture_7', function(done) {
    origin_request.wrap_handler(fixture_7, {}, function(na, res) {
      expect(res.status).to.equal(200);
      expect(res.body).to.contain('Allow');
      done();
    });
  });

  it('fixture_8', function(done) {
    origin_request.wrap_handler(fixture_8, {}, function(na, res) {
      expect(res.uri).to.equal('/guidance/index.html');
      done();
    });
  });

  it('fixture_9', function(done) {
    origin_request.wrap_handler(fixture_9, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/guidance/');
      done();
    });
  });

  it('fixture_10', function(done) {
    origin_request.wrap_handler(fixture_10, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/guidance/');
      done();
    });
  });

  it('fixture_11', function(done) {
    origin_request.wrap_handler(fixture_11, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/guidance/');
      done();
    });
  });

  it('fixture_12', function(done) {
    origin_request.wrap_handler(fixture_12, {}, function(na, res) {
      const headers = Object.keys(res.headers);
      expect(headers).to.include.members(["location"]);
      expect(res.headers["location"][0].value).to.equal('/private-example');
      done();
    });
  });

  it('fixture_13', function(done) {
    origin_request.wrap_handler(fixture_13, {}, function(na, res) {
      expect(res.uri).to.equal('/not-found.html');
      done();
    });
  });
});
