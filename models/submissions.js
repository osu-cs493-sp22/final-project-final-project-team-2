const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const Grid = require('gridfs')
const fs = require('fs')
const crypto = require('crypto')
const multer = require('multer')
const mime = require('mime-types')

const { ObjectId, countDocuments, GridFSBucket } = require('mongodb')

const SubmissionSchema = {
  assignmentId : { required: true },
  studentId : { required: true },
  timestamp : { required: true },
  file : { required : true }
}
exports.SubmissionSchema = SubmissionSchema

exports.removeFile = (target_path)=>{

}

exports.upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req,file,callback) => {
            const ext = mime.lookup(file.mimetype)
            const filename = crypto.pseudoRandomBytes(16).toString('hex')
            callback(null,`${filename}.${ext}`)
        }
    })
})

exports.saveFile = async (payload) => {
    return new Promise((resolve, reject) => {
        const db = getDbInstance()
        const bucket = new GridFSBucket(db, { bucketName: 'submissions'})
        const metadata = {
            userId: ObjectId(payload.id),
            assignmentId: ObjectId(payload.assignment),
            courseId: ObjectId(payload.course),
            mimetype: payload.extension,
            timestamp: payload.timestamp,
            grade: undefined
        }
        const uploadStream = bucket.openUploadStream(payload.filename, {
            metadata: metadata
        })
        fs.createReadStream(payload.path).pipe(uploadStream)
            .on('error',(err)=> {
                reject(err)
            })
            .on('finish',(result)=>{
                console.log("== save result:", result)
                resolve(result._id)
            })
    })
}

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
