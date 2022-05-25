const pug = require("pug");
const path = require("path");
const express = require('express');
const dotenv = require("dotenv");
dotenv.config();
var XMLHttpRequest = require('xhr2');
const fs = require('fs')
var req = new XMLHttpRequest();
const mc = require("mongodb").MongoClient;
let app = express();
app.locals.db = {};
let db;
const quotesRouter = require("./routers/quote-router");
const url = "https://zenquotes.io/api/quotes/";
const cors = require("cors");

app.use(cors({
    origin: ["https://localhost:3000", "http://localhost:3000"]
}))

app.use(express.json()); // parse JSON in request
// app.use(express.static(path.join(__dirname, "/public"))); // serve static files
app.set("views", path.join(__dirname, "views")); // set views folder
app.set("view engine", "pug");

app.use("/api/quotes", quotesRouter);

app.get("/api/authors", getAuthors);
app.get("/api/generateNewQuotes", getNewQuotes);


mc.connect(process.env.MONGO_URI, function(err, client) {
	if (err) {
		console.log("Error in connecting to database");
		console.log(err);
		return;
	}
	
	//Get the database and save it to a variable
	db = client.db("quotes");
    app.locals.db = db;
    console.log("Connected to database: quotes");

	
	//Only start listening now, when we know the database is available
	app.listen(process.env.PORT || 3000);
    console.log(`Server listening on port ${process.env.PORT}`);

    
})

function randomNum(max) {
    return Math.random() * max;
}

function getAuthors(request, res, next) {
    const authors = new Set();

   let quotes =  db.collection("quotes").find({}).toArray(function(err, results) {
    
       results.forEach(quote => { authors.add(quote.a)})
    
    res.json(Array.from(authors));
   })

   
}

function insertQuote(obj) {
    db.collection("quotes").findOne({q: obj.q}, function(err, res) {
        if (err) throw err;
        if (!err && res) {
            console.log("Found");
        }
        if (!err && !res) {
            db.collection("quotes").insertOne(obj, function(error, newQuote) {
                if (error) throw error;
                console.log("Just inserted: " + newQuote);
            })
        }
        
    })
    
}

function getNewQuotes(request, res, next) {
    let req = new XMLHttpRequest();
    // req.withCredentials = true;
    req.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let response = JSON.parse(req.responseText);
            
            response.forEach(quote => {
                insertQuote(quote);
            })
            const file = fs.createWriteStream("quotes.txt");
            file.on("error", function(err) { throw err; })
            response.forEach(function(quote) {
                file.write(quote.q + "\n"
                           + quote.a + "\n\n");
            })
            file.end();
            res.json(response);
        }
    }
    req.open("GET", url, true);
    req.setRequestHeader("Accept", "application/json");
    req.send();
}