
//get required libraries for requests and sqlite3
const http = require('http')
const fs = require('fs')
const url = require('url')
const db = require('better-sqlite3')('ice.db')


const requestListener = function (req, res) {
	
	//handle request for all car sessions
    if (req.url.indexOf('/api/sessions') === 0) {
		res.writeHead(200)
	
	//select all unique sessions via SQLite3, return as json
		let rows = db.prepare('SELECT DISTINCT car_session FROM car_data').all()
		let json = {rows}
		res.end(JSON.stringify(json))
	}
	//handle requests for data
	else if (req.url.indexOf('/api/data') === 0) {
		res.writeHead(200)
	//parse parameters from request url
		let params = url.parse(req.url, true).query
	
	//return error without parameters
		if(!params.car_session) {
			res.writeHead(400)
			res.end()
		
		//select all data from the requested session via SQLite3
		} else {
			let rows = db.prepare('SELECT * FROM car_data WHERE car_session = ?').all(params.car_session)
			let json = {rows}

			//return as json
			res.end(JSON.stringify(json))
		}
	
	//handle requests for others in local filesystem
	} else {
		console.log(__dirname + req.url)
		if(req.url.length < 2) {
			let read = fs.createReadStream("index.html")
		read.pipe(res)
		} else {
		let read = fs.createReadStream(__dirname + req.url)
		read.pipe(res)
		}
	}
}

//initialize simple http server on port 8080
const server = http.createServer(requestListener)
server.listen(process.env.PORT)
