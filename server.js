const express = require('express'); // install express
const app = express();  // express library
const { MongoClient ,ObjectId} = require('mongodb'); // install mongodb@5 ObjectId 사용
const e = require('express');
const { escapeXML } = require('ejs');
const methodOverride = require('method-override'); // install override-method PUT , DELETE 사용 
const bcrypt = require('bcrypt'); // bcrypt , hashing algorithm  
const MongoStore = require('connect-mongo');  // session에 저장
require('dotenv').config() 

app.set('view engine', 'ejs');  // install ejs
app.use(methodOverride('_method')); // install override-method
app.use(express.static(__dirname + '/public')); // 폴더 등록해주기


const bodyParser = require('body-parser')
//app.use(express.json()); // require.body 사용시 필요
app.use(bodyParser.json());
 

app.use(express.urlencoded({extended:true})); 



const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local');
const { connect } = require('./routers/shop.js');

app.use(passport.initialize())

app.use(session({
  secret: process.env.SECRET,  // 암호화에 쓸 비번
  resave : false,          // 유저가 서버로 요청할 때마다 세션 갱신할건지
  saveUninitialized : false, // 로그인을 안해도 세션 만들건지
  cookie : {maxAge : 60 * 60 * 1000}, // session 유효기간 1시간으로 설정함
  
  store : MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName : 'forum'
  })
}))

app.use(passport.session()) 

app.use('/mypage',CheckLogin) // 이 밑 코드는 모두다 미들웨어 전부 적용 / 제한사항

let connectDB = require('./database.js');

let db;
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
    app.listen(process.env.PORT,function(){
        console.log('http://localhost:8080 에서 서버 실행중');
    });

}).catch((err)=>{
  console.log(err)
});

function CheckLogin(req,res,next){

    if(!req.user){
        res.send('로그인 하세요.');  // 응답해 버리면 이 밑 코드 실행 안됨
    }
    else next() // middleware 코드 실행 끝났으니 다음 코드 실행하시오 
}



app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
})





passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
    // 제출한 아이디/비번 db에 있는지 검사하는 코드

    try{
        let result = await db.collection('user').findOne({ username : 입력한아이디})
            if (!result) { // 결과 없음
                return cb(null, false, { message: '아이디 DB에 없음' }) // 회원 인증 실패 false
            }

            
            if (await bcrypt.compare(입력한비번,result.password)) { // 아이디 있고 비번 확인  // hash 된거 확인
                return cb(null, result)
            } else {
                return cb(null, false, { message: '비번불일치' });
            }
    }catch(e){
        console.log(e);
    }


}))
  
passport.serializeUser((user,done) =>{  // section 데이터 작성중
    console.log(user)
    process.nextTick(function(){  // 비동기적으로 실행시킬때
        done(null,{ id : user._id ,username : user.username})
    })
})
passport.deserializeUser(async (user,done)=>{  // 쿠키 분석해줌
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)});
    delete result.password;
    process.nextTick(()=>{
        done(null,{result}); //쿠키 까봐서 session 데이터와 비교
    })
})




function LoginCondition(req,res,next){
    let result = req.body;
    
    if(result.username==''||result.password == ''){
        res.send('입력을 안함');
    }
    
    else next();
}

app.get('/login',async (req,res) =>{
   try{
        let ans=req.user;
        console.log(ans);
        if(ans==null){
            res.render('login.ejs',);
        }
        else{
            res.send('이미 로그인 되어있습니다.');
        }
   }catch(e){
    console.log(e);
   }
})

app.post('/login',LoginCondition,async (req,res, next) =>{
    
    passport.authenticate('local',function(error, user, info){ //오류 성공 실패

        if(error) return res.status(500).json(error);
        if(!user) return  res.status(401).json(info.message);
        req.logIn(user,function(err){
            if(err) return next(err);
            res.redirect('/');
        })

    })(req,res,next);

})

app.get('/mypage',CheckLogin,async (req,res)=>{
    try{
        let ans =req.user;
        //console.log(result==null);

        if(ans!=null){ // 로그인 안됨
            res.render('mypage.ejs',{result: ans.result});
        }

    }catch(e){
        console.log(e);
    }
})

app.get('/register',(req,res)=>{
    res.render('register.ejs')
})

app.post('/register',LoginCondition,async (req,res)=>{
    let result = req.body;
    let hash = await bcrypt.hash(result.password,10); // num : 얼마나 꼬아주느지
    //console.log(hash);
    //console.log(result);
    
    try{
        
        let cmp = await db.collection('user').findOne({username : result.username}); // 없으면 null
    
        if(cmp != null){
            res.send('아이디 중복 다시 입력.');
        }

        else if(result.check !== result.password){
            res.send('비밀번호가 다름');
        }
        else if(result.password.length <= 6){
            res.send('비밀번호가 6이하입니다.');
        }
        else {
            await db.collection('user').insertOne({
                username : result.username,
                password : hash
            });
            res.redirect('/');
        }
    }catch(e){
        console.log(e);
    }
    
})

//app.use('/shop',require('./routers/shop.js'));
app.use('/',CheckLogin,require('./routers/postAction.js'));


app.post('/list/search',async (req,res)=>{
    
    try{
       let ans = req.body;
        let 검색조건 = [
            {$search : {
              index : 'title_index',
              text : { query : ans.val, path : 'title' }
            }},
            {$sort : {_id : 1}},
            
          ]
        let result = await db.collection('post')
        .aggregate(검색조건).toArray();

        //console.log(result == '');

        res.render('search.ejs',{post:result});

          // js query 이용
    //    let ans = req.query.val;
    //     // let result = await db.collection('post')
    //     // .find({title : {$regex : ans}}).toArray();
    //     // console.log(ans); 
    //      let result = await db.collection('post')
    //      .find( { $text : { $search: '제목' } } ).toArray();
    //      console.log(ans);
    //     console.log(result);
    }catch(e){
        console.log(e);
    }
})
