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
}
exports.SubmissionSchema = SubmissionSchema

exports.removeFile = async (target_path)=>{
    return new Promise((resolve, reject) => {
        fs.unlink(target_path, (err) => {
            if (err) {
                reject(err)
            } else {
                console.log("original removed")
                resolve()
            }
        })
    })
}

exports.upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req,file,callback) => {
            const ext = mime.extension(file.mimetype)
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
            .on('finish',async (result)=>{
                console.log("== save result:", !!result)
                const remove = await this.removeFile(payload.path)
                resolve(result._id)
            })
    })
}

// exports.insertNewSubmission = async function insertNewSubmission(submission) {
//   const db = getDbInstance()
//   const collection = db.collection('submissions')

//   submission = extractValidFields(submission, SubmissionSchema)
//   submission.assignmentId = new ObjectId(submission.assignmentId)
//   submission.studentId = new ObjectId(submission.studentId)
//   const result = await collection.insertOne(submission)

//   return result.insertedId
// }

exports.getSubmissionById = async function getSubmissionById(id) {
  const db = getDbInstance()
  const collection = db.collection('submissions.files')

  const submission = await collection.aggregate([
    { $match : { _id: new ObjectId(id) } }
  ]).toArray()
  return submission[0]
}

// exports.getAllSubmissions = async function getAllSubmissions(page) {
//   const db = getDbInstance()
//   const collection = db.collection('submissions')

//   const count = await collection.countDocuments()
//   const pageSize = 10;
//   const lastPage = Math.ceil(count / pageSize)
//   page = page < 1 ? 1 : page
//   const offset =  (page - 1) * pageSize

//   const submissions = await collection.find({}).sort({_id:1}).skip(offset).limit(pageSize).toArray()

//   return {
//     submissions: submissions,
//     page: page,
//     totalPages: lastPage,
//     pageSize: pageSize,
//     count: count
//   }
// }

exports.addGrade = async (grade,id)=>{
    const db = getDbInstance()
    const collection = db.collection("submissions.files")

    result = await collection.updateOne(
        {_id: ObjectId(id)},
        { $set: {"metadata.grade":parseFloat(grade)}}
        )
    console.log(result)
    return result
}

exports.getAssignmentSubmissions = async (page,id) => {
    const db = getDbInstance()
    const collection = db.collection("submissions.files")

    const count = await collection.countDocuments({"metadata.assignmentId":ObjectId(id)})
    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize)
    page = page < 1 ? 1 : page
    const offset =  (page - 1) * pageSize

    var submissions = await collection.aggregate([
        {$match : {"metadata.assignmentId": ObjectId(id)}},
        {$project : {_id:1,"metadata.userId":1,"metadata.timestamp":1,"metadata.grade":1}}
    ])
        .sort({_id:1})
        .skip(offset)
        .limit(pageSize)
        .toArray()

    submissions.forEach(element => {
        element["id"] = element._id.toString()
        element["userId"] = element.metadata.userId.toString()
        element["timestamp"] = element.metadata.timestamp
        element["grade"] = element.metadata.grade
        element["link"] = `/submissions/${element._id.toString()}`
        delete element._id
        delete element.metadata
    });

    return {
      submissions: submissions,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    }
  }


exports.getSubmissionInfoById = async function(id) {
  const db = getDbInstance()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })

  if(!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket.find({ _id: new ObjectId }).toArray()
    return results[0]
  }
}

exports.getSubmissionDownloadStream = function(filename) {
  const db = getDbInstance()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  return bucket.openDownloadStreamByName(filename)
}
