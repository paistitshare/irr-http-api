const express = require('express');
const router = express.Router()
const postController = require('../src/api/post/PostController');
const wordController = require('../src/api/word/WordController');

router.get('/', function (req, res) {
  res.send('Birds home page')
})

router.get('/ads', postController.getPosts);
router.get('/words', wordController.getWords);

module.exports = router;
