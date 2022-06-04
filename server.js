// Copy pasted from Hess example code

const express = require('express');
const morgan = require('morgan');

const api = require('./api');
const { connectToDb } = require('./lib/mongo')
const users = require('./data/users');
const { MongoUnexpectedServerResponseError } = require('mongodb');
const { insertNewUser, clearUsers } = require('./models/users');

const app = express();
const port = process.env.PORT || 8000;

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);
app.use('*', function (req, res, next) {
    res.status(404).json({
        error: "Requested resource " + req.originalUrl + " does not exist"
    });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
    err: "Server error.  Please try again later."
  })
})
connectToDb(async function () {
  app.listen(port, async function () {
    //populate with db example user data
    clearUsers().then(result =>{
      users.forEach(insertNewUser());
    });
    console.log("== Server is running on port", port);
  });
})