const db = require('../helpers/db').getDb;
const mongodb = require('mongodb');

const ObjectId = mongodb.ObjectId;

const collectionName = 'teachers';

class Teacher {
	constructor(firstName, lastName, email, age, gender, salary, subjectId, joinedAt) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.age = age;
		this.gender = gender;
		this.salary = salary;
		this.subjectId = subjectId;
		this.joinedAt = joinedAt;
	}

	addTeacher = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getTeacher = teacherId => {
		return db().collection(collectionName).findOne({ _id: new ObjectId(teacherId) });
	};
	static getTeacherWithCondition = condition => {
		return db().collection(collectionName).findOne(condition);
	};

	// add aggregation later
	static getTeachers = () => {
		return db().collection(collectionName).find().toArray();
	};

	static getTeachersWithCondition = condition => {
		return db().collection(collectionName).find(condition).toArray();
	};

	static updateTeacherWithConfigs = (filterObj, updateObj) => {
		return db().collection(collectionName).updateOne(filterObj, updateObj);
	};

	static updateTeachersWithConfigs = (filterObj, updateObj) => {
		return db().collection(collectionName).updateMany(filterObj, updateObj);
	};

	static deleteTeacher = teacherId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(teacherId) });
	};

	static getTeacherAggregated = teacherId => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: { _id: new ObjectId(teacherId) } },
				{ $lookup: { from: 'subjects', localField: 'subjectId', foreignField: '_id', as: 'subject' } }
			])
			.next();
	};

	static searchForTeacher = searchText => {
		return db()
			.collection(collectionName)
			.find({ $text: { $search: searchText } })
			.project({ score: { $meta: 'textScore' } })
			.sort({ score: { $meta: 'textScore' } })
			.toArray();
	};
}

module.exports = Teacher;
