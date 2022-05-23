const router = require("express").Router();

const { validateAgainstSchema } = require("../lib/validation");

const { ObjectId, Collection } = require("mongodb");

const {
  AssignmentSchema,
  insertNewAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentById,
  deleteAssignmentById,
} = require("../models/assignments");
const { nextTick } = require("process");
const { requireAuthentication } = require("../lib/auth");
const { getUserById } = require("../models/users");
const { getCourseById } = require("../models/courses");
const e = require("express");

exports.router = router;

//testing purposes for now
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

router.post("/", requireAuthentication, async function (req, res) {
  if (validateAgainstSchema(req.body, AssignmentSchema)) {
    try {
      //Only admin or authenticated instructor whose id matches instructorId of course can create assignment
      const authenticate = await getUserById(req.user);
      const course = await getCourseById(req.body.courseId); // needs courses api code ** not fully functioniing

      console.log("== req.user", authenticate);
      console.log("== req.body.courseId", course);

      if ((authenticate.role == "instructor" && course.instructorId) || authenticate.role == "admin") {
        const id = await insertNewAssignment(req.body);
        res.status(200).send({
          id: id,
          links: { assignment: "/assignments/${id}" },
        });
      } else {
        res.status(403).send({
          err:
            "Unauthorized access. Only admin and/or course instructor may add assignments.",
        });
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res
        .status(500)
        .send({ error: "Error, assignment creation unsuccesful." });
    }
  } else {
    res.status(400).send({
      error: "Request body is invalid / missing fields.",
    });
  }

  /*
    if() {
        res.status(403).send({
          error: "Unauthorized to access the specified resource"
        });
      } else {
        if (validateAgainstSchema(req.body, AssignmentSchema)) {
          const id = await insertNewAssignment(req.body);
          res.status(200).send({
            id: id,
                links: { assignment: '/assignments/${id}' }
        })
        }
        else {
          res.status(400).json({
            error: "Request body does not contain valid info."
          });
        }
      }*/
});

//needs more
router.get("/:id", async function (req, res) {
  try {
    const assignment = await getAssignmentById(req.params.id);
    if (assignment) {
      res.status(200).send(assignment);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      err: "Unable to fetch assignment.",
    });
  }
});

router.patch("/:id", async function (req, res) {});

router.delete("/:id", async function (req, res) {});
