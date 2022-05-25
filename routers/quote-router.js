const { ObjectId } = require("bson");
const express = require("express");
const router = express.Router();

router.get("/", getAllQuotes, sendAllQuotes);
router.get("/author", findAuthor);

function findAuthor(req, res, next) {
    let db = req.app.locals.db;
    let author = req.query.author;

    if (!author) {
        res.redirect("/api/quotes");
    }

    if (author) {
        
        db.collection("quotes").find({a: author}).toArray(function(err, results) {
            
            if (err) throw err;
            
            else if (!err && results.length > 0) {
                res.json(results);
            }
            else if (!err && results.length == 0) {
                res.json({error: "Author not found"})
            }
            
        })
    }
    
}

function getAllQuotes(req, res, next) {
    let db = req.app.locals.db;
    
    db.collection("quotes").find({}).toArray(function(err, results) {
        if (err) {
            console.log("Error: " + err);
        }
        if (results.length == 0) {
            return res.status(404).send("No quotes found in database");
        }
        
        req.quotes = results;
        next();
        
    })

}

function sendAllQuotes(req, res, next) {
    let quotes = req.quotes;
    // let stringQuotes = JSON.stringify(quotes);
    res.json(quotes);
    
}


module.exports = router;