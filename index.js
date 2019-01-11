//modules declaration
var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-mplayer')

var media = process.argv[2];

if ( media ) {
	console.log('flash drive name: ' + media);
	// process.emit("SIGINT");
	// process.exit(0);
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


function startCycle() {

	console.log("------------------  n e w  c y c l e  ------------------")
	console.log(new Date())

	var cycle = new Array();

	var filename = "mk.mkv"
	if ( media ) cycle["player"] = omx('/media/pi/'+ media + '/' + filename, 'alsa')
	else cycle["player"] = omx('assets/' + filename, 'alsa')
	pids.push(cycle["player"].pid)
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
			setupJob()
			queueHandler()
		})
	}
	queueHandler()
}

// var obj = JSON.parse(fs.readFileSync('schedule.json', 'utf8'))
// var sch = obj.schedule
var obj
var sch

var date

function closestSlot(array) {
	var times = array.concat() || false
	if (times == false) return false
	var slot = times.shift()
	date = new Date()

	if ( slot > date.getMinutes() ) {
		return slot
		}

	else if ( times.length > 0 ) {
		return closestSlot(times)
		}

	else return "plushour"

}

function nextDay(){
	var nday = sch[date.getDay()+1%7]

	var nd_ohour = nday.ohour
	var nd_chour = nday.chour
	var nd_playtimes = nday.playtimes

	return new Date( date.getFullYear(), date.getMonth(), date.getDate()+1, nd_ohour, nd_playtimes[0], 0, 0)
}

function setupJob(){
	obj = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));
	sch = obj.schedule

	date = new Date()
	var day = sch[date.getDay()%7]
	console.log(date.getDay()%7)

	var ohour = day.ohour
	var chour = day.chour
	var playtimes = day.playtimes
	var job

	if ( ohour > date.getHours() ) {
		job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), ohour, playtimes[0], 0, 0)
	}

	else if ( ohour <= date.getHours() && chour >= date.getHours()) {
		var spot = closestSlot(playtimes)

		if ( spot == "plushour" && date.getHours()+1 <= chour && date.getHours()+1 < 24 ) {
			job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()+1, playtimes[0], 0, 0)

		}

		else if ( spot == "plushour" && ( date.getHours()+1 > chour || date.getHours()+1 >= 24 )) {
			job = nextDay()
		}

		else job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), spot, 0, 0)
	}

	else if (chour < date.getHours()) {

		job = nextDay()

	}

	console.log(job)

	var j = schedule.scheduleJob(job, function(fireDate){
		console.log('new cycle enqueued')
		playerQueue.push(function() {
			return startCycle()
		})
		if ( queueRunning === false ) queueHandler()
	});
}

//first job setup
setupJob()
