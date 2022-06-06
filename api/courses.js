const router = require('express').Router();

const json2csv = require('json2csv').parse
const fs = require('fs');
const {
    validateAgainstSchema,
    isValidUser,
    isValidCourse
} = require('../lib/validation');

const { ObjectId } = require('mongodb');
const { requireAuthentication } = require('../lib/auth');


const {
    getCoursesPage,
    CourseSchema,
    insertNewCourse,
    getCourseById,
    getCourseAssignments,
    getAllCourses,
    getRoster,
    enrollStudent,
    getStudents,
    unenrollStudent,
    deleteCourse
} = require('../models/courses')
const { getUserById } = require('../models/users');
const { getSubmissionDownloadStream, removeFile } = require('../models/submissions');


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
    console.log(req.body)
    if (req.body &&
        validateAgainstSchema(req.body, CourseSchema) &&
        ObjectId.isValid(req.body.instructorId)
    ) {
        const authUser = await getUserById(req.user);
        const target_instructor = await getUserById(req.body.instructorId)
        
        if (authUser.role === "admin") { //Security check here

            const id = await insertNewCourse(req.body)
            res.status(201).send({ _id: id })
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

router.get('/:id/assignments', async (req,res,next)=>{
    //The Tarpaulin specificaiton says this should only return a list of assignment Ids.
    if(ObjectId.isValid(req.params.id) && isValidCourse(req.params.id)) {
        const course = await getCourseById(req.params.id)
        const results = await getCourseAssignments(req.params.id)
        var ids = []
        results.forEach(element => {
            ids.push(element._id)
        });
        res.status(200).send(ids)
        return
    } else {
        next()
    }
})


router.get('/:id/students',requireAuthentication, async (req,res,next)=> {
    const authUser = await getUserById(req.user)
    if (isValidCourse(req.params.id)) {
        const course = await getCourseById(req.params.id)
        if (
            authUser.role === "admin" ||
            (authUser.role === "instructor" && req.params.id === course.instructorId.toString())
         ) {
                const results = await getStudents(req.params.id)

                res.status(200).send(results)
            } else {
                next()
            }
    } else {
        next()
    }
})

router.get('/:id/roster',requireAuthentication, async (req,res,next)=> {
    const authUser = await getUserById(req.user)
    if (isValidCourse(req.params.id)) {
        const course = await getCourseById(req.params.id)
        if (
            authUser.role === "admin" ||
            (authUser.role === "instructor" && req.params.id === course.instructorId.toString())
         ) {
                const student_array = await getStudents(req.params.id)
                const csv = json2csv(student_array)
                const filePath = `${__dirname}/../tmp/${req.params.id}.csv`
                const result = await fs.writeFile(filePath,csv,(err)=>{
                    if(err){
                        res.json(err).status(500)
                    }
                })
                var filestream = fs.createReadStream(filePath)
                filestream.pipe(res).status(200)
                setTimeout(function() {
                    removeFile(filePath)
                }, 10000)
            } else {
                next()
            }
    } else {
        next()
    }
})


router.post('/:id/students',requireAuthentication, async (req,res,next)=> {
    const authUser = await getUserById(req.user)
    if (isValidCourse(req.params.id)) {
        const course = await getCourseById(req.params.id)
        if (
            authUser.role === "admin" ||
            (authUser.role === "instructor" && req.params.id === course.instructorId.toString())
            ) {
            var enrolled = []
            var unenrolled = []
            if (req.body.add && req.body.add.length) {
                for (const student of req.body.add) {
                    if (isValidUser(student)) {
                        const curStudent = await getUserById(student)
                        if (curStudent.role === "student") {
                            enrolled.push(ObjectId(student))
                        }
                    }
                }
                result = await enrollStudent(req.params.id,enrolled)
            }
            if (req.body.remove && req.body.remove.length) {
                for (const student of req.body.remove) {
                    if (isValidUser(student)) {
                        const curStudent = await getUserById(student)
                        if (curStudent.role === "student") {
                            unenrolled.push(ObjectId(student))
                        }
                    }
                }
                result = await unenrollStudent(req.params.id,unenrolled)
            }
            res.status(201).send()
            } else {
                next()
            }
    } else {
        next()
    }
})