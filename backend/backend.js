var sys = require('sys');
var http = require('http');
var url = require('url');
var paperboy = require('./paperboy/lib/paperboy');

var PORT = 8008;
var HOST = 'http://wings.cloudant.com:5984';
var STATIC = '..';

function forwardRequest(inRequest, inResponse, uri, headers) {
    sys.log('Remote url ' + uri);
    uri = url.parse(uri);
    var out = http.createClient(uri.port || 80, uri.hostname);
    var path = uri.pathname + (uri.search || '');
    headers = process.mixin(inRequest.headers, headers, {
        'host': uri.hostname + ':' + uri.port,
        'x-forwarded-for': inRequest.connection.remoteAddress
    });

    var outRequest = out.request(inRequest.method, path, headers);

    inRequest.addListener('data', function(chunk) { outRequest.write(chunk) });
    inRequest.addListener('end', function() {
        outRequest.addListener('response', function(outResponse) {
            inResponse.writeHeader(outResponse.statusCode, outResponse.headers);
            outResponse.addListener('data', function(chunk) { inResponse.write(chunk); });
            outResponse.addListener('end', function() { inResponse.close(); });
        });
        outRequest.close();
    });
};

function handleRequest(req, res) {
    if (req.url.substring(0, 4) == '/db/') {
        forwardRequest(req, res, HOST + req.url.substring(3));
    } else {
        sys.log('Static file ' + req.url);
        paperboy.deliver(STATIC, req, res).otherwise(function() {
            res.writeHeader(404, {'Content-Type': 'text/plain'});
            res.write('Not found!');
            res.close();
        });
    }
}

process.addListener('uncaughtException', function(e) {
    sys.log(e.stack);
});

http.createServer(handleRequest).listen(PORT);

sys.puts('Serving static files at http://localhost:'+PORT+'/ and CouchDB at http://localhost:'+PORT+'/db/')

