
//chart.js configuration settings
var config = {
	
	//line chart
	type: "line",
	
	//three datasets - for chart, compare, and moving average
	data: {
		//initialize empty labels
		labels: [],
		//create each dataset with empty data and labels, set color and assign y axis, don't fill
		datasets: [{
			label: '',
			fill: false,
			backgroundColor: "#ffffff",
			borderColor: "#ff0000",
			data: [],
			yAxisID: "y1"
		}, {
			label: '',
			fill: false,
			backgroundColor: "#000000",
			borderColor: "#000000",
			data: [],
			yAxisID: "y2"
		}, {
			label: '',
			fill: false,
			backgroundColor: "#ffffff",
			borderColor: "#009fff",
			data: [],
			yAxisID: "y1"
		}]
	},
	options: {
		//canvas sizes to div
		responsive: true,
		plugins: {
			//display datapoint info in tooltip
			tooltip: {
				mode: 'index',
				intersect: false,
			}
		},
		legend: {
			//set fontsize, position label under chart
			labels: {
				fontSize: 20
			},
			position: 'bottom'
		},
		//display tooltip for datapoint on hover
		hover: {
			mode: 'nearest',
			intersect: true
		},
		scales: {
			//set, display timestamp label on x axis
			xAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Timestamp',
					fontSize: 20
				}
			}],
			//initialize y axis with no labels
			//assign each to its respective side and ID
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: '',
					fontFamily: "",
					fontSize: 20
				},
				position: "left",
				id: "y1",
			}, {
				scaleLabel: {
					display: true,
					labelString: '',
					fontSize: 20
				},
				position: "right",
				id: "y2",
			}]
		},
		//enable zoom for x axis, set to fastest configuration
		//unable to find a work around for apparent limitations here
		zoom: {
			enabled: true,
			mode: 'x',
			sensitivity: 0,
			speed: 1,
			threshold: 0
		},
		//enable drag to pan on the x and y axis
		pan: {
			enabled: true,
			mode: 'xy'
		}
	}
};

//assign new chart to canvas, set global font properties
var ctx = document.getElementById('canvas').getContext('2d')
var chart = new Chart(ctx, config)
Chart.defaults.global.defaultFontColor = '#000000'
Chart.defaults.global.defaultFontFamily = 'Times New Roman'
window.myLine = chart

//helper varibles for dynamic spacing of message element dependent on device
var message_buffer = '&nbsp;&nbsp;&nbsp;'
var message_break = message_buffer

//if window height > window width, adapt several components
if(window.innerHeight > window.innerWidth) {	

	//formatting
	message_break = "<br>"

	//set aspect ratio to that of the display and update
	chart.aspectRatio = (window.innerWidth / window.innerHeight)
	chart.resize()
} else {
	//not mobile
	//remove zoom reset button, double click will work
	document.getElementById('zoomButton').setAttribute('hidden', 'true')
}

//initialize several variables that will be accessed throughout functions
var query = ''
var loaded_log = []
var prepared_log = []

//initialize label and unit lists with indices matching query codes in SQLite database, will be looped through
label_book = ['engine rpm', 'vehicle speed', 'intake pressure', 'intake temperature',
		'boost pressure', 'volumetric efficiency', 'engine load', 'timing advance', 'throttle position', 'air/fuel ratio', 
		'coolant temperature', 'ambient temperature']
		
unit_book = ['', '(mph)', '(psi)', '(\u00B0f)', '(psi)', '(%)', '(%)', '(\u00B0)', '(%)', '', '(\u00B0f)', '(\u00B0f)']

//get function takes url and pipes GET request response to prepare function as json (asynchronous)
function get(query) {
	let data = fetch(query)
	.then(response => response.json()).then(prepare)
}

//log select function fires on a new selection in navbar 'load' dropdown menu
function log_select(dropdown) {
	if(dropdown.selectedIndex > 0) {
		
		//communicate program working via message element
		document.getElementById('message').innerHTML = '<i>Loading...</i>'
		
		//build appropriate query for node API with car session parameter as the one selected
		//send GET 
		query = '/api/data?car_session=' + dropdown.value
		get(query)
	} else {
		
		//user selected blank option, assume they want to clear the chart
		clearChart()
		chart.update()
	}
}

//display function fires on new selection in chart or compare dropdown menus
function display(dropdown) {
	
	//user selected blank option, assume they want to remove the dataset
	if(dropdown.selectedIndex == 0) {
		chart.data.datasets[dropdown.name].data = ''
		chart.data.datasets[dropdown.name].label = ''
		document.getElementById('studySelect').selectedIndex = 0
		chart.options.scales.yAxes[dropdown.name].scaleLabel.labelString = ''
		
		//if the charted dataset was removed, clear any message and moving average
		if(dropdown.name == 0) {
			document.getElementById('message').innerHTML = ''
			chart.data.datasets[2].data = []
			chart.data.datasets[2].label = ''
		} else { 
		
			//if compared dataset was removed, just remove the correlation from the message
			document.getElementById('message').innerHTML = document.getElementById('message').innerHTML.substring(0, document.getElementById('message').innerHTML.indexOf('r\u00B2'))
		}
	} else {
		if(document.getElementById('logSelect').selectedIndex > 0) {
			//if a non-blank dropdown option was selected and a log is loaded
			//assign the relevant data and labels to the axis according to chart or compare dropdown
			chart.data.datasets[dropdown.name].data = prepared_log[dropdown.value]
			chart.data.datasets[dropdown.name].label = label_book[dropdown.value] + ' ' + unit_book[dropdown.value]
			chart.options.scales.yAxes[dropdown.name].scaleLabel.labelString = label_book[dropdown.value] + ' ' + unit_book[dropdown.value]	
			
			//construct the information message if data is charted
			if(chart.data.datasets[0].data.length > 1) {
				document.getElementById('message').innerHTML = 
					 message_break +"<strong>high: </strong> " + +parseFloat(Math.max(...chart.data.datasets[0].data)).toFixed(3)
					 + message_buffer + "<strong>mean: </strong>" + +parseFloat(simple_average(chart.data.datasets[0].data)).toFixed(3)
					 + message_break + "<strong>low: </strong>" + +parseFloat(Math.min(...chart.data.datasets[0].data)).toFixed(3)
				
				//append the correlation to the message is data is compared
				if(chart.data.datasets[1].data.length > 1) {
					document.getElementById('message').innerHTML = document.getElementById('message').innerHTML 
						+ message_buffer + '<strong>r\u00B2 correlation= </strong>' 
						+ +parseFloat(r_squared(chart.data.datasets[0].data, chart.data.datasets[1].data)).toFixed(3)
				}
			}
			//update moving average if one was selected and chart was changed
			if(chart.data.datasets[2].data.length > 1) {
				new_study(document.getElementById('studySelect'))
			}
		} else {
			//no log selected, prompt the user 
			document.getElementById('chartSelect').selectedIndex = 0
			document.getElementById('compareSelect').selectedIndex = 0
			document.getElementById('message').innerHTML = '<i>Please load something...</i>'
		}
	}
	//update chart
	chart.update()
}

//clear all datasets and labels
//clear message element
function clearChart() {
	for(var i = 0; i < 3; i++) {
		chart.data.datasets[i].data = []
		chart.data.datasets[i].label = ''
	}
	chart.data.labels = []
	document.getElementById('message').innerHTML = ''
	chart.options.scales.yAxes[0].scaleLabel.labelString = ''
	chart.options.scales.yAxes[1].scaleLabel.labelString = ''
	document.getElementById('chartSelect').selectedIndex = 0
	document.getElementById('studySelect').selectedIndex = 0
	document.getElementById('compareSelect').selectedIndex = 0
}

//helper function returns simple average of a list
function simple_average(data) {
	let sum = 0
	for(var i = 0; i < data.length; i++) {
		sum += data[i]
	}
	return sum / data.length
}

//moving average function returns simple average of a rolling window of selected length
function moving_average(data, n) {
	let avg=[data[0]]	
	for(var i = 2; i <= data.length; i++) {
		if(i < n) {
			avg.push(simple_average(data.slice(0, i)))
		} else {
			avg.push(simple_average(data.slice(i-n, i)))
		}
	}
	return avg
}

//complex mathematical operation of low familiarity, found appropriate to use foreign function as if a library
//r squared function taken from www.
function r_squared(x, y) {
	var shortestArrayLength = 0;
	if(x.length == y.length) {
		shortestArrayLength = x.length;
	} else if(x.length > y.length) {
		shortestArrayLength = y.length;
	} else {
		shortestArrayLength = x.length;
	}
  
	var xy = [];
	var x2 = [];
	var y2 = [];
  
	for(var i=0; i<shortestArrayLength; i++) {
		xy.push(x[i] * y[i]);
		x2.push(x[i] * x[i]);
		y2.push(y[i] * y[i]);
	}
  
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_x2 = 0;
	var sum_y2 = 0;
  
	for(var i=0; i< shortestArrayLength; i++) {
		sum_x += x[i];
		sum_y += y[i];
		sum_xy += xy[i];
		sum_x2 += x2[i];
		sum_y2 += y2[i];
	}
  
	var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
	var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
	var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
	var step4 = Math.sqrt(step2 * step3);
	var answer = step1 / step4;
  
	if(isNaN(answer)) {
		answer = 0
	}
  
	return answer;
}

//prepare function parses json data from node server
function prepare(message) {
	//parse json 
	loaded_log = JSON.stringify(message)
	loaded_log = JSON.parse(loaded_log)
	
	//2d array holds a list for each query code
	//last holds timestamp
	prepared_log = [[], [], [], [], [], [], [], [], [], [], [], [], []]
	prepared_log[12].push(loaded_log.rows[0].timeMs)
	
	//iterate through each row in json
	//for each new timestamp, push it to array
	//push data row by row to array at index of query code
	for(var i = 0; i < loaded_log.rows.length; i++) {
		if(prepared_log[12].indexOf(loaded_log.rows[i].timeMs) < 0) {
			prepared_log[12].push(loaded_log.rows[i].timeMs)
		}
		prepared_log[loaded_log.rows[i].query_code].push(loaded_log.rows[i].query_value) 
	}
	
	//clear any old chart data, set timestamps as x axis label, update
	clearChart()
	chart.data.labels = prepared_log[12]
	chart.update()
}

//new study function adds moving average dataset to chart
function new_study(dropdown) {
	//if blank option selected, assume user wants to remove the moving average
	if(dropdown.selectedIndex == 0) {
		chart.data.datasets[2].data = []
		chart.data.datasets[2].label = ''
		chart.update()
	} else {
		//if something is charted, create array of selected length moving average and assign to chart dataset
		if(document.getElementById('chartSelect').selectedIndex > 0) {
			chart.data.datasets[2].data = moving_average(chart.data.datasets[0].data, dropdown.value)
			chart.data.datasets[2].label = chart.data.datasets[0].label + ' ' + dropdown.options[dropdown.selectedIndex].text
			chart.update()
		} else {
			//if nothing is charted, prompt the user
			document.getElementById('studySelect').selectedIndex = 0
			document.getElementById('message').innerHTML = '<i>Please chart something...</i>'
		}
	}
}

//function populate handles response of unique session from node api
function populate(message) {
	let data = JSON.stringify(message)
	data = JSON.parse(data)
	
	//create an option for each session that is returned and push it to nav 'load' dropdown menu
	for(log = 0; log < data.rows.length; log++) {
		let option = document.createElement('option')
		option.value = data.rows[log].car_session
		option.innerHTML = "log-" + data.rows[log].car_session
		document.getElementById('nav').getElementsByClassName('logSelect')[0].appendChild(option)
	}
	
	//create an option for each query code as its respective label and push to chart and compare dropdown menus
	for(label = 0; label < label_book.length; label++) {
		let option = document.createElement('option')
		option.value = label
		option.innerHTML = label_book[label]
		document.getElementById('chartSelect').appendChild(option)
		
		let option_clone = document.createElement('option')
		option_clone.value = label
		option_clone.innerHTML = label_book[label]
		
		document.getElementById('compareSelect').appendChild(option_clone)
	}	
	
	document.getElementById('logSelect').selectedIndex = 2
	document.getElementById('chartSelect').selectedIndex = 5
	document.getElementById('studySelect').selectedIndex = 2
	document.getElementById('compareSelect').selectedIndex = 2
	log_select(document.getElementById('logSelect'))
	display(document.getElementById('chartSelect'))
	display(document.getElementById('compareSelect'))
	new_study(document.getElementById('studySelect'))
	
	
}

//send GET request to node server for all sessions, pipe response to populate handler function
let data = fetch('/api/sessions')
	.then(response => response.json()).then(populate)

//reset zoom function changes meta attribute to allow scaling, resets zoom, re-disables scaling meta attribute
function resetZoom() {
	document.querySelector('meta[name="viewport"]').setAttribute("content", "user-scalable=yes")
	window.myLine.resetZoom();
	document.querySelector('meta[name="viewport"]').setAttribute("content", "user-scalable=no")
}