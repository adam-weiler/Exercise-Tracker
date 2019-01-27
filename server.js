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
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))

app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});


//Creates a URL model or Schema for the Users.
const userSchema = new mongoose.Schema({
	_id: String,
	username: {
		type: String,
		required: true,
		unique: true
	},
	log: {
		type: Array,
		required: true,
		unique: false
	},
});

var User = mongoose.model('User', userSchema);

//Creates a URL model or Schema for the Exercise logs.
const exerciseSchema = new mongoose.Schema({
	log: {
		description: {
			type: String,
			required: true
		},
		duration: {
			type: Number,
			required: true
		},
		date: {
			type: Date
		},
	}
});

var Exercise = mongoose.model('Exercise', userSchema);


// your first API endpoint... 
app.get("/api/hello", function(req, res) {
	res.json({
		greeting: 'hello API'
	});
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
			console.log('Username already taken.');
			res.json('Username already taken.');
		} else { //Else is null so user_name is not in database.
			console.log('This username is not taken.');

			createAndSaveUser(user_name, function(err, data) { //Creates and saves new user to database.
				if (err) {
					console.log("Error saving new username to database.");
					res.json(err);
				}
				console.log("New username saved to database.");
				res.json({
					"username": user_name,
					"_id": data
				});
			});
		}
	});
});


//Outputs a list of all Users.
app.get("/api/exercise/users", function(req, res) {
	// User.find({}, function(err, users) {
	// 	res.send(users.reduce(function(userMap, item) {
	// 		userMap[item.id] = item;
	// 		return userMap;
	// 	}, {}));
	// });

	findAllUsers(function(err, users) { //Finds all users in the database.
		if (err) {
			console.log("Error: ", err);
			res.json("Error: ", err);
		} else {
			console.log("Success: ", users);
			res.json(users);
			//res.json(users.map(function(item) { return item["username", "_id"]; }));
		}
	})

	//   User.find({}, function(err, users) {
	//     if (err) {
	// 				console.log("Error: ", err);
	// 				res.json("Error: ", err);
	// 			} else {
	//         console.log("Success: ", users);
	//         //res.json(users);

	//         //res.json(users.map(function(item) { return item["username", "_id"]; }));
	//       }
	// 	});
});


//Adds a new Exercise Log.
app.post("/api/exercise/add", function(req, res) {
	let userInput = {
		user_id: req.body.userId,
		desc: req.body.description,
		dur: req.body.duration,
		date: req.body.date
	}; //Gets the user_id, description, and duration from the body of the page.

	console.log("userInput", userInput);
	console.log("userInput.user_id", userInput.user_id);
	console.log("userInput.desc", userInput.desc);
	console.log("userInput.dur", userInput.dur);

	if (!userInput.desc) { //Input description is blank.
		console.log("No Description entered.");
		res.json('Path `description` is required.');
	} else if (!userInput.dur) { //Input duration is blank.
		console.log("No Duration entered.");
		res.json('Path `duration` is required.');
	} else { //User entered description and duration.
		//if (!user_id) { //User input is blank.
		//	res.json('Path `username` is required.');
		//}

		findUserById(userInput.user_id, function(err, oldDoc) { //Checks if user input is in database already as user_id.
			if (err) {
				console.log("Error: ", err);
				res.json("Error: ", err);
			}

			if (oldDoc == null) { //The user_id is not in database.
				console.log("There is not user with that name in the database.");
				res.json('unknown _id');
			} else { //The user_id is in database.
				console.log("That user exists: ", oldDoc);

				if (!userInput.date) { //User did not enter a date.
					userInput.date = new Date(); //Will use current time.
					userInput.date = userInput.date.toDateString();
					console.log("User did not input date. Use current: ", userInput.date);
				} else if (!isNaN(userInput.date)) { //User input is a number.
					userInput.date = userInput.date * 1000;
					userInput.date = new Date(userInput.date).toDateString();
					console.log("User input a number: ", userInput.date);
				} else { //User entered yyyy-mm-dd or a string.
					//userInput.date = new Date(userInput.date).toDateString(); //Converts user_input to a UTC timestamp.
					userInput.date = new Date(userInput.date).toDateString(); //Converts user_input to a UTC timestamp.
					console.log("User entered yyyy-mm-dd or a string: " + userInput.date);
				}

				//An object that contains any old exercise logs, and adds the current userInput.
				const updatedLog = [...oldDoc.log, {
					description: userInput.desc,
					duration: userInput.dur,
					date: userInput.date
             }];

				console.log("This is the updatedLog: " + updatedLog);

				// createAndSaveLog(userInput, function(err, data) { //Creates and saves new user to database.
				// 	if (err) {
				// 		res.json(err);
				// 	} else {
				// 				res.json({
				// 					"username": userInput.user_name,
				//           "description": userInput.desc,
				//           "duration": userInput.dur,
				//           "_id": userInput.user_id,
				//           "date": userInput.date
				// 				})
				//       }
				//			});

				findAndUpdate(userInput, updatedLog, function(err, data) { //Updates new log to the database.
					if (err) {
						console.log("findAndUpdate error: " + err);
						res.json(err);

					} else {
						console.log("findAndUpdate success: " + err);
						res.json({
							"username": data.username,
							"description": userInput.desc,
							"duration": userInput.dur,
							"_id": userInput.user_id,
							"date": userInput.date
						})
					}
				});

				//    createAndSaveLog(log, function(err, data) { //Creates and saves new user to database.
				//				if (err) {
				//					res.json(err);
				//				}
				//res.json({ "username": log.user_name, "_id": data });

				// res.json({
				// 	"user_id": userInput.user_id,
				// 	"result:": "IT worked!"
				// });
				//res.json ({ "username":"wolf","description":log.desc,"duration":log.dur,"_id":log.user_id,"date":date });
				//  });
			}
		});
	}
});


//Outputs a list of one user's Exercise logs.
app.get('/api/exercise/:param1', function(req, res) {
	//let user_input = req.params.input;
	let user_id = req.query.userId;

	//http://www.google.com/api/exercise/userId?qs1=you&qs2=tube

	//   findUserById(userInput, function(err, oldDoc) { //Checks if user input is in database already as user_id.
	// 			if (err) {
	// 				console.log("Error: ", err);
	// 				res.json("Error: ", err);
	// 			}

	// 			if (oldDoc == null) { //If null then user_id is not in database.
	// 				console.log("oldDoc is null: ", oldDoc);
	// 				res.json('unknown _id');
	// 			} else { //Else not null then user_id is in database.
	//       }
	//   });

	// if (!user_id) { //User input is blank.
	// 	res.send("unknown userId: " + user_id);
	// }


	findUserById(user_id, function(err, oldDoc) { //Checks if user input is in database already as user_id.
		if (err) {
			console.log("Database error: ", err);
			res.json("Database error: ", err);
		}

		if (oldDoc == null) { //The user_id is not in database.
			console.log("There is not user with that name in the database.");
			res.send('unknown userId');
		} else { //The user_id is in database.
			console.log("That user exists: ", oldDoc);

			// countLogsById(user_id, function(err, count) { //Checks if user input is in database already as user_id.
			// if (err) {
			// 	console.log("Database error: ", err);
			// 	res.json("Database error: ", err);
			// }
			//console.log("My count is: ", count);

			res.json({
				_id: oldDoc._id,
				username: oldDoc.username,
				count: oldDoc.log.length,
				log: oldDoc.log
			});
			// })
		}
	})
})


var findUserByName = function(userName, done) { //Check the database if userName exists.
	User.findOne({
		username: userName
	}, (err, data) => {
		console.log(userName);
		if (err) {
			done(err);
		}
		done(null, data);
	})
};


var createAndSaveUser = function(userName, done) { //Adds a new user to the database.
	var randomID = makeid();

	var newUser = new User({
		_id: randomID,
		username: userName
	});

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


var findAllUsers = function(done) { //Return all users in database.
	User.find({}, {
		username: 1,
		_id: 1
	}, (err, data) => { //Instead of returning full records, only returns username and id.
		if (err) { //Database error.
			console.log("Database error: ", err);
			done(err);
		}
		console.log("Search was completed: ", data);
		done(null, data);
	})
};


var findUserById = function(userId, done) { //Check the database if userId exists.
	User.findOne({
		_id: userId
	}, (err, data) => {
		if (err) { //Database error.
			console.log("Database error: ", err);
			done(err);
		}
		console.log("Search was completed: ", data);
		done(null, data);
	})
};


var findAndUpdate = function(userInput, updatedLog, done) {
	User.findOneAndUpdate({
		_id: userInput.user_id
	}, {
		log: updatedLog
	}, (err, data) => {
		if (err) {
			done(err);
		}
		done(null, data);
	})
};


// var countLogsById = function(userId, done) { //Counts how many logs exist for the user.
// 	User.count({
// 		_id: userId
// 	}, (err, data) => {
// 		if (err) { //Database error.
// 			console.log("Database error: ", err);
// 			done(err);
// 		}
// 		console.log("Search was completed: ", data);
// 		done(null, data);
// 	})
// };


// Not found middleware
app.use((req, res, next) => {
	return next({
		status: 404,
		message: 'not found'
	})
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