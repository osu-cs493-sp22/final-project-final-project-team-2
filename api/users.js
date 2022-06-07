const router = require("express").Router();

const { validateAgainstSchema } = require("../lib/validation");
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require("../lib/auth")
const { ObjectId } = require("mongodb");

const {
  userSchema,
  insertNewUser,
  getUserById,
  getUserByEmail,
  validateUser,
  getUsers,
} = require("../models/users");

exports.router = router;

//In progress
router.post("/", optionalAuthentication, async function (req, res) {
  if (validateAgainstSchema(req.body, userSchema)) {
    try {
      //Only admins can create admins and teachers
      if (req.body.role == "instructor" || req.body.role == "admin"){ //must check permissions first
        const authenticatedUser = await getUserById(req.user);
        if (authenticatedUser == null || authenticatedUser.role != "admin"){ //if the user is not authenticated or not an admin
          res.status(403).send({
            err: "You do not have the required permissions to create that user"
          })
          return
        }
      }
      const validRoles = ["student","instructor","admin"]
      if (!(validRoles.includes(req.body.role))){
        res.status(400).send({
          err: "new user does not have a valid role"
        })
        return
      }
      if ( (await getUserByEmail(req.body.email)) != undefined) {
        res.status(400).send({
          err: "A user with that email already exists"
        })
        return
      }
      //Insert that user
      const id = await insertNewUser(req.body);
      res.status(201).send({
        description: "New User successfully added",
        _id: id,
      });
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({ error: "Error, user insert unsuccesful." });
    }
  } else {
    res.status(400).send({
      error: "Request body does not contain a valid User.",
    });
  }
});

//In progress
router.post("/login", async function (req, res) {
  if (req.body && req.body.email && req.body.password) {
    const authenticated = await validateUser(req.body.email, req.body.password);
    if (authenticated) {
      const user = await getUserByEmail(req.body.email);
      console.log("== user.id", user._id);
      const token = generateAuthToken(user._id);
      res.status(200).send({ _id: user._id, token: token });
    } else {
      res.status(401).send({
        error: "Invalid credentials",
      });
    }
  } else {
    res.status(400).send({
      error: "Request needs email and password.",
    });
  }
});

//In progress
router.get("/:id", requireAuthentication, async function (req, res, next) {
  // console.log("== req.user:", req.user);
  // console.log("== req.params.id:", req.params.id);
  const authenticatedUser = await getUserById(req.user);
  console.log(authenticatedUser)
  if (req.user !== req.params.id && authenticatedUser.role!="admin") {
    res.status(403).send({
      err: "Unauthorized to access the specified resource",
    });
    return
  } else {
    const user = await getUserById(req.params.id);
    console.log("== req.headers:", req.headers);
    // TODO: If instructor, should include courses taught
    //      If student, should include the courses taken
    var courseIds = []
    if (user.role == "instructor"){
      courseIds = [] //later
    } else if (user.role == "student"){
      courseIds = [] //also later
    }
    if (user) {
      res.status(200).send(user);
    } else {
      next();
    }
  }
});

router.get("/", async function (req, res, next) {
  const users = await getUsers()
  res.status(200).send(users);
})
