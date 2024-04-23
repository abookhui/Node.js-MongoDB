const router = require('express').Router()
//세팅용

let connectDB = require('../database.js');

let db;
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
}).catch((err)=>{
  console.log(err)
});

router.get('/shirts',(req,res)=>{
    res.send('셔츠')
})
router.get('/pants',(req,res)=>{
    res.send('바지')
})

module.exports = router