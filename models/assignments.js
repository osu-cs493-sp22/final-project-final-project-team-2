const { getDbInstance } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const { ObjectId, countDocuments } = require('mongodb')

const AssignmentSchema = {
  "courseId" : { require: true },
  "title" : { require : true },
  "points" : { require : true },
  "due" : { require : true }
}
exports.AssignmentSchema = AssignmentSchema

exports.insertNewAssignment = async function insertNewAssignment(assignment) {
  const db = getDbInstance()
  const collection = db.collection('assignments')

  assignment = extractValidFields(assignment, AssignmentSchema)
  assignment.courseId = new ObjectId(assignment.courseId)
  const result = await collection.insertOne(assignment)

  return result.insertedId
}

exports.getAssignmentById = async function getAssignmentById(id) {
  const db = getDbInstance()
  const collection = db.collection('assignments')

  const assignment = await collection.aggregate([
    { $match: { _id: new ObjectId(id) } }
  ]).toArray()
  return  assignment[0]
}
