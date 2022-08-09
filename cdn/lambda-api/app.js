const express = require('express')
const ipRangeCheck = require("ip-range-check");
const cookieParser = require('cookie-parser')
const { getCurrentInvoke } = require('@vendia/serverless-express')

const FUNCTION_NAME = process.env['AWS_LAMBDA_FUNCTION_NAME'];
const IS_LAMBDA = (typeof(FUNCTION_NAME) == "string");
const LOCAL_PORT = 8002;

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-2' });

let COOKIE_NAME = "__Host-Session";

const app = express()
app.ALLOWED_EMAIL_DOMAINS = strToList(process.env['ALLOWED_EMAIL_DOMAINS']);
app.ALLOWED_IPS = strToList(process.env['ALLOWED_IPS']);

if (!IS_LAMBDA) {
  app.SESSION_SECRET = "ABC123";
  COOKIE_NAME = "Session";
} else if (process.env["SESSION_SECRET"].length == 0) {
  return false;
} else {
  app.SESSION_SECRET = process.env["SESSION_SECRET"];
}

app.use(express.json());
app.use(cookieParser(app.SESSION_SECRET));

// ==== routes ====

app.use((req, res, next) => {
  res.on('finish', async () => {
    const { event, context } = getCurrentInvoke();
    console.log(JSON.stringify({
      "event": event,
      "context": context,
      "result": res,
    }));
  });
  next();
});

app.use((req, res, next) => {
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

  // set req.host
  let host = '';
  if ('true-host' in norm_headers) {
      host = norm_headers['true-host'];
  } else if ('host' in norm_headers) {
      host = norm_headers['host'];
  } else if (':authority' in norm_headers) {
      host = norm_headers[':authority'];
  }
  req.hostname = host.split(":")[0];

  let allowed_hosts = [
    "nonprod.security.gov.uk",
    "security.gov.uk"
  ];
  if (!IS_LAMBDA) {
    allowed_hosts.push("localhost");
    allowed_hosts.push("127.0.0.1");
  }

  // return bad request if the host isn't recognised
  if (!allowed_hosts.includes(req.hostname)) {
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

app.get('/api/teapot', (req, res) => {
  res.status(418);
  res.send("I'm a teapot");
});

app.get('/api/auth/status', (req, res) => {
  let result = { "signed_in": false };

  try {
    if (COOKIE_NAME in req.signedCookies && req.signedCookies[COOKIE_NAME]) {
      // if the expiresAt date is greater than the date now, then use the sign_in value
      if (Date.parse(req.signedCookies[COOKIE_NAME].expiresAt) > (new Date())) {
        result = req.signedCookies[COOKIE_NAME];
      }
    }
  } catch (e) {
    console.log("/api/auth/status:error:", e);
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(result));
});

app.get('/api/auth/sign-in', (req, res) => {
  const signed_in = check_sign_in_from_request(req);

  let redirect_url = "/no-access";
  
  if ("redirect" in req.query && signed_in) {
    let redirect_qs = req.query["redirect"].toLowerCase();
    if (redirect_qs.match(/^\//)) {
      if (redirect_qs.indexOf(" ") > -1) {
        redirect_qs = encodeURI(redirect_qs);
      }
      redirect_url = redirect_qs;
    }
  }

  const now = new Date();
  if (signed_in) {
    const expiresAt = new Date(+now + (6 * 60 * 60 * 1000));
    const session = {
      "signed_in": signed_in,
      "email": null,
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
  } else {
    res.cookie(COOKIE_NAME, "", {
      expires: now,
      httpOnly: false,
      path: "/",
      signed: true,
      sameSite: "lax",
      secure: IS_LAMBDA,
    });
  }

  res.redirect(redirect_url);
});

app.get('*', (req, res) => {
  res.status(204);
  res.send("No Content");
});

// ==== functions ====

function strToList(s) {
  if (typeof(s) != "string" || s.trim() == "") { return []; }
  return s.toLowerCase().replaceAll(" ","").split(",");
}

function check_sign_in_from_request(req) {
  return check_ip(req.ip);
}

function check_email(email) {
  let res = false;

  if (!email || typeof(email) == "undefined" || email.indexOf("@") == -1) {
    return res;
  }

  const domain = email.toLowerCase().split("@")[1];

  for (var i = 0; i < app.ALLOWED_EMAIL_DOMAINS.length; i++) {
    if (app.ALLOWED_EMAIL_DOMAINS[i].indexOf("*") == 0) {
      const domainEnding = app.ALLOWED_EMAIL_DOMAINS[i].slice(1);
      if (app.ALLOWED_EMAIL_DOMAINS.endsWith(domainEnding)) {
        res = true;
        break;
      }
    } else if (app.ALLOWED_EMAIL_DOMAINS[i] == domain) {
      res = true;
      break;
    }
  }

  return res;
}

function check_ip(ip) {
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
