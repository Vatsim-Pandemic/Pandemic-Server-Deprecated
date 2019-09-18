import { Router } from 'express';
import Joi from 'joi';
import { Status } from '../util';

const db = require('../db');
const flights = db.get('flights');

const router = Router();

const newFlightSchema = Joi.object().keys({
    discordID: Joi.string().regex(/^\d+$/).required(),
    discordDisplayName: Joi.string().required(),
    flightNum: Joi.string().alphanum().min(1).max(15).required(),
    departure: Joi.string().alphanum().min(1).max(4).required(),
    arrival: Joi.string().alphanum().min(1).max(4).required()
});

const flightUpdateSchema = Joi.object().keys({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    status: Joi.string().required()
});

router.get('/', (req, res) => {
    res.json({
        message: "Piebot Hello"
    });
});

router.get('/allFlights', (req, res) => {
    flights
      .find()
      .then(allFlights => {
        res.json(allFlights);
      })
});

router.post('/addFlight', (req, res, next) => {
    console.log(req.body);
    let result = Joi.validate(req.body, newFlightSchema);

    if (result.error === null) {
        let { discordID, discordDisplayName, flightNum, departure, arrival } = req.body;

        let message = {
            discordID,
            discordDisplayName,
            flightNum,
            departure,
            arrival,
            status: Status.OFFLINE
        };

        flights.insert(message).then(insertedMessage => {
            res.json(insertedMessage);
        });
    } else {
        next(result.error);
    }
});

module.exports = router;