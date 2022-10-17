const fs = require('fs');

function check_sign_in_from_cookies(cookies, host) {
  return new Promise(function(resolve, reject) {
    if (!cookies || typeof(cookies) == "undefined") {
      resolve(false);
    }

    const https = require('https');
    const options = {
      hostname: host,
      port: 443,
      path: '/api/auth/status',
      method: 'GET',
      headers: { 'Cookie': cookies }
    };

    const req = https.request(options, res => {
      res.on('data', d => {
        resolve(JSON.parse(d.toString()).signed_in);
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}

let routes_loaded = false;
let routes = {};
function load_routes() {
  if (!routes_loaded) {
    try {
      let cm = fs.readFileSync('./content_metadata.json');
      routes = JSON.parse(cm);
      routes_loaded = true;
    } catch (e) {
      console.log("load_routes error:", e);
    }
  }
  return routes;
}

function redirect(url, cache) {
    if (typeof(cache) == "undefined") {
      cache = false;
    }

    let response = {
        status: 307,
        statusDescription: 'Temporary Redirect',
        headers: {
            location: [{
                key: 'Location',
                value: url,
            }]
        }
    };

    if (cache) {
      response["headers"]['cache-control'] = [{
          key: 'Cache-Control',
          value: 'public, max-age=604800, immutable',
      }];
    }

    return response;
}

exports.wrap_handler = async (event, context, callback) => {
  let log_object = {
    "time": new Date()
  };

  const res = await handler(event);

  try {
    if (!res) {
      throw 'handler returned false';
    }
    const cf = event.Records[0].cf;

    log_object["config.requestId"] = "requestId" in cf.config ?
      cf.config.requestId : null;

    log_object["request.clientIp"] = "clientIp" in cf.request ?
      cf.request.clientIp : null;

    log_object["request.method"] = "method" in cf.request ?
      cf.request.method : null;

    log_object["request.uri"] = "uri" in cf.request ? cf.request.uri : null;

    log_object["res.status"] = "status" in res ? res.status : null;

    log_object["res.headers.location"] = "headers" in res
      && "location" in res.headers ?
      res.headers.location[0].value : null;

    log_object["res.uri"] = "uri" in res ? res.uri : null;

  } catch (e) {
    log_object["error"] = e;
  }

  console.log(JSON.stringify(log_object));
  callback(null, res);
}

async function handler(event) {
    if (typeof(event) == "undefined" || Object.keys(event).length == 0) {
      return false;
    }
    const request = event.Records[0].cf.request;

    // ==== only GET method allowed ====

    if (request.method.toLowerCase() != "get") {
      return {
        status: 405,
        statusDescription: 'Method Not Allowed',
        body: "METHOD NOT ALLOWED"
      }
    }

    // ==== normalise the URI ====

    let norm_uri = request.uri
      .toLowerCase()
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+/, '\/');

    if (norm_uri == "" || norm_uri == "/" || norm_uri.match(/^\/index.htm/)) {
      request.uri = "/index.html";
    }

    if (norm_uri.indexOf(" ") > -1) {
      norm_uri = encodeURI(norm_uri);
    }

    // ==== normalise the request.headers ====

    let norm_headers = {};
    for (header in request.headers) {
      norm_headers[header.toLowerCase()] = request.headers[header][0].value;
    }

    // ==== work out host ====

    var host = '';
    if ('true-host' in norm_headers) {
        host = norm_headers['true-host'];
    } else if ('host' in norm_headers) {
        host = norm_headers['host'];
    } else if (':authority' in norm_headers) {
        host = norm_headers[':authority'];
    }
    host = host.split(":")[0];

    if (![
      "nonprod.security.gov.uk",
      "security.gov.uk"
    ].includes(host)) {
      return redirect("https://security.gov.uk" + norm_uri);
    }

    // ==== routes ====

    if (request.uri == "/index.html") {
      return request;
    }

    if (norm_uri.match(/^\/not-found/)) {
      request.uri = "/not-found.html";
      return request;
    }

    if (norm_uri.match(/^\/no-access/)) {
      request.uri = "/no-access.html";
      return request;
    }

    if (norm_uri.match(/^\/profile/)) {
      return redirect("https://dgmhhlf9nkfe8.cloudfront.net/profile");
    }

    if (norm_uri.match(/^\/.well[-_]known/)) {
      if (norm_uri.match(/^\/.well[-_]known\/teapot$/)) {
        return {
            status: 418,
            statusDescription: "I'm a teapot"
        };
      }

      if (norm_uri.match(/^\/.well[-_]known\/status$/)) {
        return {
            status: 200,
            statusDescription: "OK",
            body: "OK"
        };
      }

      if (norm_uri.match(/^\/.well[-_]known\/hosting-provider$/)) {
        return {
            status: 200,
            statusDescription: "OK",
            body: "https://aws.amazon.com/cloudfront/\nhttps://github.com/cabinetoffice/security.gov.uk-iac"
        };
      }

      if (norm_uri.match(/^(\/.well[-_]known)?\/security\.txt$/)) {
        return redirect("https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt");
      }
    }

    const base_url_opt = norm_uri.replace(/\/+$/, "").replace(/.html$/, "");
    const url_options = [
      base_url_opt,
      base_url_opt + "/index.html",
      base_url_opt + ".html"
    ];

    const routes = load_routes();

    for (var i = 0; i < url_options.length; i++) {
      const opt = url_options[i];
      if (opt in routes) {
        // if this is an index.html file, make sure the URI ends with "/" and not index.html
        if (opt.match(/\/index.html$/) && !norm_uri.match(/\/$/)) {
          return redirect(opt.substr(0, opt.length - 10));
        }

        if ("private" in routes[opt]) {
          if (routes[opt]["private"] == false) {

            request.uri = routes[opt].key;
            return request;

          } else if (routes[opt]["private"]) {

            let signed_in = await check_sign_in_from_cookies(norm_headers["cookie"], host);
            if (signed_in) {

              request.uri = routes[opt].key;
              return request;

            } else {
              return redirect("/api/auth/sign-in?redirect=" + routes[opt].key.replace("/index.html", "/"));
            }
          }
        }
        break;
      }
    }

    request.uri = "/not-found.html";
    return request;
    // return redirect("/not-found");
}
