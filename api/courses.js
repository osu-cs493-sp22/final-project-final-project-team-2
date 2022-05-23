const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');

const { ObjectId } = require('mongodb');

const { getCoursesPage, CourseSchema, insertNewCourse } = require('../models/courses')

exports.router = router;

router.get('/', async function (req, res, next) {
    // Build query
    let query = req.query

    // Set sane default for page
    query.page = parseInt(req.query.page) || 1

    const course_page = await getCoursesPage(query)

    res.status(200).json(course_page)

})

// MUST HAVE VALIDATION
// left out for dev work for now
router.post('/', async function (req, res, next) {
    if (req.body &&
        validateAgainstSchema(req.body, CourseSchema) &&
        ObjectId.isValid(req.body.instrutorId)
    ) {
        if (1) {//Security check here
            const id = await insertNewCourse(req.body)
            res.status(201).send({ id: id })
        } else {
            res.status(403).send({
                err: "Unauthorized to access the specified resource"
            })
        }
    } else {
        res.status(400).send({
            err: "Bad body"
        })
    }
})