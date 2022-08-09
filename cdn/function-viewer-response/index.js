// defaults:
var DELETE_SRV_HEADER = "true";
var HEADER_STS        = "max-age=31536000; includeSubdomains; preload";
var HEADER_EXPECTCT   = "max-age=0";
var HEADER_CSP        = "default-src 'self'";
var HEADER_CSPRO      = "NULL";
var HEADER_XCTO       = "nosniff";
var HEADER_XFO        = "DENY";
var HEADER_RF         = "strict-origin-when-cross-origin";
var HEADER_PP         = "geolocation=(), microphone=(), camera=(), payment=(), xr-spatial-tracking=(), magnetometer=()";
var HEADER_FP         = "geolocation 'none'; microphone 'none'; camera 'none'; payment 'none'; xr-spatial-tracking 'none'; magnetometer 'none';";
var HEADER_COEP       = "require-corp";
var HEADER_COOP       = "same-origin";
var HEADER_CORP       = "same-origin";

function handler(event) {
    var response = event.response;
    var headers = response.headers;

    var currentHeaderKeys = Object.keys(headers);

    if (DELETE_SRV_HEADER == 'true' && 'server' in headers) {
        delete headers['server'];
    }
    if (DELETE_SRV_HEADER == 'true' && 'x-powered-by' in headers) {
        delete headers['x-powered-by'];
    }

    if (HEADER_STS != 'NULL' && !currentHeaderKeys.includes('strict-transport-security')) {
      headers['strict-transport-security'] = { value: HEADER_STS };
    }

    if (HEADER_EXPECTCT != 'NULL' && !currentHeaderKeys.includes('expect-ct')) {
      headers['expect-ct'] = { value: HEADER_EXPECTCT };
    }

    if (HEADER_CSP != 'NULL' && !currentHeaderKeys.includes('content-security-policy')) {
      headers['content-security-policy'] = { value: HEADER_CSP };
    }

    if (HEADER_CSPRO != 'NULL' && !currentHeaderKeys.includes('content-security-policy-report-only')) {
      headers['content-security-policy-report-only'] = { value: HEADER_CSPRO };
    }

    if (HEADER_XCTO != 'NULL' && !currentHeaderKeys.includes('x-content-type-options')) {
      headers['x-content-type-options'] = { value: HEADER_XCTO };
    }

    if (HEADER_XFO != 'NULL' && !currentHeaderKeys.includes('x-frame-options')) {
      headers['x-frame-options'] = { value: HEADER_XFO };
    }

    if (HEADER_RF != 'NULL' && !currentHeaderKeys.includes('referrer-policy')) {
      headers['referrer-policy'] = { value: HEADER_RF };
    }

    if (HEADER_PP != 'NULL' && !currentHeaderKeys.includes('permissions-policy')) {
      headers['permissions-policy'] = { value: HEADER_PP };
    }

    if (HEADER_FP != 'NULL' && !currentHeaderKeys.includes('feature-policy')) {
      headers['feature-policy'] = { value: HEADER_FP };
    }

    if (HEADER_COEP != 'NULL' && !currentHeaderKeys.includes('cross-origin-embedder-policy')) {
      headers['cross-origin-embedder-policy'] = { value: HEADER_COEP };
    }

    if (HEADER_COOP != 'NULL' && !currentHeaderKeys.includes('cross-origin-opener-policy')) {
      headers['cross-origin-opener-policy'] = { value: HEADER_COOP };
    }

    if (HEADER_CORP != 'NULL' && !currentHeaderKeys.includes('cross-origin-resource-policy')) {
      headers['cross-origin-resource-policy'] = { value: HEADER_CORP };
    }

    //Return modified response
    return response;
}

if (typeof(module) === "object") {
    module.exports = handler;
}
