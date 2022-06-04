const { ObjectId } = require("mongodb");
const { getDbInstance } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const bcrypt = require("bcryptjs");

const userSchema = {
  "name": { required: true },
  "email": { required: true },
  "password": { required: true },
  "role": { required: true },
};
exports.userSchema = userSchema;

//TEST
exports.getUsers = async function getUsers() {
  const db = getDbInstance();
  const collection = db.collection("users");

  const results = await collection.find({}).toArray();
  return results;
};

//
exports.insertNewUser = async function insertNewUser(user) {
  const userToInsert = extractValidFields(user, userSchema);
  const db = getDbInstance();
  const collection = db.collection("users");

  //password hash
  const passwordHash = await bcrypt.hash(userToInsert.password, 8);
  userToInsert.password = passwordHash;
  console.log("== Hashed, salted password:", userToInsert.password);

  const result = await collection.insertOne(userToInsert);
  return result.insertedId;
};

//
exports.getUserById = async function getUserById(id, includePassword) {
  const db = getDbInstance();
  const collection = db.collection("users");
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(id) })
      .project(includePassword ? {} : { password: 0 })
      .toArray();
    return results[0];
  }
};

//
exports.validateUser = async function validateUser(email, password) {
  const user = await getUserByEmail(email, true);
  const authenticated = user && (await bcrypt.compare(password, user.password));
  return authenticated;
};

//
async function getUserByEmail(email, includePassword) {
  const db = getDbInstance();
  const collection = db.collection("users");
  const results = await collection
    .find({ email: email })
    .project(includePassword ? {} : { password: 0 })
    .toArray();
  return results[0];
};
exports.getUserByEmail = getUserByEmail;

async function clearUsers() {
  const db = getDbInstance();
  const collection = db.collection("users");
  await collection.deleteMany({})
}
exports.clearUsers = clearUsers;