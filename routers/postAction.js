const router = require('express').Router();
const { MongoClient ,ObjectId} = require('mongodb'); 
let connectDB = require('../database.js');

let db;
connectDB.then((client)=>{
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
        //console.log(req.params.id);
    let ans = await db.collection('comment').find({page : req.params.id}).toArray();    
        res.render('detail.ejs',{post : result,ans : ans});
        
    }catch(e){
        console.log(e);
        res.status(400).send('error')
    }
    
});

// router.get('/detail/:id/chat', async (req,res) =>{
   
   
//     try{
//          let ans = req.params.id;
//         //console.log(req.user.result);
//         console.log(ans);
//         let result = await db.collection('chat').find({
//             userID : req.user.result._id,
//             pageID : ans,
//         }).toArray();
//         let other = await db.collection('post').findOne({_id : new ObjectId(ans)})
//         if(result == ''){
//             console.log('bim')
//         }
        
//         else {
//             res.render('chat.ejs', {post : result}, {other : {
//             pageID : ans,
//             otherID: other.userID,
//             othername: other.username
        
//             }});
//         }
//     }catch(e){
//         console.log(e);
//     }
// })

// router.post('/chat',async (req,res) =>{
//     let result = req.body
//     console.log(result);
//     let ans = req.user.result
//     let time = new Date();
//     await db.collection('chat').insertOne({
//         pageID: result.pageID,
//         userID: ans._id,
//         username: ans.username,
//         content: result.content,
//         time: time.toLocaleString(),
//         otherID: result.otherID,
//         othername:result.othername
//     })
// })
// edit revise

router.get('/edit/:id', async (req,res)=>{
    try{
        let result = await db.collection('post').findOne({_id : new ObjectId(req.params.id)});
        if (result.userID.equals(req.user.result._id)){
            res.render('edit.ejs',{result : result});
        }
        else res.send('본인이 작성한 글이 아님');
            
    }catch(e){
        console.log(e);
    }
    
})


router.put('/revise',async (req,res) => {
    let result = req.body;
    //console.log(result);
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
router.get('/list',async (req,res)=>{
    let result = await db.collection('post').find().toArray();
    //console.log(result);
    
   try{
    let ans = req.user.result; 
    //console.log(ans);
    if(ans!='')res.render('list.ejs' , {post : result , presentUser : ans });
   }catch(e){
    console.log(e);
    
   }
    
    
});

router.get('/list/next/:id', async (req,res)=>{
    try{
        let ans = req.user.result; 
        let result = await db.collection('post')
            .find({_id : {$gte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result, presentUser : ans});
    }catch(e){
        console.log(e);
    }
    
});

router.get('/list/previous/:id', async (req,res)=>{
    try{
        let ans = req.user.result; 
        let result = await db.collection('post')
            .find({_id : {$lte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result, presentUser : ans});
    }catch(e){
        console.log(e);
    }
    
});




//delete
router.post('/delete',async (req,res) =>{
    try{
        let result = req.body;
        let ans = req.user.result;
       
       
        if(new ObjectId(result.userID).equals(new ObjectId(ans._id))){
            await db.collection('post').deleteOne({_id : new ObjectId(result.id)});
        }
        
        res.redirect('/list');
    }catch(e){
        console.log(e);
    }
   
})

// write add

router.get('/write' ,async (req,res)=>{
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
    let ans = req.user.result;
    //console.log(result);
    //console.log(ans);
    try{
        if(result.title == '' || result.content == ''){
            res.send('입력이 안됨');
        }
        else {
            await db.collection('post').insertOne({
                title : result.title, 
                content : result.content,
                userID : ans._id,
                username: ans.username
            })
            res.redirect('/list');
        }
        
    }catch(e){
        console.log(e);
        res.status(500).send('server error');
    }
})

router.post('/logout',async (req,res)=> {
    let result = await db.collection('sessions').deleteOne({

    })
})

//comments
router.post('/comment',async (req,res) =>{
    let result = req.body;
    let ans = req.user.result;
   // console.log(ans);
    let time = new Date();
    //console.log(time.toLocaleString());
    //console.log(result);
    

    await db.collection('comment').insertOne({
        comments: result.comment, 
        time : time.toLocaleString(),
        username : ans.username,
        userID : ans._id,
        page : result.page
    })
    res.redirect('/list');
})

module.exports = router