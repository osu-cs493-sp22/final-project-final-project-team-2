const { getDbInstance } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const { ObjectId, countDocuments } = require("mongodb");

const CourseSchema = {
  subject: { required: true },
  number: { required: true },
  title: { required: true },
  term: { required: true },
  instructorId: { required: true },
};
exports.CourseSchema = CourseSchema;

exports.insertNewCourse = async function insertNewCourse(course) {
  const db = getDbInstance()
  const collection = db.collection('courses')

  course = extractValidFields(course, CourseSchema)
  course.instructorId = new ObjectId(course.instructorId)
  const result = await collection.insertOne(course)

  return result.insertedId
}

exports.getAllCourses = async function getAllCourses(page) {
  const db = getDbInstance()
  const collection = db.collection('courses')

  const count = await collection.countDocuments()
  const pageSize = 10
  const lastPage = Math.ceil(count / pageSize)
  page = page < 1 ? 1 : page
  const offset = (page - 1) * pageSize

  const courses = await collection.find({}).sort({ _id: 1 }).skip(offset).limit(pageSize).toArray()

  return {
    courses: courses,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  }
}

exports.getCourseById = async function getCourseById(id) {
  const db = getDbInstance()
  const collection = db.collection('courses')

  const course = await collection.aggregate([
    { $match: { _id: new ObjectId(id) } }
  ]).toArray()
  return course[0]
}

exports.getCoursesPage = async function (query) {
  const db = getDbInstance()
  const collection = db.collection("courses")

  const count = await collection.countDocuments()

  const pageSize = 10
  const lastPage = Math.ceil(count / pageSize)
  query.page = query.page < 1 ? 1 : query.page
  const offset = (query.page - 1) * pageSize

  delete query.page

  const results = await collection.find({ query })
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray()

  return {
    courses: results,
    page: query.page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  }
}

exports.deleteCourse = async (id) => {
  const db = getDbInstance()
  const collection = db.collection("courses")

  collection.deleteOne({ _id: ObjectId(id) })
}

exports.getCourseAssignments = async (id) => {
    const db = getDbInstance()
    const collection = db.collection("assignments")

    results = collection.find({courseId: id}).toArray()
    return results
}