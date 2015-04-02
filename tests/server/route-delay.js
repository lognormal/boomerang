//
// Imports
//
var path = require("path");
var fs = require("fs");

//
// Mime types
//
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

//
// Load env.json
//
var envFile = path.resolve(path.join(__dirname, "env.json"));

if (!fs.existsSync(envFile)) {
    throw new Error("Please create " + envFile + ". There's a env.json.sample in the same dir.");
}

// load JSON
var env = require(envFile);

var wwwRoot = env.www;
if (wwwRoot.indexOf("/") !== 0) {
    wwwRoot = path.join(__dirname, "..", "..", wwwRoot);
}

module.exports = function(req, res) {
    var q = require("url").parse(req.url, true).query;
    var delay = q.delay;
    var file = q.file;

    var filePath = path.join(wwwRoot, file);

    setTimeout(function() {
        fs.exists(filePath, function(exists) {
            if (!exists) {
                return res.send(404);
            }

            var mimeType = mimeTypes[path.extname(filePath).split(".")[1]];
            res.writeHead(200, {
                "Content-Type": mimeType
            });

            var fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        });
    }, delay);
};
