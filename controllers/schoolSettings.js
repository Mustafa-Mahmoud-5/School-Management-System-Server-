const Student = require('../models/student');
const Class = require('../models/class');
const Subject = require('../models/subject');
const Teachewr = require('../models/teacher');
const { validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const Teacher = require('../models/teacher');

// ___________________________________Students controllers________________________________

exports.getGetStudents = async (req, res, next) => {
	try {
		const students = await Student.getStudentsAggregated();
		res.status(200).json({ students: students });
	} catch (error) {
		error.statusCode = 500;
		next(error);
	}
};

exports.getGetStudent = async (req, res, next) => {
	const studentId = req.params.studentId;
	console.log('reached studentId>>>>', studentId);
	try {
		const student = await Student.getStudentAggregated(studentId);
		if (!student) {
			const error = new Error('Student with that id does not exist..');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ student: student });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.postAddStudent = async (req, res, next) => {
	const { firstName, lastName, age, gender, email } = req.body;

	const date = new Date();
	try {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;

			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		const student = new Student(firstName, lastName, +age, gender, email, null, date);

		const addingResult = await student.addStudent();
		const [ insertedStudent ] = addingResult.ops;
		console.log('exports.postAddStudent -> addingResult', addingResult);

		res.status(201).json({ message: 'Student added successfully', studentId: insertedStudent._id.toString() });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.patchEditStudent = async (req, res, next) => {
	const { firstName, lastName, age, gender, email, studentId } = req.body;

	const updatedStudent = { firstName: firstName, lastName: lastName, age: +age, gender: gender, email: email };
	try {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		const student = await Student.getStudent(studentId);

		if (!student) {
			const error = new Error('Student with that id does not exist');
			error.statusCode = 404;
			throw error;
		}

		// find all other students that has the given email(the sender is not included)
		const foundStudents = await Student.getStudentsWithCondition({
			$and: [ { email: email }, { _id: { $not: { $eq: new ObjectId(studentId) } } } ]
		});
		// it will return array, so check if it has some values
		if (foundStudents.length > 0) {
			const error = new Error('This Email is taken, please choose another one');
			error.statusCode = 422;
			throw error;
		}

		const updatingResult = await Student.updateStudent(studentId, updatedStudent);

		res.status(200).json({ message: 'Student Updated successfully', updateStudentId: studentId.toString() });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteDeleteStudent = async (req, res, next) => {
	const studentId = req.params.studentId;

	try {
		// check if the stdudent exist
		const student = await Student.getStudent(studentId);
		if (!student) {
			const error = new Error('Student with a given id does not exist');
			error.statusCode = 404;
			throw error;
		}

		// when we delete a student, we need to check if this student was in a class, if true, we will take the classId, the studentId, go to remove the studentId from the class.students array

		const studentClassId = student.classId;
		// the student has a classId (not null)

		console.log('exports.deleteDeleteStudent1 -> studentClassId', studentClassId);
		if (studentClassId) {
			console.log('exports.deleteDeleteStudent2 -> studentClassId', studentClassId);
			await Class.editClassWithCondition(
				{ _id: new ObjectId(studentClassId) },
				{ $pull: { students: new ObjectId(studentId) } }
			);
		}

		const deletingResult = await Student.deleteStudent(studentId);

		res.status(200).json({ message: 'Student removed successfully', studentId: studentId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// ______________________________ Classes Controllers________________________________

exports.getGetClasses = async (req, res, next) => {
	try {
		const classes = await Class.getClasses();
		res.status(200).json({ classes: classes });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.postAddClass = async (req, res, next) => {
	const className = req.body.name;
	console.log('exports.postAddClass -> className', className);

	const newClass = new Class(className, []);

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}
		const addingResult = await newClass.addClass();

		res.status(201).json({ message: 'Class added successfully', classId: addingResult.insertedId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.patchEditClassName = async (req, res, next) => {
	const { name, classId } = req.body;

	try {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		const foundClass = await Class.getClass(classId);

		if (!foundClass) {
			const error = new Error('The class with this given id does not exist');
			error.statusCode = 404;
			throw error;
		}

		const editingResult = await Class.editClassName(classId, name);

		res.status(200).json({ message: 'Class Name updated successfully', newName: name });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 422;
		next(error);
	}
};

exports.getGetSingleClass = async (req, res, next) => {
	const classId = req.params.classId;

	try {
		const foundClass = await Class.getClassAggregated(classId);

		if (!foundClass) {
			const error = new Error('Class with given id does not exist.');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ class: foundClass });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteRemoveClass = async (req, res, next) => {
	const classId = req.params.classId;

	try {
		const foundClass = await Class.getClass(classId);

		if (!foundClass) {
			const error = new Error('No class with given id was found.');
			error.statusCode = 404;
			throw error;
		}

		// if the class was found, before deleting the class, get all the studentsIds in that class, then go and set their classId to null

		if (foundClass) {
			// make an array of all the studentids that were in this class and make sure it objectId data type
			const studentIds = foundClass.students.map(stId => new ObjectId(stId));

			await Student.updateStudentsWithConfigs({ _id: { $in: studentIds } }, { $set: { classId: null } });
		}

		const removingResult = await Class.removeClass(classId);

		res.status(200).json({ message: 'Class removed successfully', RemovedclassId: classId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}

	// Later, after removing the class i will go and check for all the students in this class and i will go to remove the classId from each class object.
};

exports.patchAddStudentToClass = async (req, res, next) => {
	console.log('exports.postAddStudentToClass -> rached');
	const { classId, studentId } = req.body;

	try {
		// check first if the class and student exist because i need to build a robust app that prevents any bugs

		const foundClass = await Class.getClass(classId);

		if (!foundClass) {
			const error = new Error('No class with given id exists');
			error.statusCode = 404;
			throw error;
		}

		const student = await Student.getStudent(studentId);

		if (!student) {
			const error = new Error('No Student with given id exists');
			error.statusCode = 404;
			throw error;
		}
		// if you are trying to add a student who is already in a class
		if (student) {
			if (student.classId !== null) {
				const error = new Error('You are trying to add a student who is really exist');
				error.statusCode = 403;
				throw error;
			}
		}

		// add the student to the class students array
		const updatingClassResult = await Class.editClassWithCondition(
			{ _id: new ObjectId(classId) },
			{ $addToSet: { students: new ObjectId(studentId) } }
		);

		// add the classId to the student
		const updatingStudentResult = await Student.updateStudentWithConfigs(studentId, {
			$set: { classId: new ObjectId(classId) }
		});

		res.status(200).json({
			message: 'Student added successfully',
			classId: classId,
			studentId: studentId
		});
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.patchremoveStudentFromClass = async (req, res, next) => {
	const { classId, studentId } = req.body;

	try {
		// check first if the class and student exist because i need to build a robust app that prevents any bugs

		const foundClass = await Class.getClass(classId);

		if (!foundClass) {
			const error = new Error('No class with given id exists');
			error.statusCode = 404;
			throw error;
		}

		// check if this class has students
		if (foundClass) {
			if (foundClass.students.length < 1) {
				const error = new Error('You are trying to remove a student from a class that has no students!!');
				error.statusCode = 500;
				throw error;
			}
		}

		const student = await Student.getStudent(studentId);

		if (!student) {
			const error = new Error('No Student with given id exists');
			error.statusCode = 404;
			throw error;
		}

		// no errors, good

		// remove the student from the class students array
		const removingResult = await Class.editClassWithCondition(
			{ _id: new ObjectId(classId) },
			{ $pull: { students: new ObjectId(studentId) } }
		);

		// set the classId in that student to null
		const removingClassIdResult = await Student.updateStudentWithConfigs(studentId, { $set: { classId: null } });

		res.status(200).json({ message: 'Student removed successfully', classId: classId, studentId: studentId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// ___________________________________Search Controllers______________________________

exports.getSearchForClasses = async (req, res, next) => {
	const searchText = req.params.text;

	try {
		const foundClasses = await Class.searchForClass(searchText);
		res.status(200).json({ classes: foundClasses });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSearchForStudents = async (req, res, next) => {
	const searchText = req.params.text;
	console.log('exports.getSearchForStudents -> searchText', searchText);

	try {
		const foundStudents = await Student.searchForStudents(searchText);
		res.status(200).json({ students: foundStudents });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSearchForStudentsInClass = async (req, res, next) => {
	const { searchText, classId } = req.query;
	console.log('exports.getSearchForStudentsInClass -> searchText', searchText);
	console.log('exports.getSearchForStudentsInClass -> classId', classId);

	try {
		// check if the class exist(not fake)
		const foundClass = await Class.getClass(classId);
		console.log('exports.getSearchForStudentsInClass -> foundClass', foundClass);
		if (!foundClass) {
			const error = new Error('This class does not exist');
			error.statusCode = 404;
			throw error;
		}

		const foundStudents = await Student.searchForStudentsInClass(searchText, classId);
		res.status(200).json({ students: foundStudents });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSearchForTeachers = async (req, res, next) => {
	const searchText = req.params.text;
	console.log('exports.getSearchForTeachers -> searchText', searchText);
	try {
		const teachers = await Teacher.searchForTeacher(searchText);
		res.status(200).json({ teachers: teachers });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSearchForSubjects = async (req, res, next) => {
	const searchText = req.params.text;
	try {
		const subjects = await Subject.GetSearchForSubjects(searchText);
		res.status(200).json({ subjects: subjects });
	} catch (error) {
		error.statusCode = 500;
		next(error);
	}
};
// _____________________________________Subjects Controllers________________________________

exports.postAddSubject = async (req, res, next) => {
	const { name } = req.body;
	console.log('exports.postAddSubject -> name', name);

	const subject = new Subject(name.toLowerCase(), []);

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		// check if a subject with the same name exist
		const foundSubject = await Subject.getSubjectWithCondition({ name: name });

		if (foundSubject) {
			const error = new Error('This subject already exists, choose a differet subject name');
			error.statusCode = 403; // forbidden
			throw error;
		}
		const { insertedId } = await subject.addSubject(subject);
		res.status(201).json({ message: 'Subject added successfully', subjectId: insertedId.toString() });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getGetSubjects = async (req, res, next) => {
	try {
		const subjects = await Subject.getSubjects();
		res.status(200).json({ subjects: subjects });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteRemoveSubject = async (req, res, next) => {
	const { subjectId } = req.params;

	try {
		const foundSubject = await Subject.getSubject(subjectId);

		if (!foundSubject) {
			const error = new Error('Subject with given id is not found');
			error.statusCode = 404;
			throw error;
		}
		// before removing the subject, we need to get the subject teachers ids and remove the subject id from them

		if (foundSubject.teachers.length > 0) {
			console.log('we didn`t enter this part');
			const teachersIds = foundSubject.teachers.map(teacherId => new ObjectId(teacherId));

			await Teacher.updateTeachersWithConfigs({ _id: { $in: teachersIds } }, { $set: { subjectId: null } });
		}
		await Subject.removeSubject(subjectId);

		res.status(200).json({ message: 'subject removed successfully', subjectId: subjectId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSingleSubject = async (req, res, next) => {
	const { subjectId } = req.params;
	console.log('exports.getSingleSubject -> subjectId', subjectId);

	try {
		const subject = await Subject.getSingleSubjectAggregated(subjectId);
		console.log('exports.getSingleSubject -> subject', subject);

		if (!subject) {
			const error = new Error('Subject with given id does not exist');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ message: 'Subject found scuccessfully', subject: subject });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.patchEditSubjectName = async (req, res, next) => {
	const { subjectId, newName } = req.body;

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 403;
			throw error;
		}
		const foundSubject = await Subject.getSubject(subjectId);

		if (!foundSubject) {
			const error = new Error('Subject with given id not found');
			error.statusCode = 404;
			throw error;
		}

		await Subject.updateSubjectWithConfigs({ _id: new ObjectId(subjectId) }, { $set: { name: newName } });

		res.status(200).json({ message: 'Subject updated successfully', subjectId: subjectId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// _____________________________________ Teachers Controllers_________________________

exports.postAddTeacher = async (req, res, next) => {
	const { firstName, lastName, age, email, salary, gender, subjectId } = req.body;

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		// check if the subject exists
		const foundSubject = await Subject.getSubject(subjectId);

		if (!foundSubject) {
			const error = new Error('no subject with that id exist');
			error.statusCode = 404;
			throw error;
		}

		const teacher = new Teacher(
			firstName,
			lastName,
			email,
			+age,
			gender,
			+salary,
			new ObjectId(subjectId),
			new Date()
		);

		const { insertedId } = await teacher.addTeacher();

		// add the teacher id to the teachers array in that subject
		await Subject.updateSubjectWithConfigs(
			{ _id: new ObjectId(subjectId) },
			{ $addToSet: { teachers: insertedId } }
		);

		res.status(201).json({ message: 'Teacher added successfully', teacherId: insertedId.toString() });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.patchEditTeacher = async (req, res, next) => {
	const { firstName, lastName, email, age, gender, salary, teacherId, subjectId } = req.body;

	const updatedTeacher = {
		firstName: firstName,
		lastName: lastName,
		email: email,
		age: +age,
		gender: gender,
		salary: +salary,
		subjectId: new ObjectId(subjectId)
	};

	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const errorMessage = errors.array()[0].msg;
			const error = new Error(errorMessage);
			error.statusCode = 422;
			throw error;
		}

		// check if the teacher exist
		const foundTeacher = await Teacher.getTeacher(teacherId);
		if (!foundTeacher) {
			const error = new Error('No teacher with that id was found');
			error.statusCode = 500;
			throw error;
		}

		// check if this email is taken by some teacher(at least one)
		const foundTeacherForEmailChecking = await Teacher.getTeacherWithCondition({
			$and: [ { email: email }, { _id: { $not: { $eq: new ObjectId(teacherId) } } } ]
		});

		if (foundTeacherForEmailChecking) {
			const error = new Error('This email is taken by some teacher');
			error.statusCode = 403;
			throw error;
		}

		// check for new subject on editing
		const oldSubjectId = foundTeacher.subjectId;
		if (oldSubjectId) {
			if (oldSubjectId.toString() !== subjectId.toString() && oldSubjectId !== null) {
				// new subjectId was assigned, remove this teacher from the subject teachers arr, add this teacher to the new subject teachers arr
				await Subject.updateSubjectWithConfigs(
					{ _id: new ObjectId(oldSubjectId) },
					{ $pull: { teachers: new ObjectId(teacherId) } }
				);
				await Subject.updateSubjectWithConfigs(
					{ _id: new ObjectId(subjectId) },
					{ $addToSet: { teachers: new ObjectId(teacherId) } }
				);
			}
		}

		// this teacher has no id (this happened because the admin removed a subject he included in), go and add the teacherId to the given subjectId teachers array

		console.log('exports.patchEditTeacher -> foundTeacher', foundTeacher);
		if (foundTeacher.subjectId === null) {
			await Subject.updateSubjectWithConfigs(
				{ _id: new ObjectId(subjectId) },
				{ $addToSet: { teachers: new ObjectId(teacherId) } }
			);
		}
		await Teacher.updateTeacherWithConfigs({ _id: ObjectId(teacherId) }, { $set: updatedTeacher });

		res.status(200).json({ message: 'Teacher updated successfully' });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getGetTeachers = async (req, res, next) => {
	try {
		const teachers = await Teacher.getTeachers();
		res.status(200).json({ teachers: teachers });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getSingleTeacher = async (req, res, next) => {
	const { teacherId } = req.params;

	try {
		const foundTeacher = await Teacher.getTeacherAggregated(teacherId);

		if (!foundTeacher) {
			const error = new Error('Teacher with given id is not found');
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ message: 'teacher found successfully', teacher: foundTeacher });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteDeleteTeacher = async (req, res, next) => {
	const { teacherId } = req.params;

	try {
		const foundTeacher = await Teacher.getTeacher(teacherId);

		if (!foundTeacher) {
			const error = new Error('Teacher with given id is not found');
			error.statusCode = 404;
			throw error;
		}

		// before deleting the teacher we want to check if he had subject(95% this will be true)
		if (foundTeacher.subjectId !== null) {
			const subjectId = foundTeacher.subjectId;

			await Subject.updateSubjectWithConfigs(
				{ _id: new ObjectId(subjectId) },
				{ $pull: { teachers: new ObjectId(teacherId) } }
			);
		}

		await Teacher.deleteTeacher(teacherId);
		res.status(200).json({ message: 'Teacher deleted successfully', teacherId: teacherId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};
