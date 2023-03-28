const fs = require('fs');
const express = require('express')
const ipRangeCheck = require("ip-range-check");
const cookieParser = require('cookie-parser')
const https = require('https');
const querystring = require('querystring');
const uuid = require("uuid");
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { getCurrentInvoke } = require('@vendia/serverless-express')

require('dotenv').config()

const FUNCTION_NAME = process.env['AWS_LAMBDA_FUNCTION_NAME'];
const IS_LAMBDA = (typeof(FUNCTION_NAME) == "string");
const LOCAL_PORT = 8002;

const URL_HOST = process.env['URL_HOST'];
const OIDC_CLIENT_ID = process.env['OIDC_CLIENT_ID'] || '';
const OIDC_CLIENT_SECRET = process.env['OIDC_CLIENT_SECRET'] || '';
const OIDC_CONFIGURATION_URL = process.env['OIDC_CONFIGURATION_URL'];
const OIDC_JWKS_URI = process.env['OIDC_JWKS_URI'];
const OIDC_TOKEN_ENDPOINT = process.env['OIDC_TOKEN_ENDPOINT'];
const OIDC_AUTHORIZATION_ENDPOINT = process.env['OIDC_AUTHORIZATION_ENDPOINT'];
const OIDC_RESPONSE_TYPE = process.env['OIDC_RESPONSE_TYPE'];
const OIDC_SIGN_OUT = process.env['OIDC_SIGN_OUT'] || '/';

const SESSION_EXPIRY_MINUTES = 20;

global.oidc_configuration = {};
global.signing_key = "";
global.http = null;

//const AWS = require('aws-sdk');
//AWS.config.update({ region: 'eu-west-2' });

let COOKIE_NAME = IS_LAMBDA ? "__Host-Session" : "SessionSGUKAPI";

const app = express();
app.ALLOWED_IPS = strToList(process.env['ALLOWED_IPS']);

if (!IS_LAMBDA) {
  app.SESSION_SECRET = "ABC123";
  http = require('http');
} else if (process.env["SESSION_SECRET"].length == 0) {
  return false;
} else {
  app.SESSION_SECRET = process.env["SESSION_SECRET"];
}

const asyncHandler = (f) => (req, res, next) => {
  Promise.resolve(f(req, res, next)).catch(next);
}

app.use(express.json());
app.use(cookieParser(app.SESSION_SECRET));

// ==== normalise request ====

function normaliseEveryRequest(req, res, next) {
  // normalise headers
  let norm_headers = {};
  for (header in req.headers) {
    norm_headers[header.toLowerCase()] = (
      typeof(req.headers[header]) != "string"
    ) ? req.headers[header].value : req.headers[header];
  }

  // set req.ip
  let client_ip;
  if ('true-client-ip' in norm_headers) {
    client_ip = norm_headers['true-client-ip'];
  } else if ('x-forwarded-for' in norm_headers) {
    client_ip = norm_headers['x-forwarded-for'].split(',')[0].trim();
  } else {
    client_ip = req.socket.remoteAddress;
  }
  req.ip = client_ip;
  req.true_ip = client_ip;

  // console.log(norm_headers);

  let host = '';
  if ('true-host' in norm_headers) {
      host = norm_headers['true-host'];
  } else if ('host' in norm_headers) {
      host = norm_headers['host'];
  } else if (':authority' in norm_headers) {
      host = norm_headers[':authority'];
  }
  host = host.split(":")[0];
  req.headers["host"] = host;
  req.host = host;
  req.hostname = host;
  req.true_host = host;

  let allowed_hosts = [
    "www.nonprod.security.gov.uk",
    "www.security.gov.uk",
  ];
  if (!IS_LAMBDA) {
    allowed_hosts.push("localhost");
    allowed_hosts.push("127.0.0.1");
  }

  // return bad request if the host isn't recognised
  if (!allowed_hosts.includes(host)) {
    res.status(400);
    res.send("Bad Request");
  } else {
    // if (req.path.indexOf('/api/auth') == 0) {
    //   getOpenIDConfig();
    // }
    next();
  }
}

app.use(normaliseEveryRequest);

// ==== routes ====

app.use((req, res, next) => {
  res.on('finish', function() {
    log_item = {
      "time": new Date()
    }
    try {
      const { event, context } = getCurrentInvoke();
      log_item["event"] = IS_LAMBDA ? event : {
        "hostname": req.hostname,
        "url": req.url,
        "ip": req.true_ip,
      };
      log_item["context"] = IS_LAMBDA ? context : {"local": true};
      log_item["result"] = {
        "headers": res.getHeaders(),
        "statusCode": typeof(res.statusCode) != "undefined" ? res.statusCode : 0,
        "statusMessage": typeof(res.statusMessage) != "undefined" ? res.statusMessage : "UNKNOWN",
      };
    } catch (e) {
      log_item["error"] = e;
    }
    log(log_item);
  });
  next();
});

app.get('/api/status', (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ status: 'OK' }));
});

app.get('/api/routes', (req, res) => {
  let resp = {};

  const ss = renewSession(req, res);
  if ("signed_in" in ss && ss.signed_in) {
    resp = getAllRoutes();
  } else {
    resp = getPublicOnlyRoutes();
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(resp));
});

app.get('/api/teapot', (req, res) => {
  res.status(418);
  res.send("I'm a teapot");
});

app.get('/api/auth/status', (req, res) => {
  let ss = renewSession(req, res);
  if ("state" in ss) {
    delete ss.state;
  }

  if (ss.signed_in) {
    const desplit = typeof(ss.email) == "string" ? ss.email.split("@") : [];
    log({
      "time": (typeof(req.query.t) != "undefined" && req.query.t.indexOf("-") > 0 ? req.query.t.split("-")[1] : null),
      "action": "signed-in-status",
      "type": (typeof(ss.type) != "undefined" ? ss.type : null),
      "ip": (typeof(req.true_ip) != "undefined" ? req.true_ip : null),
      "email": (typeof(ss.email) != "undefined" ? ss.email : null),
      "domain": desplit.length == 2 ? desplit[1] : null,
      "display_name": (typeof(ss.display_name) != "undefined" ? ss.display_name : null),
      "path": (typeof(req.query.p) != "undefined" ? req.query.p : null)
    });
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(ss));
});

app.get('/api/auth/oidc_callback', asyncHandler(async (req, res) => {
  const ss = sessionStatus(req);

  let saved_state = null;
  if ("state" in ss && ss["state"].length > 0)  {
    saved_state = ss["state"];
  }
  if (saved_state == null) {
    res.redirect("/error?e=state-missing");
    return;
  }

  if ("state" in req.query) {
    if (req.query["state"] != saved_state) {
      res.redirect("/error?e=state-not-matched");
      return;
    }
  } else {
    res.redirect("/error?e=callback-missing-state");
    return;
  }

  let id_token = null;
  if ("id_token" in req.query) {
    id_token = req.query["id_token"];
  } else if ("code" in req.query) {
    const token_endpoint_resp = await getUserToken(req.query["code"]);
    if (token_endpoint_resp && "id_token" in token_endpoint_resp) {
        id_token = token_endpoint_resp.id_token;
    } else {
      res.redirect("/error?e=getusertoken-failed");
      return;
    }
  } else {
    res.redirect("/error?e=callback-missing-param");
    return;
  }

  if (id_token == null) {
    res.redirect("/error?e=jwt-id_token-missing");
    return;
  } else {
    await jwt.verify(id_token, getKey, await function(err, decoded) {
      if (err && typeof(decoded) == "undefined") {
        log({"/api/auth/oidc_callback": {"error": "jwt-invalid"}});
        res.redirect("/error?e=jwt-invalid");
        return;
      } else if (
        "email" in decoded &&
        "email_verified" in decoded &&
        decoded.email_verified
      ) {
        const dn = typeof(decoded.display_name) == "string" ? decoded.display_name : null;
        createSession(res, decoded.email, "sso", true, null, dn);

        let redirect = "/";
        if ("redirect" in req.query) {
          const redirect_qs = req.query["redirect"];
          if (redirect_qs.match(/^\/[^\/\.]/)) {
            redirect = redirect_qs;
          }
        }

        const desplit = typeof(ss.email) == "string" ? decoded.email.split("@") : [];
        log({
          "action": "sign-in-success",
          "type": "sso",
          "ip": (typeof(req.true_ip) != "undefined" ? req.true_ip : null),
          "email": (typeof(decoded.email) != "undefined" ? decoded.email : null),
          "domain": desplit.length == 2 ? desplit[1] : null,
          "display_name": dn,
          "redirect": redirect
        });
        res.redirect(redirect);
        return;
      } else {
        res.redirect("/error?e=jwt-email-not-found");
        return;
      }
    });
  }
}));

app.get('/api/auth/sign-in', asyncHandler(async (req, res) => {
  let redirect_url = "/no-access";
  let signed_in = false;

  const ss = sessionStatus(req);
  signed_in = ss["signed_in"];

  let email = signed_in ? ss["email"] : null;
  let sign_in_type = signed_in ? ss["type"] : null;

  if ("redirect" in req.query) {
    let redirect_qs = req.query["redirect"].toLowerCase();
    if (redirect_qs.match(/^\/[^\/\.]/)) {
      redirect_url = normalise_uri(redirect_qs);
    }
  }

  if (!signed_in) {
    const ip_allowed = isAllowedIp(req.true_ip);
    if (ip_allowed) {
      sign_in_type = "ip";
      signed_in = true;
      log({
        "action": "sign-in-success",
        "type": "ip",
        "ip": (typeof(req.true_ip) != "undefined" ? req.true_ip : null),
        "email": null,
        "domain": null,
        "display_name": null,
        "redirect": redirect_url
      });
    }
  }

  if (signed_in) {
    createSession(res, email, sign_in_type, true);
  } else {
    const state = uuid.v4();
    createSession(res, email, null, false, state);

    let new_redirect = OIDC_AUTHORIZATION_ENDPOINT;
    new_redirect += "?response_type=" + OIDC_RESPONSE_TYPE;
    new_redirect += "&client_id=" + OIDC_CLIENT_ID;
    new_redirect += "&redirect_uri=" +
      encodeURIComponent(URL_HOST + "/api/auth/oidc_callback?redirect=")
      + redirect_url;
    new_redirect += "&scope=openid%20email%20profile";
    new_redirect += "&state=" + state;

    redirect_url = new_redirect;
  }

  res.redirect(redirect_url);
}));

app.get('/api/throw_error', (req, res) => {
  throw new Error("testing with /api/throw_error");

  res.status(204);
  res.send("No Content");
});

app.get('/api/auth/sign-out', (req, res) => {
  let redirect_url = OIDC_SIGN_OUT;

  signOut(res);

  res.redirect(redirect_url);
});

app.get('*', (req, res) => {
  res.status(204);
  res.send("No Content");
});

app.use((err, req, res, next) => {
  log({
    "error": err ? (
      typeof(err) == "object" ? {
        "stack": typeof(err["stack"]) == "string" ? err["stack"] : "",
        "message": typeof(err["message"]) == "string" ? err["message"] : "",
      } : err
    ) : null
  });

  res.redirect("/error?t=" + Date.now());
});

// ==== functions ====

function redactString(s) {
  const redacted_string = "REDACTED";
  if (IS_LAMBDA) {
    for (const r of [
      new RegExp(`(` + COOKIE_NAME + `=)[^;"]+`, "g"),
      new RegExp(`(state=)[^;"]+`, "g")
    ]) {
      s = s.replace(r, "$1"+redacted_string);
    }

    for (const t of [
      app.SESSION_SECRET,
      OIDC_CLIENT_ID,
      OIDC_CLIENT_SECRET
    ]) {
      if (t) {
        s = s.replace(t, redacted_string);
      }
    }
  }
  return s;
}

function log(obj) {
  if (typeof(obj) != "object") {
    return;
  }
  if (typeof(obj["time"]) == "undefined" || obj["time"] == null) {
    obj["time"] = new Date();
  }
  console.log(redactString(JSON.stringify(obj)));
}

let _routes = {};
function getRoutes() {
  if (Object.keys(_routes).length === 0) {
    try {
      let cm = fs.readFileSync('./content_metadata.json');
      _routes = JSON.parse(cm);
    } catch (e) {
      log({"getRoutes": {"error": e}});
    }
  }
  return _routes;
}

let _allRoutes = {};
function getAllRoutes() {
  if (Object.keys(_allRoutes).length === 0) {
    const all_routes = getRoutes();

    for (const rkey in all_routes) {
      const route = all_routes[rkey];
      _allRoutes[rkey] = {
        "route": rkey,
        "private": route.private,
        "title": "page_title" in route ? route.page_title : rkey,
        "is_file": "file_reference" in route ? route.file_reference : false,
        "breadcrumbs": "breadcrumbs" in route ? route.breadcrumbs : {},
        "description": "description" in route ? route.description : "",
        "keywords": "keywords" in route ? route.keywords : "",
      }
    }
  }
  return _allRoutes;
}

let _publicOnlyRoutes = {};
function getPublicOnlyRoutes() {
  if (Object.keys(_publicOnlyRoutes).length === 0) {
    const all_routes = getRoutes();

    for (const rkey in all_routes) {
      const route = all_routes[rkey];
      if (!route.private) {
        _publicOnlyRoutes[rkey] = {
          "route": rkey,
          "private": route.private,
          "title": "page_title" in route ? route.page_title : rkey,
          "is_file": "file_reference" in route ? route.file_reference : false,
          "breadcrumbs": "breadcrumbs" in route ? route.breadcrumbs : {},
          "description": "description" in route ? route.description : "",
          "keywords": "keywords" in route ? route.keywords : "",
        }
      }
    }
  }
  return _publicOnlyRoutes;
}

function sessionStatus(req) {
  let result = { "signed_in": false };

  try {
    if (COOKIE_NAME in req.signedCookies && req.signedCookies[COOKIE_NAME]) {
      // if the expiresAt date is greater than the date now, then use the sign_in value
      if (Date.parse(req.signedCookies[COOKIE_NAME].expiresAt) > (new Date())) {
        result = req.signedCookies[COOKIE_NAME];
      }
    }
  } catch (e) {
    log({"sessionStatus": {"error": e}});
  }

  result["time"] = new Date();
  return result;
}

function renewSession(req, res) {
  ss = sessionStatus(req);
  if ("signed_in" in ss && ss.signed_in) {
    return createSession(res, ss["email"], ss["type"], true, ss["state"], ss["display_name"])
  }

  return { "signed_in": false, "time": new Date() };
}

function createSession(res, email, type, signed_in, state=null, display_name=null) {
  const now = new Date();
  const expiresAt = new Date(+now + (SESSION_EXPIRY_MINUTES * 60 * 1000));
  const session = {
    "signed_in": signed_in,
    "type": type,
    "email": email,
    "display_name": display_name,
    "state": state,
    "expiresAt": expiresAt
  };

  var cookie_object = {
    expires: expiresAt,
    httpOnly: false,
    path: "/",
    signed: true,
    sameSite: "lax",
    secure: IS_LAMBDA,
  };
  if (res) {
    res.cookie(COOKIE_NAME, session, cookie_object);
  }

  return session;
}

function signOut(res) {
  const now = new Date();
  res.cookie(COOKIE_NAME, "", {
    expires: now,
    httpOnly: false,
    path: "/",
    signed: true,
    sameSite: "lax",
    secure: IS_LAMBDA,
  });
}

function strToList(s) {
  if (typeof(s) != "string" || s.trim() == "") { return []; }
  return s.toLowerCase().replaceAll(" ","").split(",");
}

async function getOpenIDConfig() {
  if (Object.keys(oidc_configuration).length === 0) {
    oidc_configuration = await _getOpenIDConfig();
  }
  return oidc_configuration;
}

function _getOpenIDConfig() {
  return new Promise(function(resolve, reject) {
    const url = new URL(OIDC_CONFIGURATION_URL);

    const options = {
      hostname: url.hostname,
      port: parseInt(url.port) || 443,
      path: url.pathname,
      method: 'GET',
      headers: { }
    };

    const req = (IS_LAMBDA ? https : http).request(options, res => {
      res.on('data', d => {
        resolve(JSON.parse(d.toString()));
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}

async function getKey(header, callback) {
  try {
    if (signing_key.length == 0) {
      const jwks_client = jwksClient({
        jwksUri: OIDC_JWKS_URI,
        requestHeaders: {}, // Optional
        timeout: 5000 // 5 seconds
      });

      const key = await jwks_client.getSigningKey(header.kid);
      signing_key = key.getPublicKey();
    }

    callback(null, signing_key);
  } catch (e) {
    callback(e, null);
  }
}

async function getUserToken(auth_code) {
  return new Promise(function(resolve, reject) {
    const url = new URL(OIDC_TOKEN_ENDPOINT);

    const post_data = querystring.stringify({
      'client_id' : OIDC_CLIENT_ID,
      'client_secret' : OIDC_CLIENT_SECRET,
      'code' : auth_code
    });

    const options = {
      hostname: url.hostname,
      port: parseInt(url.port) || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
      }
    };

    const req = (IS_LAMBDA ? https : http).request(options, res => {
      let chunks = [];
      res.on('error', (err) => {
        log({"getUserToken": {"error": err}});
        resolve({"error": true});
      }).on("data", function(chunk) {
        if (res.statusCode == 200) {
          chunks.push(chunk);
        } else {
          resolve({"error": true});
        }
      }).on('end', err => {
        if (err) {
          log({"getUserToken": {"error": err}});
          resolve({"error": true});
        }
        let body = Buffer.concat(chunks).toString();
        try {
          let resd = JSON.parse(body);
          resolve(resd);
        } catch (e) {
          log({"getUserToken": {"error": e, "body": body}});
          resolve({"error": true});
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(post_data);
    req.end();
  });
}

function isAllowedIp(ip) {
  if (!ip || typeof(ip) != "string" || ip.length == 0) {
    return false;
  }

  if (!IS_LAMBDA) { app.ALLOWED_IPS = strToList(process.env['ALLOWED_IPS']); }

  for (var i = 0; i < app.ALLOWED_IPS.length; i++) {
    if (
      app.ALLOWED_IPS[i]
      && app.ALLOWED_IPS[i] != ""
      && ipRangeCheck(ip, app.ALLOWED_IPS[i])
    ) {
      return true;
    }
  }

  return false;
}

function normalise_uri(u) {
  let norm_uri = "/";

  if (norm_uri.indexOf("http") == 0) {
    return norm_uri;
  }

  if (norm_uri.indexOf("//") == 0) {
    return norm_uri;
  }

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
    log({"normalise_uri": {"error": e}});
  }

  return norm_uri;
}

if (!IS_LAMBDA) {
  app.listen(LOCAL_PORT, () => {
    console.log(`Listening on port ${LOCAL_PORT}`)
  });
}

module.exports = app;
