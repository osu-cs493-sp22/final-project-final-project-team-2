const router = require('express').Router();

const { validateAgainstSchema, isValidUser, isValidCourse } = require('../lib/validation');

const { ObjectId } = require('mongodb');
const { requireAuthentication } = require('../lib/auth');

const { getCoursesPage, CourseSchema, insertNewCourse, getCourseById, getAllCourses } = require('../models/courses');
const { getUserById } = require('../models/users');

exports.router = router;

router.get('/', async function (req, res, next) {
    // Build query
    // let query = req.query

    // Set sane default for page
    const page = parseInt(req.query.page) || 1

    const course_page = await getAllCourses(page)

    res.status(200).json(course_page)

})

router.get('/:id', async (req, res, next) => {
    if (isValidCourse(req.params.id)) {
        const result = await getCourseById(req.params.id)
        res.status(200).send(result)
    } else {
        next()
    }
})

// MUST HAVE VALIDATION
// left out for dev work for now
router.post('/', requireAuthentication, async function (req, res, next) {
    // console.log(ObjectId.isValid(req.body.instrutorId))
    // console.log(req.body)
    if (req.user == null){
        res.status(403).send({
            err: "Must be logged in to access this resource"
        })
    }
    if (req.body &&
        validateAgainstSchema(req.body, CourseSchema) &&
        await getUserById(req.body.instructorId)
    ) {
        const authUser = await getUserById(req.user);
        console.log(req.user)
        console.log(authUser)
        if (req.user && authUser.role == "admin") {//Security check here
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

// MUST HAVE VALIDATION
router.delete('/:id', requireAuthentication, async function (req, res, next) {
    if (ObjectId.isValid(req.params.id) && isValidCourse(req.params.id)) {
        const authUser = await getUserById(req.user);
        if (req.user && authUser.role == "admin") { //Security check
            await deleteCourse(req.params.id)
            res.status(204).end()
        } else {
            res.status(400)
        }
    } else {
        next()
    }
})

