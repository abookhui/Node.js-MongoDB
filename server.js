const express = require('express'); // install express
const app = express();  // express library
const { MongoClient ,ObjectId} = require('mongodb'); // install mongodb@5 ObjectId 사용
const e = require('express');
const { escapeXML } = require('ejs');
const methodOverride = require('method-override'); // install override-method PUT , DELETE 사용 

app.set('view engine', 'ejs');  // install ejs
app.use(methodOverride('_method')); // install override-method
app.use(express.static(__dirname + '/public')); // 폴더 등록해주기

app.use(express.json()); // require.body 사용시 필요
app.use(express.urlencoded({extended:true})); 

const url = 'mongodb+srv://admin:abokhui3249@cluster0.0rczsjn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
    app.listen(8080,function(){
        console.log('http://localhost:8080 에서 서버 실행중');
    });

}).catch((err)=>{
  console.log(err)
})

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
})



/*상세 페이지 API */
app.get('/detail/:id',async (req,res)=>{

    try{
    let result = await db.collection('post').findOne({_id : new ObjectId(req.params)});
        //console.log(result);
        res.render('detail.ejs',{post : result});
    }catch(e){
        console.log(e);
        res.status(400).send('error')
    }
    
})
app.get('/write',(req,res)=>{
    res.render('write.ejs');
})

app.post('/add',async (req,res)=>{
    let result = req.body;

    //console.log(result);

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


app.get('/edit/:id', async (req,res)=>{
    try{
        let result = await db.collection('post').findOne({_id : new ObjectId(req.params.id)});
    
    res.render('edit.ejs',{result : result});
    }catch(e){
        console.log(e);
    }
    
})

app.put('/revise',async (req,res) => {
    let result = req.body;
    //console.log(result);
    try{
        if(result.title == '' || result.content == ''){
                res.send("<script>alert('제목 또는 내용이 빈칸입니다.');</script>");
                res.redirect('/list');
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
app.get('/list', async (req,res)=>{
    let result = await db.collection('post').find().toArray();
    //console.log(result);
    res.render('list.ejs' , {post : result});
});

app.get('/list/next/:id', async (req,res)=>{
    try{
        let result = await db.collection('post')
            .find({_id : {$gte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result});
    }catch(e){
        console.log(e);
    }
    
});

app.get('/list/previous/:id', async (req,res)=>{
    try{
        let result = await db.collection('post')
            .find({_id : {$lte :new ObjectId(req.params.id)}})
            .limit(4).toArray();

        res.render('list.ejs',{post:result});
    }catch(e){
        console.log(e);
    }
    
});

app.post('/delete',async (req,res) =>{
    try{
        let result = req.body;
        //console.log(result);
        await db.collection('post').deleteOne({_id : new ObjectId(result.id)});
        res.redirect('/list');
    }catch(e){
        console.log(e);
    }
   
})