const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const { ObjectId, countDocuments } = require('mongodb')

const SubmissionSchema = {
  assignmentId : { required: true },
  studentId : { required: true },
  timestamp : { required: true },
  grade : { required: false },
  file : { required : true }
}
exports.SubmissionSchema = SubmissionSchema

exports.insertNewSubmission = async function insertNewSubmission(submission) {
  const db = getDbInstance()
  const collection = db.collection('submissions')

  submission = extractValidFields(submission, SubmissionSchema)
  submission.assignmentId = new ObjectId(submission.assignmentId)
  submission.studentId = new ObjectId(submission.studentId)
  const result = await collection.insertOne(submission)

  return result.insertedId
}

exports.getSubmissionById = async function getSubmissionById(id) {
  const db = getDbInstance()
  const collection = db.collection('submissions')

  const submission = await collection.aggregate([
    { $match : { _id: new ObjectId(id) } }
  ]).toArray()
  return submission[0]
}

exports.getAllSubmissions = async function getAllSubmissions(page) {
  const db = getDbInstance()
  const collection = db.collection('submissions')

  const count = await collection.countDocuments()
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize)
  page = page < 1 ? 1 : page
  const offset =  (page - 1) * pageSize

  const submissions = await collection.find({}).sort({_id:1}).skip(offset).limit(pageSize).toArray()

  return {
    submissions: submissions,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count 
  }
}
