require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
<<<<<<< HEAD
var productRouter=require('./routes/products')
=======
var productsRouter = require('./routes/products');
var listsRouter = require('./routes/lists');

>>>>>>> 6aff88dce3c7a645889e09db73b1a06031fc8e10
var app = express();

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
<<<<<<< HEAD
app.use('/products',productRouter);
=======
app.use('/products', productsRouter);
app.use('/lists', listsRouter);

>>>>>>> 6aff88dce3c7a645889e09db73b1a06031fc8e10
module.exports = app;
