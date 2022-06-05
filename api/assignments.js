const router = require("express").Router();
const { ObjectId, Collection } = require("mongodb");
const { path } = require('express/lib/application');
const { nextTick } = require("process");
const e = require("express");

const {validateAgainstSchema,isValidAssignment,isValidUser} = require('../lib/validation');
const {upload,saveFile, removeFile} = require('../models/submissions');
const {SubmissionSchema} = require('../models/submissions')
const {getDbInstance} = require('../lib/mongo');
const { requireAuthentication } = require("../lib/auth");
const { getUserById } = require("../models/users");
const { getCourseById } = require("../models/courses");


const {
  AssignmentSchema,
  insertNewAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById,
} = require("../models/assignments");




exports.router = router;

router.post('/:id/submissions',requireAuthentication, upload.single('file'), async(req,res,next)=>{
    if (
        req.file &&
        req.body &&
        validateAgainstSchema(req,body,SubmissionSchema) &&
        ObjectId(req.params.id).isEqual(req.body.assignmentId) &&
        isValidAssignment(req.params.id) &&
        isValidUser(req.body.studentId)
    ) {
        const db = getDbInstance()
        const assignment = getAssignmentById(req.params.id)
        const course = getCourseById(assignment.courseId)

        if (
        ObjectId(req.params.studentId).isEqual(req.user.userId) ||
        req.user.role === "admin" ||
        ((req.user.role === "instructor") && (ObjectId(req.user).isEqual(course.instructorId)))
        ) {
            const result = await saveFile({
                id: req.body.instructorId,
                assignment: req.body.assignmentId,
                course: course._id.toString(),
                extension: req.file,
                timestamp: Date.now(),
                filename: req.file.filename,
                extension: req.file.filename.split(".")[0],
                path: `${__dirname}/${this.filename}.${this.extension}`
            })
            removeFile(req.file.path)
            res.send(201).send({
                id: result
            })
    } else {
            removeFile(req.file.path)
            next()
        }

    } else {
        removeFile(req.file.path)
        next()
    }
})




//For TESTING purposes, shows page(s) of existing assignments
router.get("/", async function (req, res) {
  try {
    const assignmentsPage = await getAllAssignments(
      parseInt(req.query.page) || 1
    );
    res.status(200).send(assignmentsPage);
  } catch (err) {
    res.status(500).send({
      err: "Unable to fetch assignment pages.",
    });
  }
});

//Create an Assignment
router.post("/", requireAuthentication, async function (req, res) {
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    try {
      const authenticatedUser = await getUserById(req.user);
      console.log("user: ", req.user);

      const course = await getCourseById(req.body.courseId);
      console.log("course: ", course);

      if (
        authenticatedUser.role == "admin" ||
        (authenticatedUser.role == "instructor" &&
          course.instructorId == req.user)
      ) {
        const id = await insertNewAssignment(req.body);
        res.status(200).send({
          id: id,
          links: {
            assignment: `/assignments/${id}`,
          },
        });
      } else {
        res.status(403).send({
          error: "Error, only admin or instructor can post an Assignment.",
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Error adding assignment to database. Invalid.",
      });
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid assignment object. ",
    });
  }
});

//Get Assignment data by ID
router.get("/:id", async function (req, res) {
  try {
    const assignment = await getAssignmentById(req.params.id);
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      res.status(404).send({ error: "Specified Assignment `id` not found." }); //might change bacl to next()
    }
  } catch (err) {
    res.status(500).send({
      err: "Unable to fetch assignment.",
    });
  }
});

//Delete Assignment by ID
router.delete("/:id", requireAuthentication, async function (req, res) {

  try {
  const authenticatedUser = await getUserById(req.user);
  const assignment = await getAssignmentById(req.params.id);
  const course = await getCourseById(assignment.courseId);

  console.log("course: ", course);
  console.log("req,user: ", req.user);
  console.log("course.instructorId: ", course.instructorId);

    if (authenticatedUser.role == "admin" || (authenticatedUser.role == "instructor" && course.instructorId == req.user)) {
      const id = req.params.id;
      const deleteSuccessful = await deleteAssignmentById(id);
      if (deleteSuccessful) {
        res.status(204).send();
      } else {
        next()
      }
    } else {
      res.status(403).send({
        error: "Error, only admin or course instructor can delete course.",
      });
    } 
  } catch(err) {
    res.status(500).send({
      error: "Error deleting Assignment. Wrong Assignment Id."
    });
  }
});

//Update Assignment data by ID
router.patch("/:id", requireAuthentication, async function (req, res) {
  if (req.body && req.body.courseId && req.body.title && req.body.points && req.body.due) {
  try {
    const authenticatedUser = await getUserById(req.user);
    const assignment = await getAssignmentById(req.params.id);
    const course = await getCourseById(assignment.courseId);
  
    console.log("course: ", course);
    console.log("req,user: ", req.user);
    console.log("course.instructorId: ", course.instructorId);
  
      if (authenticatedUser.role == "admin" || (authenticatedUser.role == "instructor" && course.instructorId == req.user)) {
        const id = req.params.id;
        const updateSuccesful = updateAssignmentById(assignment._id, req.body)
        if (updateSuccesful) {
          res.status(200).send();
        } else {
          console.log("error")
          next()
        }
      } else {
        res.status(403).send({
          error: "Error, only admin or course instructor can update course data.",
        });
      } 
    } catch(err) {
      res.status(404).send({
        error: "Error updating Assignment. Specified Assignment `id` not found."
      });
    }
  } else {
    res.status(400).send({
      error: "The request body did not contain fields related to Assignment objects."
    });
  }
});
