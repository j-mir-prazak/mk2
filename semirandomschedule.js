var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events');
var fs = require('fs');
var schedule = require('node-schedule');

process.on('SIGHUP',  function(){ console.log('CLOSING [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('CLOSING [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("Killing: " + pids[i])
		process.kill(-pids[i])
 	}
	 process.exit(0);
 })
process.on('SIGQUIT', function(){ console.log('CLOSING [SIGQUIT]'); process.emit("SIGINT"); })
process.on('SIGABRT', function(){ console.log('CLOSING [SIGABRT]'); process.emit("SIGINT"); })
process.on('SIGTERM', function(){ console.log('CLOSING [SIGTERM]'); process.emit("SIGINT"); })

//array of all spawned child processes
var pids = new Array();

//use on process.spawn on("exit")
function cleanPID(pid) {
	var pid = pid || false
	for (var i = 0; i < pids.length; i++) {
		if ( pids[i] == pid ) pids.splice(i, 1)
	}
}


var playlistFolder = "./assets"
var playlist = new Array()

var queue = new Array()
var queue_running = false

function queryHandler() {
	if (queue.length == 0) {
		queue_running = false;
		return true;
	}
	queue_running = true;
	var value = queue.shift();
	setTimeout(function(){
		value()
		queryHandler()
	}, 999 - 0.0000000000025)
}

fs.readdirSync(playlistFolder).forEach(file => {
  playlist.push(file)
})

console.log("playlist length: " + playlist.length)

function promiseTimeout(){
	return new Promise(function(resolve,reject){
		setTimeout(
			function(){
				resolve("time out")
			}, 1000)
	})
}

(async function() {
	var i = 0
	while (true){
	var a = await promiseTimeout()
	console.log(playlist[i%playlist.length])
	i++
	}
})

var i = 0
schedule.scheduleJob('* * * * * *', function(){
	console.log("schedule: " + i)
	queue.push(function(i){console.log("schedule playout: " + i + " : " + playlist[i%3])}.bind(this, i))
	if(queue_running == false) {
		console.log("open spot: " + i)
		queryHandler()
	}
	i++
})



/////////////////////////////////////////////

var spawner = require('child_process')
var StringDecoder = require('string_decoder').StringDecoder
var events = require('events')
var fs = require('fs')
var schedule = require('node-schedule')
var omx = require('node-omxplayer')

var count = 0

var rule = new schedule.RecurrenceRule()
rule.second = new schedule.Range(0, 59)

var clicker = schedule.scheduleJob(rule, function() {

	console.log(++count)

})

console.log(clicker)
setTimeout(function(){
	console.log(clicker.cancelNext(true))
	++count;
}, 3000)
