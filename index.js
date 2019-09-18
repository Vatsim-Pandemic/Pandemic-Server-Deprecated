import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import 'babel-polyfill';

import api from './api';
import { notFound, errorHandler } from './middlewares'

const app = express();
const port = 5000;

app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

const corsOptions = {
    origin: function (origin, callback) {
        if(!origin || origin.indexOf("localhost") > -1 || origin.indexOf("vatsim-pandemic.github.io") > -1) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

app.get('/', (req,res) => {
    res.json({
        message: "Hello World!"
    });
});

app.use('/api/', api);
app.use(notFound);
app.use(errorHandler)

app.listen(port, () => console.log(`PIEBot app listening on port ${port}!`));