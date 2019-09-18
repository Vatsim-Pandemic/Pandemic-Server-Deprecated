const https = require("https");
const async = require("async");
const fs = require("fs");

module.exports = {
	getAirport: getAirport,
};

const airportMap = new Map();
const failedAirportMap = new Map();
const queue = async.queue(downloadAirport, 2);

try{
	let airports = JSON.parse(fs.readFileSync("airports.json"));

	if(!airports) throw new Error("Gross Airports.json");

	for(let airport in airports.goodAirports) {
		//console.log(airports.goodAirports[airport]);
		airportMap.set(airports.goodAirports[airport].data.icao, airports.goodAirports[airport]);
	}

	for(let airport in airports.badAirports) {
		failedAirportMap.set(airports.badAirports[airport], airports.badAirports[airport]);
	}

} catch (err) {
	console.error(err);
	//fs.writeFileSync("airports.json");
}

function downloadAirport(icao, callback) {
	if(airportMap.has(icao)) return callback(undefined, airportMap.get(icao));
	if(failedAirportMap.has(icao)) return callback(new Error(icao + " not found previously"));

	const options = {
		host: "fshub.io",
		path: `/api/v3/airport/${icao}`,
		method: "get",
		headers: {
			"X-Pilot-Token": "UkKvvyWAWhWRwZpZQCyUxZFAyg1Z5ZN3rxaDs2edQlSeYqRVX9jgoYleXLwl",
		}
	}

	let airports = {
		goodAirports: [],
		badAirports: [],
	}; 

	try{
		airports = JSON.parse(fs.readFileSync("airports.json"));
	} catch (err) {
		fs.writeFileSync("airports.json");
	}


	console.log("Retrieving Airport Info: " + icao);
	if(icao == "?") return callback(new Error(icao + " not found"));

	https.get(options, res =>{
		let body = "";

		res.on("error", err => {
			return callback(err);
		});

		res.on("data", data => {
			body += data;
		});

		res.on("end", async () => {
			try {
				body = JSON.parse(body);
			}
			catch(err) {
				await sleep(60000);
				return downloadAirport(icao, callback);
			}

			if(body.error) {
				failedAirportMap.set(icao, body);
				airports.badAirports[airports.badAirports.length] = icao;
				fs.writeFileSync("airports.json", JSON.stringify(airports));
				return callback(new Error(icao + " not found"));
			}

			
			airports.goodAirports[airports.goodAirports.length] = body;
			airportMap.set(icao, body);
			fs.writeFileSync("airports.json", JSON.stringify(airports));
			//console.log(JSON.stringify(body));
			return callback(undefined, body);
		});
	});
}

/**
 * Get airport information from an internal map, or request the data from FSHub
 * @param {String} icao
 */
async function getAirport(icao) {
	return new Promise((resolve, reject) => {
		queue.push(icao, (err, airport) => {
			if(err) {
				reject(err);
			}
			 else {
				resolve(airport);
			}
		});
	});
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
