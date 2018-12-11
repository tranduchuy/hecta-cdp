const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('config');
const logger = require('morgan');


// config log4js
const log4js = require('log4js');
log4js.configure('./config/log4js.json');

const app = express();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

const port = config.get('app').port || 3000;
app.set('port', port);

require('./config/db')(() => {
    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`CDP is running on port ${port}`);
    });
});