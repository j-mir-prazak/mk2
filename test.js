var omx = require('node-mplayer')
var player = omx("./assets/track01.flac")
player.on("close", function(){console.log("done")})
