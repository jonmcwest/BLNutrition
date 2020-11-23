require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongo = require('mongodb');
const mongoose = require('mongoose');
const multer = require('multer');
const {
    storage
} = require('./cloudinary/index');
const upload = multer({
    storage
});
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const marked = require('marked');
const slugify = require('slugify');
const createDomPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurifier( new JSDOM().window);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000
    }
}));

app.use(passport.initialize());
app.use(passport.session());




//start of database functions

mongoose.connect('mongodb://localhost:27017/BLnutrition', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => {
        console.log('Database connection open')
    })
    .catch(err => {
        console.log('Whoopsie Database connection failed')
        console.log(err);
    })

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    secret: String
})

UserSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

const postSchema = new mongoose.Schema({
    title: String,
    markdown: String,
    date: String,
    image: {
        url: String,
        filename: String
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    sanitizedHtml: {
        type: String,
        required: true
    }
})

postSchema.pre('validate', function(next) {
    if (this.title) {
      this.slug = slugify(this.title, { lower: true, strict: true })
    }
  
    if (this.markdown) {
      this.sanitizedHtml = dompurify.sanitize(marked(this.markdown))
    }
  
    next()
  })

const Post = mongoose.model('Post', postSchema);



app.route("/register")

    .get(function (req, res) {

        res.render("register");

    })

    .post(function (req, res) {
        console.log('registration submitted');
        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/newpost");
                });
            }
        })
    });


app.route('/newpost')
    .get(function (req, res) {
        if (req.isAuthenticated()) {
            res.render("newpost");
        } else {
            res.redirect("/login");
        }
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
            markdown: req.body.postBody,
            date: date,
            image: {
                url: file.path,
                filename: file.filename
            }
        });
        newPost.save();
        console.log('saved the following post:' + newPost);
        res.redirect('/login');
    });


app.route('/edit/:id')
    .get(async (req, res) => {
        if (req.isAuthenticated()) {
            const post = await Post.findById(req.params.id);
            res.render('update', {
                post: post
            });
        } else {
            res.redirect("/login");
        }
    });


app.route('/edit/:id')
    .post(upload.single('image'), (req, res) => {

        const file = req.file;
        const editPost = {
            title: req.body.postTitle,
            markdown: req.body.postBody,
            image: {
                url: file.path,
                filename: file.filename
            }
        };
        Post.findByIdAndUpdate(req.params.id, {
            $set: editPost
        }, (err, post) => {

            if (err) {
                console.log(err)
            }

            console.log('success');
            res.redirect('/adminblog');

        });

    });




app.route("/login")

    .get(function (req, res) {
        res.render("login");
    })

    .post(function (req, res) {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
                res.redirect("/login")
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/dashboard");
                });
            }
        })

    });

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/adminblog", function (req, res) {
    if (req.isAuthenticated()) {
        const posts = Post.find({}, (err, posts) => {
            if (err) {
                console.log(err);
            } else {
                if (posts) {
                    res.render("adminblog", {
                        posts: posts.reverse()
                    });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const checkedItemTitle = req.body.title;

    Post.findByIdAndRemove(checkedItemId, function (err) {
        if (!err) {
            console.log("Successfully deleted checked item.");
            res.redirect("/adminblog");
        }
    });
});



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

app.route('/blog/posts/:slug')
    .get((req, res) => {
        Post.findOne({
            slug: req.params.slug
        }, function (err, foundPost) {
            if (!err) {
                if (!foundPost) {
                    res.send('no post exists');
                } else {
                    res.render("post", {
                        title: foundPost.title,
                        sanitizedHtml: foundPost.sanitizedHtml,
                        url: foundPost.image.url,
                    });
                }
            }
        });
    });


app.get("/dashboard", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("dashboard");
    } else {
        res.redirect("/login");
    }
});

//end of database functions

app.get('/', function (req, res) {
    res.render("index");
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.get("/blog", function (req, res) {
    res.render('blog');
});

app.get("/posts/peanutsatay", function (req, res) {
    res.render('posts/peanutsatay');
});
app.get("/posts/findinghappiness", function (req, res) {
    res.render('posts/findinghappiness');
});
app.get("/posts/gingerbreadoats", function (req, res) {
    res.render('posts/gingerbreadoats');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});