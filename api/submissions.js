const router = require('express').Router();
const mime = require('mime-types')

exports.router = router

const {
  generateAuthToken,
  requireAuthentication,
  optionalAuthentication
} = require("../lib/auth")

const {
  getSubmissionInfoById,
  getSubmissionDownloadStream,
  getSubmissionById
} = require("../models/submissions")

router.get('/:id', async function(req, res, next) {
  try {
    const submission = await getSubmissionById(req.params.id)
    if(submission) {
      const resBody = {
        _id: submission._id,
        url: `/media/${submission.filename}`,
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

  if(req.user == file.metadata.userId || req.user.role == 'admin' || (req.user.role == 'teacher' && 1)) {
    file.on('file', function(file) {
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
