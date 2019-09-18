import { Router } from 'express';
import airports from './airports';
import flights from './flights';

const router = Router();

router.get('/', (req, res) => {
    res.json({
        message: 'API - Hello World!'
    });
});

router.use('/airports', airports);
router.use('/flights', flights);

module.exports = router;