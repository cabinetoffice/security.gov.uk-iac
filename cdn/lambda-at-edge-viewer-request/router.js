const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const fs = require('fs');

function check_email(email) {
  if (!email || typeof(email) == "undefined" || email.indexOf("@") == -1) {
    return false;
  }

  const domain = email.toLowerCase().split("@")[1];

  if ([
    "digital.cabinet-office.gov.uk",
  ].includes(domain)) {
    return true;
  } else {
    if (domain.endsWith(".gov.uk")) {
      return true;
    }
  }

  return false;
}

function check_ip(ip) {
  if (!ip || typeof(ip) == "undefined" || ip.indexOf(".") == -1) {
    return false;
  }

  // TODO: define egress IPs, these may need to be a variable

  if (ip.startsWith("10.0.0.")) {
    return true;
  }
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

function handler(event) {
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

    if (uri == "") {
      request.uri = "/index.html";
    } else if (uri.endsWith("/")) {
      request.uri += "index.html";
    } else if (uri.indexOf(".html") == -1) {
      request.uri += ".html";
    }

    let signedIn = false;

    if (check_ip(viewerIp)) {
      signedIn = true;
    } else if (jwtToken != "") {

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
    if (request.uri in cm) {
      if ("private" in cm[request.uri]) {
        if (cm[request.uri]["private"] == false) {
          return request;
        } else if (cm[request.uri]["private"]) {
          if (signedIn) {
            return request;
          } else {
            return redirect("/sign-in?redirect=" + request.uri);
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
