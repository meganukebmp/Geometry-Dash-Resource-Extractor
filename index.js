var fs = require("fs");
PNG = require('pngjs').PNG;

var datasheet = fs.readFileSync("./input/sheet.json", "utf8").replace(/"rotated"/g,'"textureRotated"').replace(/"frame"/g, '"textureRect"'); // read input datasheet
var frames = JSON.parse(datasheet)["frames"]; // parse the frames (coords)
var Resources = Object.keys(frames); // get all object names
var sheet = PNG.sync.read( fs.readFileSync('./input/sheet.png') ); // loads in the datasheet

// iterate through all objects
for (i=0; i<Resources.length; i++) {
  var objectName = Resources[i]; // get current object key
  var objectData = frames[objectName]; // get current object data

  // don't extract glows
  if ( !objectName.includes("glow") ) {

    // get X, Y, width and height values
    var objX = parseCoords(objectData.textureRect)[0][0]
    var objY = parseCoords(objectData.textureRect)[0][1]
    var objW = parseCoords(objectData.textureRect)[1][0]
    var objH = parseCoords(objectData.textureRect)[1][1]

    if (objectData.textureRotated) {
      var dst = new PNG({width: objH, height: objW, filterType:4} ); //creates a blank PNG object
      PNG.bitblt(sheet, dst, objX, objY, objH, objW, 0, 0); // pumps into new image with flipped width and height
      dst = rotateImage(dst); // pass to rotate
    } else {
      var dst = new PNG({width: objW, height: objH, filterType:4} ); //creates a blank PNG object
      PNG.bitblt(sheet, dst, objX, objY, objW, objH, 0, 0); // pump into new image
    };

    // check if directory for file exists if not create
    var dir = "./out/" + objectName.split("_")[0] + "/"
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    fs.writeFileSync(dir + objectName, PNG.sync.write(dst)); // write extracted file

    console.log("Finished " + objectName)
  };
};

// turn weird data into coordinate array
function parseCoords(coords) {
  return JSON.parse(coords.replace(/{/g, "[").replace(/}/g, "]"))
}

// rotate the image -90 degrees
function rotateImage(image) {
  console.log("rotating...")
  var dst = new PNG({width: image.height, height: image.width, filterType:4} ); //creates a blank PNG object with flipped height and width
  for (var y = 0; y < image.height; y++) {
    for (var x = 0; x < image.width; x++) {
      var idx = (image.width * y + x) << 2;
      var didx = (image.height * (image.width-x-1) + y) << 2; // flips width and height

        dst.data[didx] = image.data[idx]; // copy pixel at XY to pixel at YX
        dst.data[didx+1] = image.data[idx+1];
        dst.data[didx+2] = image.data[idx+2];
        dst.data[didx+3] = image.data[idx+3];
    }
  };

  return dst;
}
