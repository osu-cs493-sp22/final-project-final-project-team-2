const router = require('express').Router();

const {validateAgainstSchema, extractValidFields} = require('../lib/validation');

const { ObjectId } = require('mongodb');
const { requireAuthentication } = require('../lib/auth');
const { insertNewCourse } = require('../models/courses');
const { CourseSchema } = requre("../models/courses");

exports.router = router;

router.post("/", requireAuthentication, async function (req, res) {
    //only admins can use this function
    if (req.user.role != "admin"){
        res.status(403).send({
            err: "You do not have the permissions to add a new course"
        })
        return
    }
    if (validateAgainstSchema(req.body, CourseSchema)) {
        const course = extractValidFields(req.body,CourseSchema)
        insertNewCourse(course);
    }
});