const router = require('express').Router();

const {validateAgainstSchema,isValidAssignment,isValidUser} = require('../lib/validation');

const { ObjectId } = require('mongodb');

const {requireAuthentication} = require('../lib/auth')
const {upload,saveFile, removeFile} = require('../models/submissions');
const {SubmissionSchema} = require('../models/submissions')
const {getCourseById} = require('../models/courses')
const {getDbInstance} = require('../lib/mongo');
const { path } = require('express/lib/application');

exports.router = router;

router.post('/:id/submissions',requireAuthentication, upload.single('file'), async(req,res,next)=>{
    if (
        req.file &&
        req.body &&
        validateAgainstSchema(req,body,SubmissionSchema) &&
        ObjectId(req.params.id).isEqual(req.body.assignmentId) &&
        isValidAssignment(req.params.id) &&
        isValidUser(req.body.studentId)
    ) {
        const db = getDbInstance()
        const assignment = db.collection("assignments").find({ // To be replaced with getAssgnmentById
            _id: ObjectId(req.body.assignmentId)
        }).toArray()[0]
        const course = getCourseById(assignment.courseId)

        if (
        ObjectId(req.params.studentId).isEqual(req.user.userId) ||
        req.user.role === "admin" ||
        ((req.user.role === "instructor") && (ObjectId(req.user).isEqual(course.instructorId)))
        ) {
            const result = await saveFile({
                id: req.body.instructorId,
                assignment: req.body.assignmentId,
                course: course._id.toString(),
                extension: req.file,
                timestamp: Date.now(),
                filename: req.file.filename,
                extension: req.file.filename.split(".")[0],
                path: `${__dirname}/${this.filename}.${this.extension}`
            })
            removeFile(req.file.path)
            res.send(201).send({
                id: result
            })
    } else {
            removeFile(req.file.path)
            next()
        }

    } else {
        removeFile(req.file.path)
        next()
    }
})