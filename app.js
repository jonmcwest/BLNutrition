


const express = require('express') 
const bodyParser = require('body-parser')





const app = express();


app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));



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




app.listen(3000, function(){
    console.log('listening 3000');
})