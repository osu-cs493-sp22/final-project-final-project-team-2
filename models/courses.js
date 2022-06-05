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
  const db = getDbInstance();
  const collection = db.collection("courses");

  course = extractValidFields(course, CourseSchema);
  const result = await collection.insertOne(course);
  return result.insertedId;
};

exports.getCourseById = async function getCourseById(id) {
  const db = getDbInstance();
  const collection = db.collection("courses");

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection.find({ _id: new ObjectId(id) }).toArray();
    return results[0];
  }
};
