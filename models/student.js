const db = require('../helpers/db').getDb;
const mongodb = require('mongodb');

const ObjectId = mongodb.ObjectId;
const collectionName = 'students';
class Student {
	constructor(firstName, lastName, age, gender, email, classId, joinedAt) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.age = age;
		this.gender = gender;
		this.email = email;
		this.classId = classId;
		this.joinedAt = joinedAt;
	}

	addStudent = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getStudents = () => {
		return db().collection(collectionName).find().toArray();
	};

	// search for student can be tricky because we have firstName and lastName and we know that text index can be added to only one element, hence we have an option, we can give the text index to first name and this query will return students whose first name match the given text another option is to make a combined search index for firstName and lastName and that what i used
	static searchForStudents = searchText => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: { $text: { $search: searchText } } },
				{ $sort: { score: { $meta: 'textScore' } } },
				{ $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
				{ $project: { 'class.students': 0 } }
			])
			.toArray();
	};

	// search for students as the above query but in certain class
	static searchForStudentsInClass = (searchText, classId) => {
		return db()
			.collection(collectionName)
			.find({ $and: [ { $text: { $search: searchText } }, { classId: new ObjectId(classId) } ] })
			.project({ score: { $meta: 'textScore' } })
			.sort({ score: { $meta: 'textScore' } })
			.toArray();
	};

	static getStudentsWithCondition = condition => {
		return db().collection(collectionName).find(condition).toArray();
	};

	static getStudent = studentId => {
		return db().collection(collectionName).findOne({ _id: new ObjectId(studentId) });
	};

	static getStudentAggregated = studentId => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: { _id: new ObjectId(studentId) } },
				{ $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
				{ $project: { 'realClass.students': 0, 'realClass._id': 0, 'realClass.schedule': 0 } }
			])
			.next();
	};

	static getStudentsAggregated = () => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: {} },
				{ $lookup: { from: 'classes', localField: 'classId', foreignField: '_id', as: 'class' } },
				{ $project: { classId: 0, 'class.students': 0, 'class.schedule': 0 } }
			])
			.toArray();
	};
	static getStudentWithCondition = condition => {
		return db().collection(collectionName).findOne(condition);
	};

	static updateStudent = (studentId, updatedStudent) => {
		return db().collection(collectionName).updateOne({ _id: new ObjectId(studentId) }, { $set: updatedStudent });
	};

	static updateStudentWithConfigs = (studentId, configuration) => {
		return db().collection(collectionName).updateOne({ _id: new ObjectId(studentId) }, configuration);
	};

	static updateStudentsWithConfigs = (filteringObj, updatingObj) => {
		return db().collection(collectionName).updateMany(filteringObj, updatingObj);
	};
	static deleteStudent = studentId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(studentId) });
	};
}

module.exports = Student;
