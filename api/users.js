const router = require('express').Router();

const {validateAgainstSchema} = require('../lib/validation');

const { ObjectId } = require('mongodb');

exports.router = router;