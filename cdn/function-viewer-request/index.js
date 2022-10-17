function handler(event) {
    var request = event.request;

    var clientIP = event.viewer.ip;
    request.headers['true-client-ip'] = {value: clientIP};

    var host = '';
    if (typeof(request.headers['host']) == "object") {
        host = request.headers['host'].value;
    } else if (typeof(request.headers[':authority']) == "object") {
        host = request.headers[':authority'].value;
    }
    host = host.split(":")[0];
    request.headers['true-host'] = {value: host};

    var ua = '';
    if (typeof(request.headers['user-agent']) == "object") {
        ua = request.headers['user-agent'].value;
    }
    request.headers['true-user-agent'] = {value: ua};

    return request;
}

if (typeof(module) === "object") {
    module.exports = handler;
}
