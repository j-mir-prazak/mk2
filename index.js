//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-omxplayer')

var media = process.argv[2];

console.log('flash drive name: ' + media);
if ( ! media ) {
	process.emit("SIGINT");
	process.exit(0);
}

//clean up
process.on('SIGHUP',  function(){ console.log('\nCLOSING: [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('\nCLOSING: [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("KILLING: " + pids[i])
		process.kill(-pids[i])
 	}
	 process.exit(0);
 })
process.on('SIGQUIT', function(){ console.log('\nCLOSING: [SIGQUIT]'); process.emit("SIGINT"); })
process.on('SIGABRT', function(){ console.log('\nCLOSING: [SIGABRT]'); process.emit("SIGINT"); })
process.on('SIGTERM', function(){ console.log('\nCLOSING: [SIGTERM]'); process.emit("SIGINT"); })

var pids = new Array();

function cleanPID(pid) {
	var pid = pid || false
	for (var i = 0; i < pids.length; i++) {
		if ( pids[i] == pid ) pids.splice(i, 1)
	}
}

//main code
function languageVersion() {

	var version

	date = new Date().getMinutes()
	if ( ( date >= 0 && date < 15 ) || ( date >= 30 && date < 45 ) ) {
		console.log(date + " : " +  "first" + " : " + ++count)
		version = "1"

	}
	else if ( ( date >= 15 && date < 30 ) || ( date >= 45 ) ) {
		console.log(date + " : " +  "second" + " : " + ++count)
		version = "2"
	}

	// version = 1
	return version

}

function startCycle(version) {

	console.log("------------------  n e w  c y c l e  ------------------")
	console.log(new Date())

	var cycle = new Array();
	var version = version || false

	if ( version == false ) return false

	date = new Date().getMinutes()

	var filename = "setkani." + version + ".mkv"
	console.log(filename)

	cycle["player"] = omx('/media/pi/'+ media + '/' + filename, 'alsa')
	currentState = "fadeout"
	for( i in ttys ) {
		var tty = ttys[i]
		pids.push(cycle["player"].pid)
		if( tty["confirmed"] ) {
			var tty_echo = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "led:" + fadeOutColor), {detached: true})
			console.log(tty["tty"] + " was sent 'led:" + fadeOutColor + "'")
			currentState = fadeOutColor
			pids.push(tty_echo["pid"])
			tty_echo.on('close', function(){
				cleanPID(tty_echo["pid"])
			})
		}
	}

	timeout = setTimeout(function(){
		currentState = "fadein"
		for( tty in ttys ) {
			var tty = ttys[tty]
			if( tty["confirmed"] ) {
				var tty_echo = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "led:"+fadeInColor), {detached: true})
				console.log(tty["tty"] + " was sent 'led:" + fadeInColor + "'")
				currentState = fadeInColor
				pids.push(tty_echo["pid"])
				tty_echo.on('close', function(){
					cleanPID(tty_echo["pid"])
				})
			}
		}
	}, 14*60*1000)
	cycle["timeout"] = timeout
	return cycle

}


var queueRunning = false
var playerQueue = new Array()

function queueHandler() {
	if ( playerQueue.length == 0 ) {
		queueRunning = false
		return true
	}
	queueRunning = true
	var value = playerQueue.shift()
	var entry = value()
	if ( typeof entry == 'object') {
		entry["player"].on('close', function (){
			console.log('playback ended')
			cleanPID[entry.player['pid']]
			queueHandler()
		})
	}
}

var count = 0

var currentState = ""
var fadeInColor = "rgb:199;128;36"
var fadeOutColor = "rgb:008;003;007"
// var player;
// var timeout;

var rule = new schedule.RecurrenceRule()
rule.minute = new Array(0, 15, 30, 45)

var date;
var clicker = schedule.scheduleJob(rule, function() {
	console.log('new cycle enqueued')
	var version = languageVersion()
	playerQueue.push(function() {
		return startCycle(version)
	})
	if ( queueRunning === false ) queueHandler()
})

//cat ttys
function cat(tty) {
	var tty = tty || false
	if ( ! tty ) return false

	tty["catstarted"] = true

	var decoder = new StringDecoder('utf8')
	var string = ""

	var tty_setup = spawner.spawn("bash", new Array("./ttySetup.sh", tty["tty"]), {detached: true})
	pids.push(tty_setup["pid"])
	tty_setup.on('close', function(){
		cleanPID(tty_setup["pid"])
	})

	var tty_cat = spawner.spawn("bash", new Array("./ttyCat.sh", tty["tty"]), {detached: true})
	pids.push(tty_cat["pid"])

	var tty_ready
	//periodical checking until the device respondes
	function echoReady() {
		 tty_ready = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "system:ready"), {detached: true})
		 console.log(tty["tty"] + " was sent 'system:ready'")
		 pids.push(tty_ready["pid"])
		 tty_ready.on('close', function(){
			 cleanPID(tty_ready["pid"])
		 })
	}
	echoReady()
	var echo_ready = setInterval(function(){
		echoReady()
	}, 5000)

	tty_cat.stdout.on('data', (data) => {
		string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {

			if ( string[i].length > 0 && string[i].match(/^system:connected/) && ! tty["confirmed"]) {
				tty["confirmed"] = true
				clearInterval(echo_ready)
				console.log(tty["tty"] + " is connected")
				//setup fade
				if ( currentState == "" ) {
						currentState = fadeOutColor
					}
				var tty_echo = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "led:" + currentState), {detached: true})
				console.log(tty["tty"] + " was sent 'led:" + currentState + "'")
				pids.push(tty_echo["pid"])
				tty_echo.on('close', function(){
					cleanPID(tty_echo["pid"])
					})
			}
			else	if ( string[i].length > 0 && string[i].match(/^system:stillconnected/) && ! tty["confirmed"]) {
				var tty_echo = spawner.spawn("bash", new Array("./ttyEcho.sh", tty["tty"], "system:alert:reset"), {detached: true})
				console.log(tty["tty"] + " was sent RESET")
				pids.push(tty_echo["pid"])
				tty_echo.on('close', function(){
					cleanPID(tty_echo["pid"])
					})

			}


			else if ( string[i].length > 0 && string[i].match(/^led:/) && tty['confirmed']) {
				console.log("serial:"+string[i])

			}
			else if ( string[i].length > 0 ) console.log(string[i]);
		}
		// console.log(output)
	})
	tty_cat.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`)
	})
	tty_cat.on('close', (code) => {
			cleanPID(tty_cat["pid"])
			if ( echo_ready )	clearInterval(echo_ready)
			console.log(tty["tty"] + " was disconnected. killing dimmer on this node.")
			delete ttys[tty["tty"]]
		})
		// console.log("kill ttys")
	return tty_cat;
}



var ttys = new Array();

//ls ttys
function ls(search) {
	var search=search || false
	var ls = spawner.spawn("bash", new Array("-c", "ls " + search), {detached: true})
	var decoder = new StringDecoder('utf-8')

	pids.push(ls["pid"])

	ls.stdout.on('data', (data) => {
	  var string = decoder.write(data)
		string=string.split(/\r?\n/)
		for( var i = 0; i < string.length; i++) {
			if ( string[i].length > 0 && typeof ttys[string[i]] === "undefined") {
				var tty = {
					"tty":string[i],
					"confirmed":false,
					"position":i+1,
					"catstarted":false
				}
				ttys[string[i]] = tty
			}
		}
	});
	//not final state!
	ls.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^ls: cannot access/)) console.log(search + " not found")
		// return false
	});
	ls.on('close', (code) => {
		cleanPID(ls["pid"])
		if (code == 0) {
			for ( i in ttys ) {
				if ( ! ttys[i]["catstarted"] ) {
					console.log(ttys[i])
					cat(ttys[i])
				}
				else "nothing to cat"
			}
		}
		else {
			console.log(search + ' not to be found')
		}
	});
	return ls;
}

setInterval(function(){
	ls("/dev/ttyUS*")
}, 3000)
