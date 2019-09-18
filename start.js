require('dotenv').config();

require("@babel/register") ({
    presets:["@babel/preset-env"]
});

module.exportsa = require('./index.js');