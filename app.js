// express and the app
const express = require('express');
const app = express();
// third-party-packages
const bodyParser = require('body-parser');
const helmet = require('helmet');
// my functions
const initDb = require('./helpers/db').initDb;

// enabling CORS
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
	next();
});

app.use(helmet());
// parsing the body properties to accept application/json
app.use(bodyParser.json());

// error handler middleware
app.use((error, req, res, next) => {
	// when throwing error, the throwed message will be in error.message, and i will add another statusCode property, get them, send back the response
	const errorMessage = error.message;
	const errorStatusCode = error.statusCode;
	res.status(errorStatusCode).json({ error: errorMessage });
});

// initializing the database using native mongoDB driver
initDb((error, client) => {
	if (error) {
		console.log('Failed To Connect...');
	} else {
		console.log('Connected...');
		app.listen(2000);
	}
});
