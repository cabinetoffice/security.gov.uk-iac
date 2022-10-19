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

const FUNCTION_NAME = process.env['AWS_LAMBDA_FUNCTION_NAME'];
const IS_LAMBDA = (typeof(FUNCTION_NAME) == "string");
const LOCAL_PORT = 8002;

const URL_HOST = process.env['URL_HOST'];
const OIDC_CLIENT_ID = process.env['OIDC_CLIENT_ID'];
const OIDC_CLIENT_SECRET = process.env['OIDC_CLIENT_SECRET'];
const OIDC_CONFIGURATION_URL = process.env['OIDC_CONFIGURATION_URL'];
const OIDC_JWKS_URI = process.env['OIDC_JWKS_URI'];
const OIDC_TOKEN_ENDPOINT = process.env['OIDC_TOKEN_ENDPOINT'];

global.oidc_configuration = {};
global.jwks_client = {};

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-2' });

let COOKIE_NAME = "__Host-Session";

const app = express()
app.ALLOWED_IPS = strToList(process.env['ALLOWED_IPS']);

if (!IS_LAMBDA) {
  app.SESSION_SECRET = "ABC123";
  COOKIE_NAME = "Session";
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

// ==== routes ====

app.use((req, res, next) => {
  res.on('finish', async () => {
    log_item = {
      "time": new Date()
    }
    try {
      const { event, context } = getCurrentInvoke();
      log_item["event"] = IS_LAMBDA ? event : {
        "hostname": req.hostname,
        "url": req.url,
        "ip": req.ip,
      };
      log_item["context"] = IS_LAMBDA ? context : {"local": true};
      log_item["result"] = {
        "headers": res.getHeaders(),
        "statusCode": typeof(res.statusCode) != "undefined" ? res.statusCode : 0,
        "statusMessage": typeof(res.statusMessage) != "undefined" ? res.statusMessage : "UNKNOWN",
      };
      if (typeof(log_item.result.headers["set-cookie"]) == "string") {
        log_item.result.headers["set-cookie"] =
          log_item.result.headers["set-cookie"].replace(/Session=.+$/, "Session=REDACTED");
      }
    } catch (e) {
      log_item["error"] = e;
    }
    console.log(JSON.stringify(log_item));
  });
  next();
});

app.use(async (req, res, next) => {
  // normalise headers
  let norm_headers = {};
  for (header in req.headers) {
    norm_headers[header.toLowerCase()] = (typeof(req.headers[header]) != "string") ?
      req.headers[header].value
      : req.headers[header];
  }

  // set req.ip if req.ip isn't already set
  let get_ip = true;
  if ("ip" in req && typeof(req.ip) == "string" && req.ip.length > 0) {
    get_ip = false;
  }
  if (get_ip) {
    let client_ip;
    if ('true-client-ip' in norm_headers) {
      client_ip = norm_headers['true-client-ip'];
    } else if ('x-forwarded-for' in norm_headers) {
      client_ip = norm_headers['x-forwarded-for'].split(',')[0].trim();
    } else {
      client_ip = req.socket.remoteAddress;
    }
    req.ip = client_ip;
  }

  //console.log(norm_headers);

  let host = '';
  if ('true-host' in norm_headers) {
      host = norm_headers['true-host'];
  } else if ('host' in norm_headers) {
      host = norm_headers['host'];
  } else if (':authority' in norm_headers) {
      host = norm_headers[':authority'];
  }
  host = host.split(":")[0];
  req.hostname = host;

  if (req.path.indexOf('/api/auth') == 0) {
    getOpenIDConfig();
  }

  let allowed_hosts = [
    "nonprod.security.gov.uk",
    "security.gov.uk",
    "d1olglap7yrqp9.cloudfront.net"
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
    next();
  }
});

app.get('/api/status', (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ status: 'OK' }));
});

app.get('/api/routes', (req, res) => {
  let resp = {};

  const ss = sessionStatus(req);
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
  let ss = sessionStatus(req);
  if ("state" in ss) {
    delete ss.state;
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

  let code = null;
  let state = null;

  if ("code" in req.query) {
    code = req.query["code"];
  }

  if ("state" in req.query) {
    state = req.query["state"];
  }

  if (code != null && state != null) {
    if (state != saved_state) {
      res.redirect("/error?e=state-not-matched");
      return;
    }

    const token = await getUserToken(code);
    if (token) {
      if ("error" in token && token.error) {
        res.redirect("/error?e=getusertoken-failed");
        return;
      } else if ("id_token" in token) {
        await jwt.verify(token.id_token, getKey, await function(err, decoded) {
          if (err && typeof(decoded) == "undefined") {
            console.log("/api/auth/oidc_callback:jwt-invalid:err:", err);
            res.redirect("/error?e=jwt-invalid");
            return;
          } else if (
            "email" in decoded &&
            "email_verified" in decoded &&
            decoded.email_verified
          ) {
            const dn = "display_name" in decoded ? decoded.display_name : null;
            createSession(res, decoded.email, "sso", true, null, dn);

            let redirect = "/";
            if ("redirect" in req.query) {
              const redirect_qs = req.query["redirect"];
              if (redirect_qs.match(/^\/[^\/\.]/)) {
                redirect = redirect_qs;
              }
            }
            res.redirect(redirect);
            return;

          } else {
            res.redirect("/error?e=jwt-email-not-found");
            return;
          }
        });
      } else {
        res.redirect("/error?e=jwt-id_token-missing");
        return;
      }
    }
  } else {
    res.redirect("/error?e=callback-missing-params");
    return;
  }

  res.redirect("/error");
}));

app.get('/api/auth/sign-in', asyncHandler(async (req, res) => {
  let redirect_url = "/no-access";
  let signed_in = false;

  const ss = sessionStatus(req);
  signed_in = ss["signed_in"];

  let email = signed_in ? ss["email"] : null;
  let sign_in_type = signed_in ? ss["type"] : null;

  if (!signed_in) {
    const ip_allowed = isAllowedIp(req.ip);
    if (ip_allowed) {
      sign_in_type = "ip";
      signed_in = true;
    }
  }

  if ("redirect" in req.query) {
    let redirect_qs = req.query["redirect"].toLowerCase();
    if (redirect_qs.match(/^\/[^\/\.]/)) {
      if (redirect_qs.indexOf(" ") > -1) {
        redirect_qs = encodeURI(redirect_qs);
      }
      redirect_url = redirect_qs;
    }
  }

  if (signed_in) {
    createSession(res, email, sign_in_type, true);
  } else {
    const oidc_config = await getOpenIDConfig();
    const auth_url = oidc_config.authorization_endpoint;

    const state = uuid.v4();
    createSession(res, email, null, false, state);

    let new_redirect = auth_url + "?response_type=token";
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

app.get('/api/auth/sign-out', (req, res) => {
  let redirect_url = "/";

  signOut(res);

  res.redirect(redirect_url);
});

app.get('*', (req, res) => {
  res.status(204);
  res.send("No Content");
});

// ==== functions ====

let _routes = {};
function getRoutes() {
  if (Object.keys(_routes).length === 0) {
    try {
      let cm = fs.readFileSync('./content_metadata.json');
      _routes = JSON.parse(cm);
    } catch (e) {
      console.log("getRoutes error:", e);
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
        "title": "page_title" in route ? route.page_title : "",
        "is_file": "file_reference" in route ? route.file_reference : false,
        "breadcrumbs": "breadcrumbs" in route ? route.breadcrumbs : {}
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
          "title": "page_title" in route ? route.page_title : "",
          "is_file": "file_reference" in route ? route.file_reference : false,
          "breadcrumbs": "breadcrumbs" in route ? route.breadcrumbs : {}
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
    console.log("session_signed_in:error:", e);
  }

  result["time"] = new Date();
  return result;
}

function createSession(res, email, type, signed_in, state=null, display_name=null) {
  const now = new Date();
  const expiresAt = new Date(+now + (6 * 60 * 60 * 1000));
  const session = {
    "signed_in": signed_in,
    "type": type,
    "email": email,
    "display_name": display_name,
    "state": state,
    "expiresAt": expiresAt
  };

  res.cookie(COOKIE_NAME, session, {
    expires: expiresAt,
    httpOnly: false,
    path: "/",
    signed: true,
    sameSite: "lax",
    secure: IS_LAMBDA,
  });
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
      hostname: url.host,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: { }
    };

    const req = https.request(options, res => {
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
  const kid = header.kid;

  if (Object.keys(jwks_client).length === 0) {
    // const oidc_config = await getOpenIDConfig();
    const jwks_url = OIDC_JWKS_URI; oidc_config.jwks_uri;

    jwks_client = jwksClient({
      jwksUri: jwks_url,
      requestHeaders: {}, // Optional
      timeout: 5000 // 5 seconds
    });
  }

  try {
    const key = await jwks_client.getSigningKey(kid);
    const signingKey = key.getPublicKey();

    callback(null, signingKey);
  } catch (e) {
    callback(e, null);
  }
}

async function getUserToken(access_code) {
  // const oidc_config = await getOpenIDConfig();
  const token_url = OIDC_TOKEN_ENDPOINT; // oidc_config.token_endpoint;

  return new Promise(function(resolve, reject) {
    const url = new URL(token_url);

    const post_data = querystring.stringify({
      'client_id' : OIDC_CLIENT_ID,
      'client_secret' : OIDC_CLIENT_SECRET,
      'code' : access_code
    });

    const options = {
      hostname: url.host,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
      }
    };

    const req = https.request(options, res => {
      res.on('data', d => {
        if (res.statusCode == 200) {
          resolve(JSON.parse(d.toString()));
        } else {
          resolve({"error": true})
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

if (!IS_LAMBDA) {
  app.listen(LOCAL_PORT, () => {
    console.log(`Listening on port ${LOCAL_PORT}`)
  });
}

module.exports = app;
