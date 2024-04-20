const express = require('express')
const app = express() // express library 사용
const {MongoClient,ObjectId}  = require('mongodb');
const methodOverride = require('method-override');

app.use(methodOverride('_method')) 
app.use(express.static(__dirname + '/public')); // 폴더 등록해주기
app.set('view engine', 'ejs');

app.use(express.json()); // require.body 사용시 필요
app.use(express.urlencoded({extended:true})); 




// server가 DB와 통신하는 법
let db;
const url = 'mongodb+srv://admin:abokhui3249@cluster0.0rczsjn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum');

  app.listen(8080, () => { // port 번호  // port 오픈하는 코드
      console.log('http://localhost:8080 에서 서버 실행중')
  })

}).catch((err)=>{
  console.log(err)
});


app.get('/', (요청, 응답) => {  // main page 에 접속시 
  응답.sendFile(__dirname + '/index.html'); // __dirname현재 프로젝트 절대 경로
});

app.get('/news',function(require,respond){
  //db.collection('post').insertOne({title : 'aaaa'});
  respond.send("it's rainning")
});

app.get('/about',function(require,respond){
  respond.sendFile(__dirname + '/about.html');
});

app.get('/list',async function(require,respond){
  let result = await db.collection('post').find().toArray(); // mongodb document 가져옴

  //console.log(result[0].title);
  //respond.send(result[0].title); respond 는 한번만
  respond.render('list.ejs',{ posts : result });
});
app.get('/time',function(require,respond){
  let time = new Date();
  respond.render('present_time.ejs',{data : time});
});


/*1. 글 작성페이지에서 글써서 서버로 전송*/
app.get('/write',function(require,respond){
  respond.render('write.ejs');
});

/* 2 서버에서 글을 출력해보고 검사 */
app.post('/add',async function(require,respond){
  let save = require.body
  console.log(save);
  /* 3.글을 db에 저장 + 예외처리*/

  
  try{
    if(save.title == '' || save.content==''){
      respond.send('입력이 안됨');
    }else{
      await db.collection('post').insertOne({title :save.title, content:save.content});
      respond.redirect('/list');
    }
  }catch(e){
    console.log(e); // 에러 메세지 출력
    respond.status(500).send('server error');
  }
})


/*상세 페이지 API */

app.get('/detail/:id', async function(require,respond){
  try{
  //console.log(require.params.aaaa)
    let result = await db.collection('post').findOne({ _id : new ObjectId(require.params.id)})
    //console.log(result);
    if(result == null){
      respond.status(404).send('이상한 url');
    }
    else respond.render('detail.ejs',{post : result});
  }catch(e){
    console.log(e);
    respond.status(404).send('server error');
  }
  

});

app.get('/edit/:id', async function(require,respond){

  //db.collection('post').updateOne({id:1},{$set : {revised document}})
  //console.log(require.body);
  let edit_id = require.params.id;
  let result = await db.collection('post').findOne({ _id : new ObjectId(edit_id)});
  
  respond.render('edit.ejs',{result : result});
  
});
//revise 

app.put('/revise', async function(require,respond){


  // await db.collection('post').updateOne({_id : 1},
  //       {$inc : {like:1}});


  try{
      let result = await db.collection('post').updateOne({_id : new ObjectId(require.body.id)},
        {$set : {title : require.body.title, content : require.body.content}});
      //console.log(result);
      respond.redirect('/list');
  }catch(e){
    console.log(e);
  }
  
});

app.post('/abc', async function(require,respond){
  //console.log(1);
  let result = require.body;
  console.log(result.id);

  await db.collection('post').deleteOne({_id : new ObjectId(result.id)});

})
    
