const express = require('express')
const app = express() // express library 사용

app.use(express.static(__dirname + '/public')); // 폴더 등록해주기
app.set('view engine', 'ejs');

const {MongoClient}  = require('mongodb');

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

