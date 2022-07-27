const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const fs = require('fs');

// -- Environment Variables --
// DOMAINS              = pipe separated list of allowed email domains,
//                        wildcard allowed at the start (e.g. *.gov.uk)
// IP_ALLOWLIST         = pipe separated list of IPs allowed without
//                        authentication
// CHECK_JWT            = (true | false), whether or not a JWT is checked
// CONTENT_METADATA_URL =
// PUBLIC_JWKS_URL      =

function check_email(email) {
  if (!email || typeof(email) == "undefined" || email.indexOf("@") == -1) {
    return false;
  }

  const domain = email.toLowerCase().split("@")[1];

  let domains = [];

  if ("DOMAINS" in process.env) {
    domains = process.env.DOMAINS.toLowerCase().replaceAll(" ","").split("|");
  } else {
    domains = [];
  }

  let res = false;

  for (var i = 0; i < domains.length; i++) {
    if (domains[i].indexOf("*") == 0) {
      const domainEnding = domains[i].slice(1);
      if (domain.endsWith(domainEnding)) {
        res = true;
        break;
      }
    } else if (domains[i] == domain) {
      res = true;
      break;
    }
  }

  return res;
}

function check_ip(ip) {
  if (!ip || typeof(ip) == "undefined" || ip.indexOf(".") == -1) {
    return false;
  }

  // TODO: define egress IPs

  let ipAllowList = [];

  if ("IP_ALLOWLIST" in process.env) {
    ipAllowList = process.env.IP_ALLOWLIST.toLowerCase().replaceAll(" ","").split("|");
  } else {
    ipAllowList = [];
  }

  for (var i = 0; i < ipAllowList.length; i++) {
    if (
      ipAllowList[i]
      && ipAllowList[i] != ""
      && ip.startsWith(ipAllowList[i])
    ) {
      return true;
    }
  }

  return false;
}

function redirect(url) {
    var response = {
        statusCode: 307,
        statusDescription: 'Temporary Redirect',
        headers: {
            'location': {
              value: url
            }
        }
    };
    return response;
}

let content_metadata = {};

function load_routes() {
  if (content_metadata != {}) {
    // TODO: read from URL
    content_metadata = JSON.parse(fs.readFileSync("../../../security.gov.uk-content/build/content_metadata.json", 'utf8'));
  }
  return content_metadata;
}

function handler(event, CHECK_JWT) {
    if (typeof(CHECK_JWT) == "undefined") {
      if ("CHECK_JWT" in process.env) {
        CHECK_JWT = (
          process.env.CHECK_JWT.toLowerCase().startsWith("t")
          || process.env.CHECK_JWT == "1"
         );
      } else {
        CHECK_JWT = false;
      }
    }

    var request = event.request;
    var headerKeys = Object.keys(request.headers);
    var uri = request.uri.toLowerCase();

    var viewerIp = "";
    if ("viewer" in event && "ip" in event.viewer) {
      viewerIp = event.viewer.ip;
    }

    var host = '';
    if (headerKeys.indexOf('host') > -1) {
        host = request.headers.host.value;
    } else if (headerKeys.indexOf(':authority') > -1) {
        host = request.headers[':authority'].value;
    }

    var authorizationHeader = "";
    var jwtToken = "";
    if (headerKeys.indexOf('authorization') > -1) {
        authorizationHeader = request.headers.authorization.value;
        jwtToken = authorizationHeader.slice(7);
    }

    if (uri.match(/^\/.well[-_]known\/teapot$/)) {
      return {
          statusCode: 418,
          statusDescription: "I'm a teapot"
      };
    }

    if (uri.match(/^\/asset/)) {
      return request;
    }

    if (uri.match(/^\/.well[-_]known\/status$/)) {
      request.uri = "/.well-known/status";
      // file hosted in S3
      return request;
    }

    if (uri.match(/^\/.well[-_]known\/hosting-provider$/)) {
      request.uri = "/.well-known/hosting-provider";
      // file hosted in S3
      return request;
    }

    if (uri.match(/^(\/.well[-_]known)?\/security\.txt$/)) {
      return redirect("https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt");
    }

    let signedIn = false;

    if (check_ip(viewerIp)) {
      signedIn = true;
    }

    if (CHECK_JWT && jwtToken != "") {
      // TODO: validate the JWT (created within 5 minutes and signed by public key)
      var decodedJwt = jwt.decode(jwtToken, {complete: false});
      if (!decodedJwt) {
        return redirect("/error");
      } else if ("email" in decodedJwt) {
        if (check_email(decodedJwt["email"])) {
          signedIn = true;
        }
      }
    }

    const cm = load_routes();

    let normUri = request.uri.toLowerCase().split("?")[0].split("#")[0];

    if (normUri == "") {
      normUri = "/index.html";
    } else if (normUri.endsWith("/")) {
      normUri = normUri + "index.html";
    } else if (normUri.indexOf(".html") == -1) {
      normUri = normUri + ".html";
    }

    request.uri = normUri;

    if (normUri in cm) {
      if ("private" in cm[normUri]) {
        if (cm[normUri]["private"] == false) {
          return request;
        } else if (cm[normUri]["private"]) {
          if (signedIn) {
            return request;
          } else {
            return redirect("/sign-in?redirect=" + normUri);
          }
        }
      }
    }

    request.uri = "/not-found.html";
    return request;
}

if (typeof(module) === "object") {
    module.exports = handler;
}
