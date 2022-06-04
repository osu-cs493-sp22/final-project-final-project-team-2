const router = require('express').Router();

const {validateAgainstSchema, extractValidFields} = require('../lib/validation');

const { ObjectId } = require('mongodb');
const { requireAuthentication } = require('../lib/auth');
const { insertNewCourse, getAllCourses } = require('../models/courses');
const { CourseSchema } = require("../models/courses");

exports.router = router;

router.post("/", requireAuthentication, async function (req, res) {
    //only admins can use this function
    if (req.user.role != "admin"){
        res.status(403).send({
            err: "You do not have the permissions to add a new course"
        })
        return
    }
    if (validateAgainstSchema(req.body, CourseSchema)) {
        const course = extractValidFields(req.body,CourseSchema)
        insertNewCourse(course);
    }
});

router.get("/", async function (req,res){
    /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
//   const db = getDbInstance()
//   const collection = db.collection('courses')
//   const count = await collection.countDocuments();
  let page = parseInt(req.query.page) || 1;
  const {courses, page_two, lastPage, pageSize, count} = getAllCourses(page)
  const numPerPage = 10;
//   const lastPage = Math.ceil(count / numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;

  /*
   * Calculate starting and ending indices of businesses on requested page and
   * slice out the corresponsing sub-array of busibesses.
   */
  const start = (page - 1) * numPerPage;
  const end = start + numPerPage;
  const pageCourses = await getAllCourses(page)

  // console.log("start:",start," end:",end)

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/courses?page=${page + 1}`;
    links.lastPage = `/courses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/courses?page=${page - 1}`;
    links.firstPage = '/courses?page=1';
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    courses: pageCourses,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: count,
    links: links
  });

});