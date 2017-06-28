var qs = require('querystring');
var http = require('http');
var formidable = require('formidable');
var pulse = 87;
var spawn = require("child_process").spawn;
var fs = require('fs');
var t=0;
http.createServer(function (request, response) {
    console.log("url = "+request.url);
    /*if (request.method == 'GET'){
		response.end(pulse.toString());
        pulse = Math.round(Math.random()*100);
        //console.log(pulse);
	}*/
    if (request.method == 'POST') {
        if (request.url == '/fileupload') {
            var form = new formidable.IncomingForm();
            form.uploadDir = "./";
            form.keepExtensions = true;
            form.on('file', function(field, file) {
                //rename the incoming file to the file's name
                fs.rename(file.path, form.uploadDir + "/EmergencyImage"+(++t)+".jpg");
            });
            form.parse(request, function (err, fields, files) {
                response.write('File uploaded');
                response.end();
            });
        }else if(request.url =='/test'){
            request.on('end', function(){
                console.log("POST test worked!");
            });
        }else if(request.url == '/coords'){
            console.log("Requested for coordinates");
            var body = '';
            request.on('data', function (data) {
                body += data;
                if (body.length > 1e6)
                    request.connection.destroy();
            });
            request.on('end', function () {
                var post = qs.parse(body);
                console.log("lat = " + post.lat);
                console.log("lon = " + post.lon);
                response.end("coordinates received");
                var processC = spawn('javac',["-cp", ".:json.jar", "maps.java"]);
                processC.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });
                processC.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                });
                processC.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);
                    if(code==0){
                        var exe = spawn('java',["-cp", ".:json.jar", "maps"]);
                        exe.stdout.on('data', (data) => {
                            console.log(`stdout: ${data}`);
                        });
                        exe.stderr.on('data', (data) => {
                            console.log(`stderr: ${data}`);
                        });
                        exe.on('close', (code) => {
                            console.log(`child process exited with code ${code}`);
                        });
                    }
                });

            });
        }else{
            var body = '';

            request.on('data', function (data) {
                body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                if (body.length > 1e6)
                    request.connection.destroy();
            });

            request.on('end', function () {
                var post = qs.parse(body);
                console.log(post.hr);
                pulse = post.hr;
                response.end();
            // use post['blah'], etc.
            });
        }
    }
}).listen(8080);