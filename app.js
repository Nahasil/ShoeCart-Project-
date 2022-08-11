const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config({ path: '.env' })

const Swal = require('sweetalert2')
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const hbs=require('express-handlebars')
const app = express();
const fileUpload=require('express-fileupload')
const db=require('./config/connection')
const session=require('express-session')
const crypto=require('crypto')

const Grid=require('gridFs-Stream')
const methodOverride=require('method-override')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/',
helpers:{
  inc:(value,opt)=>{
    return parseInt(value)+1;
  }
}
})
)
app.use(methodOverride('_method'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:'key',
cookie:{maxAge:600000},
resave:false,
saveUninitialized:false
}))
db.connect((err)=>{
    if(err) console.log('database connection error')

    else console.log('Database connect')
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page

  res.status(err.status || 500);
  if(req.session.admin){
    res.render('error',{admin:true});
  }else{
    res.render('error');
  }
 
});

module.exports = app;
