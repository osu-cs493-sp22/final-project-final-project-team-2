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

exports.getAllAssignments = async function getAllAssignments(assignment) {
  const db = getDbInstance()
  const collection = db.collection('assignments')
  
  const count = await collection.countDocuments()
  const pageSize = 10
  const lastPage = Math.ceil(count / pageSize)
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize

  const results = await collection
    .find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    assignments: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
  }
}

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

exports.deleteAssignmentById = async function deleteAssignmentsById(id) {
  const db = getDbInstance()
  const collection = db.collection('assignments')

  const result = await collection.deleteOne({
    _id: new ObjectId(id)
  })
  return result.deletedCount > 0
}

exports.updateAssignmentById = async function updateAssignmentById(id, assignment) {
  const db = getDbInstance()
  const collection = db.collection('assignments')

  assignment = extractValidFields(assignment, AssignmentSchema)

  const result = await collection.replaceOne({
    _id: new ObjectId(id)}, assignment )
  return result.matchedCount > 0
}