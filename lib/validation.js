const { getDbInstance } = require('../lib/mongo')
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs')

module.exports = {
  /*
   * Performs data validation on an object by verifying that it contains
   * all required fields specified in a given schema.
   *
   * Returns true if the object is valid agianst the schema and false otherwise.
   */
  validateAgainstSchema: function (obj, schema) {
    return obj && Object.keys(schema).every(
      field => !schema[field].required || obj[field] != undefined
    );
  },

  /*
   * Extracts all fields from an object that are valid according to a specified
   * schema.  Extracted fields can be either required or optional.
   *
   * Returns a new object containing all valid fields extracted from the
   * original object.
   */
  extractValidFields: function (obj, schema) {
    let validObj = {};
    Object.keys(schema).forEach((field) => {
      if (obj[field] != undefined) {
        validObj[field] = obj[field];
      }
    });
    return validObj;
  },

  isValidUser: async (id) => {
    const db = getDbInstance()
    const collection = db.collection("users")
    return (ObjectId.isValid(id) && (await collection.find({ _id: new ObjectId(id) }).toArray()).length > 0)
  },

  isValidCourse: async (id) => {
    const db = getDbInstance()
    const collection = db.collection("courses")

    return (ObjectId.isValid(id) && (await collection.find({ _id: new ObjectId(id) }).toArray()).length > 0)
  },

  isValidAssignment: async (id) => {
    const db = getDbInstance()
    const collection = db.collection("assignments")
    return (ObjectId.isValid(id) && (await collection.find({ _id: new ObjectId(id) }).toArray()).length > 0)
  },
  isValidSubmission: async (id) => {
    const db = getDbInstance()
    const collection = db.collection("submissions.files")
    return (ObjectId.isValid(id) && (await collection.find({ _id: new ObjectId(id) }).toArray()).length > 0)
  }

}