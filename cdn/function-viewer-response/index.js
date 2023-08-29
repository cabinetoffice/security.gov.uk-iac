function handler(event) {
    var response = event.response;

    if (typeof(response) == "undefined") {
      console.log("handler: WARNING event.response UNDEFINED! Ensure this function is set to viewer response.");
      if (typeof(event.request) != "undefined") {
        return event.request;
      }
      return;
    }

    var uri = typeof(event.request) == "undefined" ||
              typeof(event.request.uri) == "undefined" ? "/" : event.request.uri;
    
    var to_cache = false;
    if (uri.indexOf("/assets/") == 0) {
      to_cache = true;
    }

    var headers = response.headers;

    var currentHeaderKeys = Object.keys(headers);

    if ('server' in headers) {
        delete headers['server'];
    }
    if ('x-powered-by' in headers) {
        delete headers['x-powered-by'];
    }

    headers['cache-control'] = {
      value: to_cache ? "public, max-age=3600, immutable" : "no-store, private, max-age=0"
    };

    if (!currentHeaderKeys.includes('strict-transport-security')) {
      headers['strict-transport-security'] = { value: "max-age=31536000; includeSubdomains; preload" };
    }

    if (!currentHeaderKeys.includes('expect-ct')) {
      headers['expect-ct'] = { value: "max-age=0" };
    }

    /*
    // generate in html meta tag!
    if (!currentHeaderKeys.includes('content-security-policy')) {
      headers['content-security-policy'] = { value: "base-uri 'self'; object-src 'none'; font-src 'self'; img-src 'self'; script-src 'nonce-gfe-3b2dd955e1e4' 'nonce-main-a7c25231c899' 'nonce-search-760e790e4076'; style-src 'self'; frame-src https://www.youtube-nocookie.com/ https://player.vimeo.com/;" };
    }*/

    if (!currentHeaderKeys.includes('x-content-type-options')) {
      headers['x-content-type-options'] = { value: "nosniff" };
    }

    if (!currentHeaderKeys.includes('x-frame-options')) {
      headers['x-frame-options'] = { value: "DENY" };
    }

    if (!currentHeaderKeys.includes('referrer-policy')) {
      headers['referrer-policy'] = { value: "strict-origin-when-cross-origin" };
    }

    if (!currentHeaderKeys.includes('permissions-policy')) {
      headers['permissions-policy'] = { value: "geolocation=(), microphone=(), camera=(), payment=(), xr-spatial-tracking=(), magnetometer=(), payment=(), sync-xhr=(self)" };
    }

    if (!currentHeaderKeys.includes('cross-origin-embedder-policy')) {
      headers['cross-origin-embedder-policy'] = { value: "unsafe-none" };
    }

    if (!currentHeaderKeys.includes('cross-origin-opener-policy')) {
      headers['cross-origin-opener-policy'] = { value: "same-origin" };
    }

    if (!currentHeaderKeys.includes('cross-origin-resource-policy')) {
      headers['cross-origin-resource-policy'] = { value: "same-origin" };
    }

    return response;
}

if (typeof(module) === "object") {
    module.exports = handler;
}
