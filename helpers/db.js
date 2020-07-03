const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;
console.log('process.env', process.env.MONGO_USER, process.env.MONGO_PASSWORD, process.env.DB_NAME);
// connecting url
const mongoUrl = `mongodb+srv://${process.env.MONGO_USER}:${process.env
	.MONGO_PASSWORD}@cluster0-lmxny.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
console.log('mongoUrl', mongoUrl);

exports.initDb = async cb => {
	if (_db) return cb(null, _db);

	try {
		const client = await MongoClient.connect(
			'mongodb+srv://appDev:159787845as@cluster0-lmxny.mongodb.net/shcool?retryWrites=true&w=majority',
			{ useUnifiedTopology: true }
		);
		_db = client.db();
		cb(null, client);
	} catch (error) {
		cb(error, null);
	}
};

exports.getDb = () => {
	if (!_db) throw 'Not Connected...';

	return _db;
};
