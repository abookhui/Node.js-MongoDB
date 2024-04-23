const router = require('express').Router();
const { MongoClient ,ObjectId} = require('mongodb'); 
let connectDB = require('../database.js');

let db;
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
}).catch((err)=>{
  console.log(err)
});

function CheckLogin(req,res,next){

    if(!req.user){
        res.send('로그인 하세요.');  // 응답해 버리면 이 밑 코드 실행 안됨
    }
    else next() // middleware 코드 실행 끝났으니 다음 코드 실행하시오 
}

/*상세 페이지 API */
router.get('/detail/:id',async (req,res)=>{
    try{
    let result = await db.collection('post').findOne({_id : new ObjectId(req.params)});
        //console.log(result);
        res.render('detail.ejs',{post : result});
    }catch(e){
        console.log(e);
        res.status(400).send('error')
    }
    
});

// write add

router.get('/write',CheckLogin,async (req,res)=>{
    try{
        let ans =req.user;

        if(ans != null){ 
            res.render('write.ejs');
        }
 
    }catch(e){
        console.log(e);
    }
    
    
 
})

router.post('/add',async (req,res)=>{
    let result = req.body;

    try{
        if(result.title == '' || result.content == ''){
            res.send('입력이 안됨');
        }
        else {
            await db.collection('post').insertOne({title : result.title, content : result.content})
            res.redirect('/list');
        }
        
    }catch(e){
        console.log(e);
        res.status(500).send('server error');
    }
})

// edit revise

router.get('/edit/:id', async (req,res)=>{
    try{
        let result = await db.collection('post').findOne({_id : new ObjectId(req.params.id)});
    
    res.render('edit.ejs',{result : result});
    }catch(e){
        console.log(e);
    }
    
})


router.put('/revise',async (req,res) => {
    let result = req.body;
    console.log(result);
    try{
        if(result.title == '' || result.content == ''){
                res.send("<script>alert('제목 또는 내용이 빈칸입니다.');</script>");
                //res.redirect('/list');
            }
        else{
            await db.collection('post').updateOne({_id : new ObjectId(result.id)},
            {$set:{
                title : result.title,
                content : result.content
            }});
            res.redirect('/list');
        }
    }catch(e){
        console.log(e);
    }
    
});
// list
router.get('/list' ,async (req,res)=>{
    let result = await db.collection('post').find().toArray();
    //console.log(result);
    res.render('list.ejs' , {post : result});
});

router.get('/list/next/:id', async (req,res)=>{
    try{
        let result = await db.collection('post')
            .find({_id : {$gte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result});
    }catch(e){
        console.log(e);
    }
    
});

router.get('/list/previous/:id', async (req,res)=>{
    try{
        let result = await db.collection('post')
            .find({_id : {$lte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result});
    }catch(e){
        console.log(e);
    }
    
});

//delete
router.post('/delete',async (req,res) =>{
    try{
        let result = req.body;
        //console.log(result);
        await db.collection('post').deleteOne({_id : new ObjectId(result.id)});
        res.redirect('/list');
    }catch(e){
        console.log(e);
    }
   
})

module.exports = router