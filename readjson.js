var fs = require('fs');
var schedule = require('node-schedule')

//read json with time schedule
var obj = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));
var sch = obj.schedule

var date = new Date()


function closestSlot(array) {
	var times = array || false
	if (times == false) return false
	var slot = times.shift()

	if ( slot > date.getMinutes() ) {
		console.log("first")
		return slot
		}

	else if ( times.length > 0 ) {
		console.log("second")
		return closestSlot(times)
		}

	else return 0

}

function setupJob(){
	var day = sch[date.getDay()]

	var ohour = day.ohour
	var chour = day.chour
	var playtimes = day.playtimes
	var job

	if ( ohour > date.getHours() ) {
		job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), ohour, playtimes[0], 0)
	}

	else if ( ohour < date.getHours() && chour > date.getHours()) {
		var spot = closestSlot(playtimes)
		job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), spot, 0)
	}

	else if (chour < date.getHours()) {
		var nday = sch[date.getDay()+1]

		var nd_ohour = day.ohour
		var nd_chour = day.chour
		var nd_playtimes = day.playtimes

		job = new Date( date.getFullYear(), date.getMonth(), date.getDate()+1, nd_ohour, nd_playtimes[0], 0)

	}

	console.log(job)

	var j = schedule.scheduleJob(job, function(fireDate){
	  
	});






}


// function playtime() {
//
// 	var version
//
// 	date = new Date().getMinutes()
// 	if ( ( date >= 0 && date < 15 ) || ( date >= 30 && date < 45 ) ) {
// 		console.log(date + " : " +  "first" + " : " + ++count)
// 		version = "1"
//
// 	}
// 	else if ( ( date >= 15 && date < 30 ) || ( date >= 45 ) ) {
// 		console.log(date + " : " +  "second" + " : " + ++count)
// 		version = "2"
// 	}
//
// 	// version = 1
// 	return version
//
// }
//
//
//
// var rule = new schedule.RecurrenceRule()
// rule.minute = new Array(0, 15, 30, 45)
//
// var date;
// var clicker = schedule.scheduleJob(rule, function() {
// 	console.log('new cycle enqueued')
// 	var version = languageVersion()
// 	playerQueue.push(function() {
// 		return startCycle(version)
// 	})
// 	if ( queueRunning === false ) queueHandler()
// })


setupJob()

// var job = new Date( date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 3, 0)
// var j = schedule.scheduleJob(job, function(fireDate){
//   console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
// });
