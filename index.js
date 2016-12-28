var fs = require("fs");
PNG = require('pngjs').PNG;
var plist = require('plist');

var frames;
var Resources;
var sheet;

var inputFiles = fs.readdirSync("./input"); // get files in input

// remove persist
if (inputFiles.indexOf(".persist") > -1) {
    inputFiles.splice(inputFiles.indexOf(".persist"), 1);
}
if ( inputFiles[0].includes(".plist") && inputFiles.indexOf(inputFiles[0].replace(".plist", ".png")) > -1 ||
     inputFiles[0].includes(".png") && inputFiles.indexOf(inputFiles[0].replace(".png", ".plist")) > -1 &&
      inputFiles.length >= 2) {
       start(inputFiles[0].replace(".plist", "").replace(".png",""));
} else {
  console.log("ERROR! Are your files named the same? Not enoug files? Minimum 2. Plist and PNG");
}

function start(file) {
  // read input datasheet
  var datasheet = fs.readFileSync("./input/" + file + ".plist", "utf8")
    .replace(/>rotated</g,'>textureRotated<')
    .replace(/>frame</g, '>textureRect<')
    .replace(/>offset</g, '>spriteOffset<')
	.replace(/player_ball/g, "ball");
	
	fs.writeFileSync("aa.json", datasheet);

  frames = plist.parse(datasheet)["frames"]; // parse the frames (coords)
  Resources = Object.keys(frames); // get all object names
  sheet = PNG.sync.read( fs.readFileSync('./input/' + file + ".png") ); // loads in the datasheet
  extract();
};

function extract() {
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
