require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cookieParser());

app.use((req, res, next) => {
   res.cookie('lottery_contract_address', process.env.LOTTERY_CONTRACT_ADDRESS);
   return next();
});

app.use(express.static('public'));

const server = app.listen(8081, function () {

    const host = server.address().address
    const port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)

})
