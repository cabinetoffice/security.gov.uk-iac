const expect         = require("chai").expect;
const viewer_request = require("./router.js");

fixture_1 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'1.2.3.4'
  },
  request: {
    method: 'GET',
    uri: '/index.php',
    querystring: {},
    headers: {
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

fixture_2 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'1.2.3.4'
  },
  request: {
    method: 'GET',
    uri: '/',
    querystring: {},
    headers: {
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

fixture_3 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'1.2.3.4'
  },
  request: {
    method: 'GET',
    uri: '/.well-known/security.txt',
    querystring: {},
    headers: {
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

fixture_4 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'1.2.3.4'
  },
  request: {
    method: 'GET',
    uri: '/private-example',
    querystring: {},
    headers: {
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

fixture_5 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'1.2.3.4'
  },
  request: {
    method: 'GET',
    uri: '/private-example?testing=123',
    querystring: {},
    headers: {
      authorization: {
        value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im9saXZlci5jaGFsa0BkaWdpdGFsLmNhYmluZXQtb2ZmaWNlLmdvdi51ayIsImlhdCI6MTY1ODc1ODc2OH0.2hqreGs3JFMeDb1v2WvQGWGQmPZtQtfoblGx5NmVWns'
      },
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

fixture_6 = {
  context: {
    distributionDomainName:'d123.cloudfront.net',
    eventType:'viewer-request',
  },
  viewer: {
    ip:'10.0.0.1'
  },
  request: {
    method: 'GET',
    uri: '/private-example#testing-should-ignore',
    querystring: {},
    headers: {
      host: {
        value:'www.security.gov.uk'
      }
    },
    cookies: {}
  }
}

describe("origin_request", function() {
  it('fixture_1 - invalid location, not found', function(done) {
    var res = viewer_request(fixture_1);
    expect(res.uri).to.equal('/not-found.html');

    done();
  });

  it('fixture_2 - public URI, no auth', function(done) {
    var res = viewer_request(fixture_2);
    expect(res).to.equal(fixture_2.request);
    done();
  });

  it('fixture_3 - security.txt redirect', function(done) {
    var res = viewer_request(fixture_3);

    expect(res).to.not.equal(fixture_3.request);
    expect(res.statusCode).to.equal(307);
    expect(Object.keys(res["headers"])).to.have.members(["location"]);
    expect(res["headers"]["location"].value).to.equal('https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt');

    done();
  });

  it('fixture_4 - invalid auth for private URI', function(done) {
    var res = viewer_request(fixture_4);
    expect(res).to.not.equal(fixture_4.request);
    expect(res["headers"]["location"].value).to.equal('/sign-in?redirect=/private-example.html');
    done();
  });

  it('fixture_5 - valid JWT for private URI', function(done) {
    process.env.DOMAINS = 'digital.cabinet-office.gov.uk|*.gov.uk';
    var res = viewer_request(fixture_5, true);
    expect(res.uri).to.equal("/private-example.html");
    done();
  });

  it('fixture_5 - CHECK_JWT turned off', function(done) {
    var res = viewer_request(fixture_5, false);
    expect(res["headers"]["location"].value).to.equal('/sign-in?redirect=/private-example.html');
    done();
  });

  it('fixture_6 - IP allowlist', function(done) {
    process.env.IP_ALLOWLIST = '10.0.0.|10.1.0.';

    var res = viewer_request(fixture_6);
    expect(res.uri).to.equal("/private-example.html");
    done();
  });
});
