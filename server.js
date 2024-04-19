const express = require('express')
const app = express() // express library 사용

app.listen(8080, () => { // port 번호  // port 오픈하는 코드
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/', (요청, 응답) => {  // main page 에 접속시 
  응답.sendFile(__dirname + '/index.html'); // __dirname현재 프로젝트 절대 경로
});

app.get('/news',function(require,respond){
  respond.send("it's rainning")
});

app.get('/about',function(require,respond){
  respond.sendFile(__dirname + '/about.html');

});

