require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const validUrl = require('valid-url');
const url = require('url')


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err) {
    console.log(err)
  } else {
    console.log('Connection to Database Successful')
  }
})


const schema = mongoose.Schema({
  url: String,
  short_url: String
})

const Model = mongoose.model('URL', schema)

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.json())

app.use(express.urlencoded({ extended: false}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

var ID = function () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 9 (numbers + letters), and grab 4 characters from the 3rd index
  return Math.random().toString(9).substr(3, 4);
};

//POST /api/shorturl/new
app.post('/api/shorturl', (req,res) => {
  console.log(req.body)
  //console.log(req.body.URL)
  let short_url = ID()
  let bodyurl = req.body.url
  if (validUrl.isWebUri(bodyurl)){
    let URL = url.URL
    let urlObject = new URL(bodyurl)
    //console.log(urlObject.hostname)
    dns.lookup(urlObject.hostname, (err, address, family) => {
      if(err){
        res.json({ 
          error: 'invalid url'
        })
      } else{
        //Check if link exists in db
        console.log(address) //Check addresss
        Model.findOne({url: bodyurl}, (err, URLfound) => {
          if (err) {
            console.log(err)
            res.json({"error": "Error Processing Data"})
          } else {
            if(URLfound == null) {
              const response = new Model({
                url: bodyurl,
                short_url: short_url
              })
              response.save((err, doc) =>{
                if (err) {
                  console.log('Not Saved Successfully')
                } else {
                  console.log('Saved Successfully')
                  res.json({
                    original_url: bodyurl,
                    short_url: short_url
                  })
                }
              })
            } else {
              res.json({
                original_url : URLfound.url,
                short_url : URLfound["short_url"]
              })
            }
          }
        })
      }
    })
  }else {
    res.json({ 
      error: 'invalid url'
    })
  }
})

  //TO DO:
  //1. Check if shorturl parameter matches any in database
  //2. If present, redirect to original url
  //3. Invalid {"error":"No short URL found for the given input"}
app.get('/api/shorturl/:short_url', (req, res) => {
  console.log("Get request here")
  console.log(req.params)
  Model.findOne({short_url: req.params.short_url}, (err, URLfound) => {
    if (err) {
      res.json({"error": "No short URL found for the given input"})
    } else {
      if (URLfound == null) {
        res.json({"error": "No short URL found for the given input"})
      } else {
        res.redirect(URLfound.url)
      }
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

