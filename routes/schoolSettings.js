const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const settingsControllers = require('../controllers/schoolSettings');

const { body } = require('express-validator');
const router = express.Router();

const Student = require('../models/student');
const Class = require('../models/class');
const Teacher = require('../models/teacher');
const Subject = require('../models/subject');
// _________________________________________Students Routes ____________________________
// GET @ /settings/students
router.get('/students', settingsControllers.getGetStudents);

// GET @ /settings/student:studentId
router.get('/student/:studentId', settingsControllers.getGetStudent);

// POST @ /settings/students
router.post(
	'/students',
	[
		body('firstName', 'FirstName must contain chars only').trim().isString(),
		body('lastName', 'LastName must contain chars only').trim().isString(),
		body('gender', 'Gender must be contain chars only'),
		body('age', 'Insert age!').trim().notEmpty(),
		body('email', 'Email must be a valid email').trim().isEmail().custom(async (value, { req }) => {
			// let student;

			try {
				const student = await Student.getStudentWithCondition({ email: value });
				if (student) {
					return Promise.reject('This email is taken by some student');
				}
				const teacher = await Teacher.getTeacherWithCondition({ email: value });
				if (teacher) {
					return Promise.reject('This Email is taken by some teacher');
				}
				return true;
			} catch (error) {
				error.statusCode = 500;
				throw error;
			}
		})
	],
	settingsControllers.postAddStudent
);

// PATCH @ /settings/student/edit
router.patch(
	'/student/edit',
	[
		body('firstName', 'FirstName must contain chars only').trim().isString(),
		body('lastName', 'LastName must contain chars only').trim().isString(),
		body('gender', 'Gender must be contain chars only'),
		body('email', 'Email must be a valid email').trim().isEmail()
	],
	settingsControllers.patchEditStudent
);

// DELETE @ /settings/student/delete/:studentId
router.delete('/student/delete/:studentId', settingsControllers.deleteDeleteStudent);

// __________________________________Classes Routes__________________________________

// GET @ /settings/classes
router.get('/classes', settingsControllers.getGetClasses);

// GET @ /settings/class/:classId
router.get('/class/:classId', settingsControllers.getGetSingleClass);
// POST @ /settings/classes
router.post(
	'/classes',
	[
		body('name', 'Class name must be consisting of one capital character and one number for better experience')
			.trim()
			.isUppercase()
			.isLength({ min: 2, max: 2 })
			.custom(async (value, { req }) => {
				try {
					const foundClass = await Class.getClassWithCondition({ name: value });
					if (foundClass) {
						return Promise.reject('This name is taken by some class, insert an alternative.');
					}
					return true;
				} catch (error) {
					error.statusCode = 500;
					throw error;
				}
			})
			.not()
			.isNumeric()
	],
	settingsControllers.postAddClass
);

// GET @ /settings/class/edit/className
router.patch(
	'/class/edit/className',
	[
		body('name', 'Class name must be consisting of one capital character and one number for better experience')
			.trim()
			.isUppercase()
			.isLength({ min: 2, max: 2 })
			.custom(async (value, { req }) => {
				try {
					const foundClass = await Class.getClassWithCondition({ name: value });
					if (foundClass) {
						return Promise.reject('This name is already taken, insert an alternative.');
					}
					return true;
				} catch (error) {
					error.statusCode = 500;
					throw error;
				}
			})
			.not()
			.isNumeric()
	],
	settingsControllers.patchEditClassName
);

// DELETE @ /settings/class/delete/:classId
router.delete('/class/delete/:classId', settingsControllers.deleteRemoveClass);

// PATCH @ /settings/class/addStudent
router.patch('/class/addStudent', settingsControllers.patchAddStudentToClass);

// PATCH @ /settings/class/removeStudent
router.patch('/class/removeStudent', settingsControllers.patchremoveStudentFromClass);

// ______________________________Search (APIS) Routes___________________________________

// GET @ /settings/classes/search/:text
router.get('/classes/search/:text', settingsControllers.getSearchForClasses);

// GET @ /settings/students/search/:text
router.get('/students/search/:text', settingsControllers.getSearchForStudents);

// GET @ /settings/students/search/inClass
router.get('/students/searchInClass', settingsControllers.getSearchForStudentsInClass);

// GET @ /settings/teachers/search/:text
router.get('/teachers/search/:text', settingsControllers.getSearchForTeachers);

// GET @ /settings/subjects/search/:text
router.get('/subjects/search/:text', settingsControllers.getSearchForSubjects);

// ____________________________________Subjects Routes____________________________

// POST @ /settings/subjects
router.post(
	'/subjects',
	[
		body('name', 'Subject name must not be empty and lowercase')
			.trim()
			.notEmpty()
			.isLowercase()
			.custom(async value => {
				try {
					const subject = await Subject.getSubjectWithCondition({ name: value });
					if (subject) {
						return Promise.reject('There exists a subject with this name.');
					}
					return true;
				} catch (error) {
					throw error;
				}
			})
	],
	settingsControllers.postAddSubject
);

// GET @ /settings/subject/:subjectId
router.get('/subject/:subjectId', settingsControllers.getSingleSubject);

// PATCH /settings/subjects/edit
router.patch(
	'/subjects/edit',
	[
		body('newName', 'new name must not be empty and lowercase')
			.trim()
			.notEmpty()
			.isLowercase()
			.custom(async value => {
				try {
					const subject = await Subject.getSubjectWithCondition({ name: value });
					if (subject) {
						return Promise.reject('There exists a subject with this name.');
					}
					return true;
				} catch (error) {
					throw error;
				}
			})
	],
	settingsControllers.patchEditSubjectName
);

// GET @ /settings/subjects
router.get('/subjects', settingsControllers.getGetSubjects);

// DELETE @ /settings/subjects/delete/:subjectId
router.delete('/subjects/delete/:subjectId', settingsControllers.deleteRemoveSubject);

// __________________________________Teachers Routes________________________________

// POST @ /settings/teachers
router.post(
	'/teachers',
	[
		body('firstName', 'FirstName must contain chars only').trim().isString().notEmpty(),
		body('lastName', 'LastName must contain chars only').trim().isString().notEmpty(),
		body('gender', 'Gender must be contain chars only').trim().isAlpha().notEmpty(),
		body('age', 'Insert age').trim().notEmpty(),
		body('salary', 'Insert salary').trim().notEmpty(),

		body('email').isEmail().withMessage('Email must be a valid email').custom(async (value, { req }) => {
			try {
				const foundTeacher = await Teacher.getTeacherWithCondition({ email: value });
				if (foundTeacher) {
					return Promise.reject('This email is taken by some teacher');
				}
				const foundStudent = await Student.getStudentWithCondition({ email: value });

				if (foundStudent) {
					return Promise.reject('This email is taken by some student');
				}

				return true;
			} catch (error) {
				if (!error.statusCode) error.statusCode = 500;
				throw error;
			}
		})
	],
	settingsControllers.postAddTeacher
);

// @PATCH /settings/teacher/edit
router.patch(
	'/teacher/edit',
	[
		body('firstName', 'FirstName must contain chars only').trim().isString().notEmpty(),
		body('lastName', 'LastName must contain chars only').trim().isString().notEmpty(),
		body('gender', 'Gender must be contain chars only').trim().isAlpha().notEmpty(),
		body('age', 'Insert age').trim().notEmpty(),
		body('salary', 'Insert salary').trim().notEmpty(),
		body('email').isEmail().withMessage('Email must be a valid email').custom(async value => {
			try {
				// check if this email is taken by some student(at least one)
				const foundStudent = await Student.getStudentWithCondition({ email: value });
				if (foundStudent) {
					return Promise.reject('This email is taken by some student');
				}

				// checking if the email is taken by some teacher will be in the controller as we need the teacherId

				return true;
			} catch (error) {
				if (!error.statusCode) error.statusCode = 500;
				throw error;
			}
		})
	],
	settingsControllers.patchEditTeacher
);

// GET @ /settings/teachers
router.get('/teachers', settingsControllers.getGetTeachers);

// GET @ /settings/teachers/:teacherId
router.get('/teachers/:teacherId', settingsControllers.getSingleTeacher);

// DELETE @ /settings/teacher/delete
router.delete('/teachers/delete/:teacherId', settingsControllers.deleteDeleteTeacher);

module.exports = router;
