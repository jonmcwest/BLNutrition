const express = require('express') ;
const bodyParser = require('body-parser');
const app = express();
const mongo = require('mongodb');
const mongoose= require('mongoose');

app.set('view engine', 'ejs');
app.use(express.static('public'));
 app.use(bodyParser.urlencoded({
    extended: true
  }));


//start of database functions

mongoose.connect('mongodb://localhost:27017/BLnutrition', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log('Database connection open')
})
.catch(err => {
    console.log('Whoopsie Database connection failed')
    console.log(err);
})

const postSchema = new mongoose.Schema({
    title: String,
    body: String,
})

const Post = mongoose.model('Post', postSchema);

app.route('/newpost')
    .get(function(req,res){
        res.render('newpost')
    })
    .post((req, res) => {
       const newPost = new Post({title: req.body.postTitle, body: req.body.postBody});
       newPost.save();
       console.log('saved the following post:' + newPost);
       res.redirect('/dashboard');
    });

app.route('/dashboard')
    .get((req,res) => {
        res.render('dashboard');
    })


app.route('/dynablog')
    .get((req,res) => {
        const posts = Post.find({}, (err, posts) => {
            if (err) {
                console.log(err);
            } else {
                if (posts) {
                    res.render("dynablog", {posts:posts});
                }
            }
        });
    })

//end of database functions

app.get('/', function(req, res){
    res.render("index");
});

app.get("/about", function(req, res){
    res.render("about");
});

app.get("/blog", function(req, res){
    res.render('blog');
});

app.get("/posts/peanutsatay", function(req, res){
    res.render('posts/peanutsatay');
});
app.get("/posts/findinghappiness", function(req, res){
    res.render('posts/findinghappiness');
});
app.get("/posts/gingerbreadoats", function(req, res){
    res.render('posts/gingerbreadoats');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});