var JSFtp = require("jsftp");

var ftp = new JSFtp({
  host: '130.7.5.49',
  user: 'tarqeem',
  pass: 'tarqeem',
  debugMode: true
});

ftp.on('jsftp_debug', function(eventType, data) {
  console.log('DEBUG: ', eventType);
  console.log(JSON.stringify(data, null, 2));
});

// ftp.put('./raw.txt', '/upload/raw.txt', function(hadError) {
//   if (hadError)
// console.error(hadError);
//   else
//     console.log("File transferred successfully!");
// });

// ftp.ls("upload/", (err, res) => {
//     res.forEach(file => console.log(file.name));
// });

ftp.get("upload/FilmArray_FA2_2UA7351N8X_191218_130054_890.xml", "FilmArray/FilmArray_FA2_2UA7351N8X_191218_130054_890.xml", err => {
    if (err) {
      return console.error(err);
    }
    console.log("File copied successfully!");
});