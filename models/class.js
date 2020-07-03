const db = require('../helpers/db').getDb;

const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

const collectionName = 'classes';
class Class {
	constructor(name, students, schedule) {
		this.name = name;
		this.students = students;
	}

	addClass = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getClasses = () => {
		return db().collection(collectionName).find().project({ name: 1 }).toArray();
	};

	static getClass = classId => {
		return db().collection(collectionName).findOne({ _id: new ObjectId(classId) });
	};

	static getClassAggregated = classId => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: { _id: new ObjectId(classId) } },
				{ $lookup: { from: 'students', localField: 'students', foreignField: '_id', as: 'realStudents' } },
				{ $project: { students: 0 } }
			])
			.next();
	};

	static getClassWithCondition = condition => {
		return db().collection(collectionName).findOne(condition);
	};

	static searchForClass = searchText => {
		// to search efficintly, we have to add a searching index db.collection.createIndex({property: 'text'})... then we search using this text index and then for better output we need to add a score meta property and sort by it like that
		return db()
			.collection(collectionName)
			.find({ $text: { $search: searchText } })
			.project({ score: { $meta: 'textScore' } })
			.sort({ score: { $meta: 'textScore' } })
			.toArray();
	};

	static removeClass = classId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(classId) });
	};

	static editClassName = (classId, newName) => {
		return db().collection(collectionName).updateOne({ _id: new ObjectId(classId) }, { $set: { name: newName } });
	};

	static editClassWithCondition = (filterObj, updatingObj) => {
		return db().collection(collectionName).updateOne(filterObj, updatingObj);
	};

	static getAllSchedules = () => {
		return db().collection(collectionName).find().project({ _id: 0, schedule: 1 }).toArray();
	};
}

module.exports = Class;
