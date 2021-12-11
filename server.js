const express = require('express')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
require('dotenv').config();


app.use(cors(), function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.use(express.urlencoded({extended:false}));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

mongoose.connect('mongodb+srv://new_user:123wdc@cluster0.rr3ri.mongodb.net/freecode?retryWrites=true&w=majority',{ useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, required: true}
});
const userSchema = new mongoose.Schema({
  username: {type:String, required: [true, 'username required']},
  log: [exerciseSchema]
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);
 
//create a schema and model for users, then add
//to db and make sure 
//response includes _id
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
/*
You can POST to /api/users with form data username to create a new user. The returned response will be an object with username and _id properties.
*/

app.post('/api/users', bodyParser.urlencoded({extended:false}), (req, res) => {
  console.log("got this far")

  //checks form input before trying to save data
  if(req.body.username != '') {
    const newUser = new User({
      username:req.body.username
    });
  
  //saves the User to the db and returns the username id properties as json with the response
    newUser.save((err, savedUser) => {    
      if (err) {
        return console.error(err);
      }
      console.log(savedUser)
      console.log("saved");
      res.json({
        username: savedUser.username,
        _id: savedUser._id
      })
    });
  }
  else {
    res.send("Username is required. Reload form and enter username in appropriate field.");
  }

  app.get('/api/users', (req, res) => {
    User.find({}, (error, array) => {
      if (error) {
        return console.error(error);
      }
      res.json(array);
    })
  })

  app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended:false}), (req, res) => {
    console.log(req.params._id);
    if(req.params._id != '') {
      let session = new Exercise({
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: new Date(req.body.date).toDateString()
      })
      
      if(session.date === '') {
        session.date = new Date().toISOString().substring(0, 10)
        console.log(session.date)
      }

      User.findByIdAndUpdate(req.params._id,{$push : {log: session}},{new: true},(err, updatedUser) => {
        console.log(req.params);
        console.log(updatedUser);
        if(updatedUser != undefined) {
          if(err) {
          return console.log(error);
          }
          console.log('User updated; session added');
          console.log(updatedUser.username);
          res.json({
            _id: req.params._id,
            username: updatedUser.username,
            description: session.description,
            duration: session.duration,
            date: session.date//new Date(session.date).toDateString()
          })
        }
        else {
          console.log("No such user Id.")
          res.send("No such user Id. Check your input.")
        }
      })
    }
    else {
      console.log("Id is required.")
      res.send("Id is required.");
    }
  })

  app.get('/api/users/:_id/logs', (req, res) => {
    console.log("line 127 inside get(/api/users/:_id/logs)")
    User.findById(req.params._id, (err, result) => {
      if(err) {
        return console.error(error)
      }
      
      const exerciseCount = result.log.length;
      for(each in result.log) {
        if(result.log[each].date == 'Invalid Date') {
          result.log[each].date = new Date().toDateString();
        }
      }
      console.log(result.log)
      console.log(req.query);

      console.log(Object.keys(req.query).length != 0);//use this to determine if query is there
      //if query is not empty convert query date format and log date format to Date object for comparison. toDateString() does not work for comparison purposes
      if(Object.keys(req.query).length != 0) {
        const from = new Date(req.query['from']);
        const to = new Date(req.query['to']);
        //try sub below
        let fromLog = new Date(result.log[0].date);
        let resLog = [];

        if(req.query.hasOwnProperty('limit')) {
          for(each in result.log) {
            if(each < req.query['limit']) {
              resLog.push(result.log[each]);
            }
          }
        }

        if(req.query.hasOwnProperty('from')) {
          for(each in result.log) {
            console.log(result.log.length);
            console.log(each)
            fromLog = new Date(result.log[each].date);
            if(from < fromLog && to > fromLog) {
              console.log("include this log");
              resLog.push(result.log[each]);
              console.log(result.log);//two logs
              console.log(resLog);//one log
            }          
          }
        }

        result.log = resLog;
        //remove logs below
        console.log(result.log);
        console.log('type of from:') 
        console.log(typeof(from))
        console.log(typeof(req.query['from']))
        console.log(from + ' until ' + to)
        console.log(from < fromLog);
        console.log('from is less than log date');
        console.log(to > fromLog);
        console.log('to is more than log date');
      }

      res.json({"username": result.username, "count": exerciseCount, "_id": result._id, "log": result.log})
    }) 
  })

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


