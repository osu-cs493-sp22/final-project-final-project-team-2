const router = require("express").Router();

const { validateAgainstSchema } = require("../lib/validation");
const { generateAuthToken, requireAuthentication } = require("../lib/auth")
const { ObjectId } = require("mongodb");

const {
  userSchema,
  insertNewUser,
  getUserById,
  getUserByEmail,
  validateUser,
} = require("../models/users");

exports.router = router;

//In progress
router.post("/", async function (req, res) {
  if (validateAgainstSchema(req.body, userSchema)) {
    try {
      const id = await insertNewUser(req.body);
      res.status(201).send({
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
      res.status(200).send({ token: token });
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
  console.log("== req.user:", req.user);
  console.log("== req.params.id:", req.params.id);

  if (req.user !== req.params.id) {
    res.status(403).send({
      err: "Unauthorized to access the specified resource",
    });
    next();
  } else {
    const user = await getUserById(req.params.id);
    console.log("== req.headers:", req.headers);
    if (user) {
      res.status(200).send(user);
    } else {
      next();
    }
  }
});
