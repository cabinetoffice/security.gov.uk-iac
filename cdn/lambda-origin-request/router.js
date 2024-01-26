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
      const raw_cm = fs.readFileSync('./content_metadata.json');
      const content_metadata = JSON.parse(raw_cm);
      for (const rkey in content_metadata) {
        const route = content_metadata[rkey];
        routes[rkey] = {
          "key": route.key,
          "private": route.private,
        }
      }
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
  let res = false;

  let log_object = {
    "time": new Date(),
    "is_error": false
  };

  try {
    const cf = event.Records[0].cf;

    log_object["config.requestId"] = "requestId" in cf.config ?
      cf.config.requestId : null;

    log_object["request.clientIp"] = "clientIp" in cf.request ?
      cf.request.clientIp : null;

    log_object["request.method"] = "method" in cf.request ?
      cf.request.method : null;

    log_object["request.uri"] = "uri" in cf.request ? cf.request.uri : null;
  } catch (e) {
    log_object["error"] = e;
    log_object["is_error"] = true;
  }

  if (!log_object["is_error"]) {
    res = await handler(event);

    try {
      if (!res) {
        throw 'handler returned false';
      }

      log_object["res.status"] = "status" in res ? res.status : null;

      log_object["res.headers.location"] = "headers" in res
        && "location" in res.headers ?
        res.headers.location[0].value : null;

      log_object["res.uri"] = "uri" in res ? res.uri : null;

    } catch (e) {
      log_object["error"] = e;
      log_object["is_error"] = true;
    }
  }

  console.log(JSON.stringify(log_object));
  callback(null, res);
}

function normalise_uri(u) {
  let norm_uri = "/";

  try {
    norm_uri = u
      .toLowerCase()
      .split("?")[0]
      .split("#")[0]
      .replace(/\/+/, '\/');

    if (norm_uri == "" || norm_uri.match(/^\/index.htm/)) {
      return "/";
    }

    if (norm_uri.match(/\/index\.html?$/)) {
      norm_uri = norm_uri.replace("/index.html", "/").replace("/index.htm", "/");
    }

    if (!norm_uri.match(/\.[a-z]+$/) && !norm_uri.match(/\/$/)) {
      norm_uri += "/";
    }

    if (norm_uri.match(/\.html?$/)) {
      norm_uri = norm_uri.replace(".html", "").replace(".htm", "");
    }

    if (norm_uri.indexOf(" ") > -1) {
      norm_uri = encodeURI(norm_uri);
    }
  } catch (e) {
    console.log("normalise_uri error:", e);
  }

  return norm_uri;
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

    let norm_uri = normalise_uri(request.uri);

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

    if (host == "nonprod.security.gov.uk") {
      return redirect("https://www.nonprod.security.gov.uk" + norm_uri);
    }

    if (host == "security.gov.uk") {
      return redirect("https://www.security.gov.uk" + norm_uri);
    }

    if (![
      "www.nonprod.security.gov.uk",
      "www.security.gov.uk"
    ].includes(host)) {
      return redirect("https://www.security.gov.uk");
    }

    // ==== routes ====

    if (norm_uri == "/") {
      request.uri = "/index.html"
    }

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

    if (norm_uri.match(/^\/services/)) {
      return redirect("/organisations/");
    }

    if (norm_uri.match(/^\/profile/)) {
      return redirect(
        "https://sso.service.security.gov.uk/profile"
      );
    }

    if (norm_uri.match(/^\/robots.txt/)) {
      return {
          status: 200,
          statusDescription: "OK",
          body: `User-agent: Googlebot
User-agent: AdsBot-Google
User-agent: AdsBot-Google-Mobile
` + (host == "www.security.gov.uk" ? "Allow" : "Disallow") + `: /

User-agent: *
` + (host == "www.security.gov.uk" ? "Allow" : "Disallow") + `: /`
      };
    }

    if (norm_uri.match(/^\/.well[-_]known\/(tea(pot)?|☕|%e2%98%95|coffee)/)) {
      return {
          status: 418,
          statusDescription: "I'm a teapot",
          body: "I'm a teapot"
      };
    }

    if (norm_uri.match(/^\/.well[-_]known\/microsoft-identity-association\.json/)) {
      return {
          status: 200,
          statusDescription: "OK",
          body: '{"associatedApplications": [{"applicationId": "947d4106-d917-43b9-9af6-f2707f038536"}]}'
      };
    }

    if (norm_uri.match(/^\/.well[-_]known\/status/)) {
      return {
          status: 200,
          statusDescription: "OK",
          body: "OK"
      };
    }

    if (norm_uri.match(/^\/.well[-_]known\/hosting(-provider)?/)) {
      return {
          status: 200,
          statusDescription: "OK",
          body: "https://aws.amazon.com/cloudfront/\nhttps://github.com/cabinetoffice/security.gov.uk-iac"
      };
    }

    if (norm_uri.match(/^(\/.well[-_]known)?\/security\.txt/)) {
      return redirect("https://vulnerability-reporting.service.security.gov.uk/.well-known/security.txt");
    }


    const base_url_opt = norm_uri.replace(/\/+$/, "").replace(/.html$/, "");
    const url_options = [
      base_url_opt + "/index.html",
      base_url_opt,
      base_url_opt + ".html"
    ];

    const routes = load_routes();

    for (var i = 0; i < url_options.length; i++) {
      const opt = url_options[i];
      if (opt in routes) {
        // if this is an index.html file, make sure the URI ends with "/" and not index.html
        const normopt = normalise_uri(opt);
        if (normopt != request.uri) {
          return redirect(normopt);
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
              let burl = btoa(normopt);
              let resp = redirect("/api/auth/sign-in");
              resp["headers"]["set-cookie"] = [{
                key: 'Set-Cookie',
                value: '__Host-SGUK-Redirect='+burl+'; Max-Age=300; Path=/; Secure',
              }];
              return resp;
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
