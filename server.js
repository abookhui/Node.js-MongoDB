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



app.use('/',require('./routers/postAction.js'));
/*상세 페이지 API */
// app.get('/detail/:id',async (req,res)=>{
//     try{
//     let result = await db.collection('post').findOne({_id : new ObjectId(req.params)});
//         //console.log(result);
//         res.render('detail.ejs',{post : result});
//     }catch(e){
//         console.log(e);
//         res.status(400).send('error')
//     }
    
// })

// app.post('/add',async (req,res)=>{
//     let result = req.body;

//     try{
//         if(result.title == '' || result.content == ''){
//             res.send('입력이 안됨');
//         }
//         else {
//             await db.collection('post').insertOne({title : result.title, content : result.content})
//             res.redirect('/list');
//         }
        
//     }catch(e){
//         console.log(e);
//         res.status(500).send('server error');
//     }
// })

// app.get('/edit/:id', async (req,res)=>{
//     try{
//         let result = await db.collection('post').findOne({_id : new ObjectId(req.params.id)});
    
//     res.render('edit.ejs',{result : result});
//     }catch(e){
//         console.log(e);
//     }
    
// })

// app.put('/revise',async (req,res) => {
//     let result = req.body;
//     console.log(result);
//     try{
//         if(result.title == '' || result.content == ''){
//                 res.send("<script>alert('제목 또는 내용이 빈칸입니다.');</script>");
//                 //res.redirect('/list');
//             }
//         else{
//             await db.collection('post').updateOne({_id : new ObjectId(result.id)},
//             {$set:{
//                 title : result.title,
//                 content : result.content
//             }});
//             res.redirect('/list');
//         }
//     }catch(e){
//         console.log(e);
//     }
    
// });

// app.get('/list' ,async (req,res)=>{
//     let result = await db.collection('post').find().toArray();
//     //console.log(result);
//     res.render('list.ejs' , {post : result});
// });

// app.get('/list/next/:id', async (req,res)=>{
//     try{
//         let result = await db.collection('post')
//             .find({_id : {$gte :new ObjectId(req.params.id)}})
//             .limit(4).toArray();

//         res.render('list.ejs',{post:result});
//     }catch(e){
//         console.log(e);
//     }
    
// });

// app.get('/list/previous/:id', async (req,res)=>{
//     try{
//         let result = await db.collection('post')
//             .find({_id : {$lte :new ObjectId(req.params.id)}})
//             .limit(4).toArray();

//         res.render('list.ejs',{post:result});
//     }catch(e){
//         console.log(e);
//     }
    
// });

// app.post('/delete',async (req,res) =>{
//     try{
//         let result = req.body;
//         //console.log(result);
//         await db.collection('post').deleteOne({_id : new ObjectId(result.id)});
//         res.redirect('/list');
//     }catch(e){
//         console.log(e);
//     }
   
// })

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


// app.get('/write',CheckLogin,async (req,res)=>{
//     try{
//         let ans =req.user;

//         if(ans != null){ 
//             res.render('write.ejs');
//         }
 
//     }catch(e){
//         console.log(e);
//     }
    
    
 
// })


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
        //console.log(error);
        //console.log(user);
        //console.log(info);
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

app.use('/shop',require('./routers/shop.js'));

// app.get('/list/search',async (req,res)=>{
//     console.log(req.body);
//     res.render('search.ejs');
// })

app.post('/list/search',async (req,res)=>{
    
    try{
       let ans = req.body;
        //console.log(req.body); 
        let result = await db.collection('post')
        .find({title : {$regex : ans.search_result}}).toArray();
        
        result[0].ans = ans.search_result;
        //console.log(result);
        res.render('search.ejs',{post:result});
    }catch(e){
        console.log(e);
    }
    
   
    
})