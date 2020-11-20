require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const multer = require('multer');
const { storage } = require('./cloudinary/index')
const upload = multer({ storage })

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));


//start of database functions

mongoose.connect('mongodb://localhost:27017/BLnutrition', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
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
    date: String,
    image: {
        url: String,
        filename: String
    }
})

const Post = mongoose.model('Post', postSchema);

app.route('/newpost')
    .get(function(req, res) {
        res.render('newpost')
    })
    .post(upload.single('image'), (req, res) => {
        const d = new Date();
        const year = d.getFullYear();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = months[d.getMonth()];
        const date = `${month} ${year}`
        const file = req.file;
        const newPost = new Post({
            title: req.body.postTitle,
            body: req.body.postBody,
            date: date,
            image: {
                url: file.path,
                filename: file.filename
            }
        });
        newPost.save();
        console.log('saved the following post:' + newPost);
        res.redirect('/dashboard');
    });

app.route('/dashboard')
    .get((req, res) => {
        res.render('dashboard');
    })


app.route('/dynablog')
    .get((req, res) => {
        const posts = Post.find({}, (err, posts) => {
            if (err) {
                console.log(err);
            } else {
                if (posts) {
                    res.render("dynablog", {
                        posts: posts.reverse()
                    });
                }
            }
        });
    })

app.route('/blog/posts/:id')
    .get((req, res) => {
        const id = req.params.id;
        Post.findOne({
            _id: id
        }, function(err, foundPost) {
            if (!err) {
                if (!foundPost) {
                    res.send('no post exists');
                } else {
                    res.render("post", {
                        title: foundPost.title,
                        body: foundPost.body,
                        url: foundPost.image.url
                    });
                }
            }
        });
    });

//end of database functions

app.get('/', function(req, res) {
    res.render("index");
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/blog", function(req, res) {
    res.render('blog');
});

app.get("/posts/peanutsatay", function(req, res) {
    res.render('posts/peanutsatay');
});
app.get("/posts/findinghappiness", function(req, res) {
    res.render('posts/findinghappiness');
});
app.get("/posts/gingerbreadoats", function(req, res) {
    res.render('posts/gingerbreadoats');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});