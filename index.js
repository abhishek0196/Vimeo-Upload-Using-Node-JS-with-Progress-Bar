var Vimeo = require('vimeo').Vimeo;
var http = require("http");
var url = require("url");
var fs = require("fs");
var port = 8090;
var host = "localhost";
var status = 0;
var formidable = require("formidable");
const path = require('path');
try {
    var config = require('./config.json')
  } catch (error) {
    console.error('ERROR: For this example to run properly you must create an API app at ' +
      'https://developer.vimeo.com/apps/new and set your callback url to ' +
      '`http://localhost:8080/oauth_callback`.')
    console.error('ERROR: Once you have your app, make a copy of `config.json.example` named ' +
      '`config.json` and add your client ID, client secret and access token.')
    process.exit()
  }
  if (!config.access_token) {
    throw new Error('You can not upload a video without configuring an access token.')
  }
  
  // Instantiate the library with your client id, secret and access token (pulled from dev site)
  var client = new Vimeo(config.client_id, config.client_secret, config.access_token)
  
  var params = {
    'name': 'Vimeo API SDK test upload',
    'description': "This video was uploaded through the Vimeo API's NodeJS SDK."
  }
  http.createServer(function (req, res) {
    var path = url.parse(req.url, true);
    if(path.pathname.endsWith("")){
        fs.readFile("index.html", function(err, data){
            res.writeHead(200, "ok", { "Content-Type": "text/html"});
            res.write(data);
            res.end();
        });
    }
    else if(path.pathname.endsWith("uploadFile") && req.method === "POST")
    {
       
        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
              
        var oldpath = files.filetoupload.path;
        console.log(oldpath);
        upload(oldpath)
        .then((url)=>{
         console.log(url)
        return  res.end(url);
        })
        })
    } 
    else if(path.pathname.endsWith("uploadFile") && req.method === "GET")
   {
      res.end(status.toString())
   }
}).listen(port, host);
  function upload(filePath)
  {
    return new Promise((resolve,reject)=>{
      client.upload(
        filePath,
        params,
        function (uri) {
          // Get the metadata response from the upload and log out the Vimeo.com url
          client.request(uri + '?fields=link', function (error, body, statusCode, headers) {
            if (error) {
              console.log('There was an error making the request.')
              console.log('Server reported: ' + error)
              return
            }
      
            console.log('"' + filePath + '" has been uploaded to ' + body.link)
      
            // Make an API call to edit the title and description of the video.
            client.request({
              method: 'PATCH',
              path: uri,
              params: {
                'name': 'Vimeo API SDK test edit',
                'description': "This video was edited through the Vimeo API's NodeJS SDK."
              }
            }, function (error, body, statusCode, headers) {
              if (error) {
                console.log('There was an error making the request.')
                console.log('Server reported: ' + error)
                reject(error)
                // return
              }
      
              console.log('The title and description for ' + uri + ' has been edited.')
              resolve(body.link);
              // Make an API call to see if the video is finished transcoding.
              client.request(
                uri + '?fields=transcode.status',
                function (error, body, statusCode, headers) {
                  if (error) {
                    console.log('There was an error making the request.')
                    console.log('Server reported: ' + error)
                    return
                  }
      
                  console.log('The transcode status for ' + uri + ' is: ' + body.transcode.status)
                  
                }
              )
            })
          })
        },
        function (bytesUploaded, bytesTotal) {
          var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
          status = Math.floor(percentage);
          console.log(bytesUploaded, bytesTotal, percentage + '%')
        },
        function (error) {
          console.log('Failed because: ' + error)
        }
      )
    })
  }
  
