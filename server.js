const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)
	.then(
		() => {
			console.log("mongo opened:", process.env.MONGO_URI)
		},
		err => {
			console.error("### error starting mongo:", process.env.MONGO_URI)
			console.error(err)
		}
	)

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});



//Creates a URL model or Schema for the Users.
const userSchema = new mongoose.Schema({
	_id: String,
	username: { type: String, required: true }
});

var User = mongoose.model('User', userSchema);


//Creates a URL model or Schema for the Exercise logs.
const exerciseSchema = new mongoose.Schema({
	log:[{
	  description: { type: String, required: true },
	  duration: { type: Number, required: true },
	  date: { type: Date },
	}]
});

var Exercise = mongoose.model('Exercise', userSchema);



// your first API endpoint... 
app.get("/api/hello", function(req, res) {
	res.json({ greeting: 'hello API' });
});



app.post("/api/exercise/new-user", function(req, res) {
	let user_name = req.body.username; //Gets the user_name from the body of the page.

	if (!user_name) { //User input is blank.
		res.json('Path `username` is required.');
	}

	findUserByName(user_name, function(err, data) { //Checks if input user_name is in database already.
		if (err) {
			res.json(err);
		}

		if (data != null) { //If not null then user_name is in database already.
			res.json('Username already taken.');
			//res.json({"duplicate":"I think there;s a dup!", "Error":err, "Data":data, "Database":"No!"});
		} else { //Else is null so user_name is not in database.
			//res.json({"username":user_name, "Error":err, "Data":data.randomID, "Database":"Submitted!"});

			createAndSaveUser(user_name, function(err, data) { //Creates and saves new user to database.
				if (err) {
					res.json(err);
				}
				res.json({ "username": user_name, "_id": data });
			});
		}
	});
});



//Outputs a list of all Users.
app.get("/api/exercise/users", function(req, res) {
    User.find({}, function(err, users) {
        res.send(users.reduce(function(userMap, item) {
            userMap[item.id] = item;
            return userMap;
        }, {}));
    });
});





//Adds a new Exercise Log.
app.post("/api/exercise/add", function(req, res) {
  let log = {user_id:req.body.userId, desc:req.body.description, dur:req.body.duration}; //Gets the user_id, description, and duration from the body of the page.
  
  
  
  
  
  
  /*
  let user_id = req.body.userId; //Gets the user_id from the body of the page.
  let desc = req.body.description; //Gets the description.
  let dur = req.body.duration; //Gets the duration.
  
  */
  


	//if (!user_id) { //User input is blank.
	//	res.json('Path `username` is required.');
	//}
  
  findUserById(log.user_id, function(err, data) { //Checks if user input is in database already as user_id.
		if (err) {
			res.json(err);
		} 
    
  if (data == null) { //If null then user_id is not in database.
    res.json('unknown _id');
  } else { //Else not null then user_id is in database.
  
  //Get user_name
  
  
  if (!log.desc) { //Input description is blank.
		res.json('Path `description` is required.');
	}
  
  if (!log.dur) { //Input duration is blank.
		res.json('Path `duration` is required.');
	}
    
    
    
    
  //Check if date is valid
    
      //let date = req.body.date; //Gets the date.
  let date = 555555555; //Gets the date.
    log = {date:date}
    
  
  //Added to database
    
    
//    createAndSaveLog(log, function(err, data) { //Creates and saves new user to database.
//				if (err) {
//					res.json(err);
//				}
				//res.json({ "username": log.user_name, "_id": data });
  
  
  //res.json({ "user_id": user_id, "result:":"IT worked!"});
    res.json ({ "username":"wolf","description":log.desc,"duration":log.dur,"_id":log.user_id,"date":date });
//  });
		}
	});
});











var findUserByName = function(userName, done) { //Check the database if userName exists.
	User.findOne({ username: userName }, (err, data) => {
		if (err) {
			done(err);
		}
		done(null, data);
	})
};


var findUserById = function(userId, done) { //Check the database if userId exists.
	User.findOne({ _id: userId }, (err, data) => {
		if (err) {
			done(err);
		}
		done(null, data);
	})
};



var createAndSaveUser = function(userName, done) { //Adds a new user to the database.
	var randomID = makeid();

	var newUser = new User({ _id: randomID, username: userName });

	newUser.save(function(err, data) {
		if (err) return done(err)
		return done(null, randomID);
	});
}

function makeid() { //Creates a random 9-digit string for user_id.
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 9; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}




var createAndSaveLog = function(log, done) { //Adds a new exercise log to the database.

	var exerciseLog = new Exercise({ _id: log.userId, log:[{
	                                                description: log.desc,
	  duration: log.dura,
	  date: log.date,
	}] });

	exerciseLog.save(function(err, data) {
		if (err) return done(err)
		return done(null);
	});
}



// Not found middleware
app.use((req, res, next) => {
	return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
	let errCode, errMessage

	if (err.errors) {
		// mongoose validation error
		errCode = 400 // bad request
		const keys = Object.keys(err.errors)
		// report the first validation error
		errMessage = err.errors[keys[0]].message
	} else {
		// generic or custom error
		errCode = err.status || 500
		errMessage = err.message || 'Internal Server Error'
	}
	res.status(errCode).type('txt')
		.send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})