const router = require('express').Router();
const mime = require('mime-types')

exports.router = router

const {
  generateAuthToken,
  requireAuthentication,
  optionalAuthentication
} = require("../lib/auth");
const { isValidSubmission } = require('../lib/validation');
const { getAssignmentById } = require('../models/assignments')
const { getCourseById } = require('../models/courses')
const {
  getSubmissionInfoById,
  getSubmissionDownloadStream,
  getSubmissionById,
  addGrade
} = require("../models/submissions");
const { getUserById } = require('../models/users');

router.get('/:id', async function(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.id)
    if(submission) {
      const resBody = {
        _id: submission._id,
        url: `/submissions/media/${submission.filename}`,
        userId: submission.metadata.userId,
        assignmentId: submission.metadata.assignmentId,
        mimetype: submission.metadata.mimetype,
        classId: submission.metadata.classId,
        timestamp: submission.metadata.timestamp,
        grade: submission.metadata.grade
      }
      res.status(200).send(resBody)
    } else {
      next()
    }
  } catch(err) {
    next(err)
  }
})

// must send userId in req body of get
router.get('/media/:filename', requireAuthentication, function(req, res, next) {

  // if the userId == ownerId from file metadata
  // if req.user.role == admin
  // if req.user.role == teacher && teacher is the instructor for the course
  // if statement needs work

  const file = getSubmissionDownloadStream(req.params.filename)

  if(
    req.params.studentId === req.user.userId ||
    req.user.role === "admin" ||
    ((req.user.role === "instructor") && O(bjectId(req.user).equals(course.instructorId)))
  ){
    file.on('file', function(file) {
        console.log(file.metadata.mimetype)
      res.status(200).type(file.metadata.mimetype)
    })
    .on('error', function(err) {
      if(err.code === 'ENOENT') {
        next()
      } else {
        next(err)
      }
    }).pipe(res)
  } else {
    res.status(403).send({
      err: "Unauthorized to access the specified resource",
    });
    next();
  }
})


router.patch('/:id',requireAuthentication, async (req,res,next)=>{
    const authUser = await getUserById(req.user)
    if(
        isValidSubmission(req.params.id) &&
        req.body &&
        req.body.grade
    ) {
        const submission = await getSubmissionById(req.params.id)
        const course = await getCourseById(submission.metadata.courseId.toString())
        if (authUser.role === "admin" || (authUser.role === "instructor" && req.user === course.instructorId.toString())) {
            const result = await addGrade(req.body.grade,req.params.id)
            res.status(200).json(`Grade updated for submission ${req.params.id}`)
        } else {
            next()
        }
    } else {
        next()
    }
})
