import { Router } from 'express';
import Joi from 'joi';
import * as fshost from '../FSHost'

const db = require('../db');
const airports = db.get('airports');
const lines = db.get('lines');

const router = Router();

const airportUpdate = Joi.object().keys({
    icao: Joi.string().required().min(1).max(4).alphanum(),
    infectionLevel: Joi.number().required().min(-1).max(4).integer(),
});

const addAirport = Joi.object().keys({
    icao: Joi.string().required().min(1).max(4).alphanum()
});

const massAddAirport = Joi.object().keys({
    icaos: Joi.array().required().items(Joi.string().required().min(1).max(4).alphanum())
});

const massAddLines = Joi.object().keys({
    lines: Joi.array().required().items(Joi.object().keys({
        from: Joi.string().required().min(1).max(4).alphanum(),
        to: Joi.string().required().min(1).max(4).alphanum()
    })),
});

router.get('/', (req, res) => {
    res.json({
        message: "Piebot Hello"
    });
});

router.get('/allAirports', (req, res) => {
    airports
        .find()
        .then(allAirports => {
            res.json(allAirports);
        });
});

router.post('/updateAirport', (req, res, next) => {
    let result = Joi.validate(req.body, airportUpdate);

    if(result.error) {
        return next(result.error);
    }

    let { icao, infectionLevel } = req.body;

    airports.update({ icao: icao }, {
        $set: {
            infectionLevel: infectionLevel,
        }
    }).then(insertedMessage => {
        res.json(insertedMessage);
    });

});

router.post('/addAirport', (req, res, next) => {
    let result = Joi.validate(req.body, addAirport);

    if(result.error) {
        return next(result.error);
    }

    let { icao } = req.body;

    fshost.getAirport(icao)
        .then((airport) => {
            console.log(JSON.stringify(airport));
            airports.insert({
                icao: icao,
                latitude: airport.data.geo.lat,
                longitude: airport.data.geo.lng,
                infectionLevel: 0,
            }).then(insertedMessage => {
                res.json(insertedMessage);
            });
        }).catch(error => {
            next(error);
        });
})

router.post('/massAddAirports', (req, res, next) => {
    let result = Joi.validate(req.body, massAddAirport);

    if(result.error) {
        return next(result.error);
    }

    let { icaos } = req.body;

    let data = [];

    icaos.map(icao => {
        fshost.getAirport(icao)
            .then((airport) => {
                data.push({
                    icao: icao,
                    latitude: airport.data.geo.lat,
                    longitude: airport.data.geo.lng,
                    infectionLevel: 0,
                });

                if(icaos.length == data.length) {
                    airports.insert(data).then(insertedMessage => {
                        res.json(insertedMessage);
                    });
                }
            }).catch(error => {
                next(error);
            });
    });
});

router.post('/massAddLines', (req, res, next) => {
    let result = Joi.validate(req.body, massAddLines);

    if(result.error) {
        return next(result.error);
    }

    lines.insert(req.body.lines).then(insertedMessage => {
        res.json(insertedMessage);
    });
});

router.get('/getLines', (req, res) => {
    lines
        .find()
        .then(lineList => {
            let messageBack = [];

            lineList.map(async (line) => {
                let fromAirport = await fshost.getAirport(line.from);
                let toAirport = await fshost.getAirport(line.to);

                messageBack.push({
                    from: fromAirport.data.geo,
                    to: toAirport.data.geo
                });

                if(messageBack.length == lineList.length) {
                    res.json(messageBack);
                }
            });
        });
});

module.exports = router;