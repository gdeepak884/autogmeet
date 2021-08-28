const express = require('express')
const path = require('path');
const bodyParser = require('body-parser')
const app = express()
var fs = require("fs");
var fetch = require('cross-fetch');
var fetch = require('node-fetch');
var http     = require("http");
var session = require('express-session');
const e = require('express');
const multer  = require('multer')
const upload = multer({ dest: 'assets/' })
const { json } = require('body-parser');
app.use(express.json());

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(function(req, res, next) {
	res.locals.username = req.session.username;
	next();
});

app.get('/', (req, res) => {
	res.render('index')
});


app.get('/signup', (req, res) => {
	var message = req.query.message;
	res.render('signup',{message});
});

app.get('/login', (req, res) => {
	var message = req.query.message;
	res.render('login',{message});
});

app.get('/feedback', (req, res) => {
	var message = req.query.message;
	res.render('feedback',{message});
});

app.get('/report', (req, res) => {
	var message = req.query.message;
	res.render('report',{message});
});

app.post('/creating', function(request, response) {
	var created = Date.now();
	var name = request.body.name;
	var email = request.body.email;
	var password = request.body.password;
	var username= request.body.username;
	if (name && email && username && password) {
		fetch(`http://twenfluence.tech/api/v1/signup.php?created=${created}&username=${username}&name=${name}&email=${email}&password=${password}`)
		.then(response => response.json())
		.then(data => {
			if(data.status=="200 OK") {
				if (data.message=="Account Created!") {
						fetch(`https://themindfulcode.in/api/v2/send.php?username=${username}&email=${email}&password=${password}`)
						.then(response => response.json())
						.then(mail => {
							if(mail.status=="200 OK") {
								if (mail.message=="Sent") {	
								}
							}
						}
							).catch(function(err) {
							 console.log(err);}
						);
					response.redirect(`/login?message=${data.message}`);
				}
			}
			else {
				    response.status(200).redirect(`/signup?message=${data.message}`)
			}
		}
			).catch(function(err) {
			 console.log(err);}
	    );
	}
	else {
			response.status(200).redirect(`/signup?message=Something went wrong`)	
	}
});

app.post('/auth', function(request, response) {
	var username= request.body.username;
	var password = request.body.password;
	if (username && password) {
		fetch(`http://twenfluence.tech/api/v1/users.php?username=${username}&password=${password}`)
		.then(response => response.json())
		.then(data => {
			if(data.status=="200 OK") {
				if (data.customers.uid.length > 0) {
					var uid = data.customers.uid;
					request.session.loggedin = true;
					request.session.username = username;
					request.session.uid = uid;
					response.redirect('/');
				}
			}
			else {
				    response.status(200).redirect('/login?message=Incorrect Username and/or Password!')
			}
		}
			).catch(function(err) {
			 console.log(err);}
	    );
	}
	else {
			response.status(200).redirect('/login?message=Please enter Username and Password!')	
		}
});		

app.get('/logout', (req, res) => {
	req.session.loggedin = false;
	req.session.destroy();
	res.redirect('/');
});

app.get('/build', (req, res) => {
	res.render('build')
});

app.get('/status', (req, res) => {
	if(req.session.loggedin) {
		res.render('status')
	}
	else {
		res.redirect('/login');
	}
});


app.get('/setup', function(request, response){
	if(request.session.loggedin) {
		var message = request.query.message;
		var uid=request.session.uid
	    if (uid) {
		   fetch(`http://twenfluence.tech/api/v1/view.php?uid=${uid}`)
		   .then(response => response.json())
		   .then(data => {
			if(data!="") {
					response.render('setup', {data,message})				
			}
			else {
				response.render('setup', {data,message})
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
	}
	else {
		response.redirect('/login');
	}
});

app.get('/meetings', function(request, response){
	if(request.session.loggedin) {
		var uid=request.session.uid
	    if (uid) {
		   fetch(`http://twenfluence.tech/api/v1/view.php?uid=${uid}`)
		   .then(response => response.json())
		   .then(data => {
			if(data!="") {
				    meetings=data;
					response.render('meetings', {data})				
			}
			else {
				    response.render('meetings', {data})	
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
	}
	else {
		response.redirect('/login');
	}
});

app.post('/submitmeet', function(request, response){
	if(request.session.loggedin) {
	var uid= request.session.uid
	var mname= request.body.meetName
	var mtime= request.body.meetTime
	var murl= request.body.meetUrl
	    if (uid && mname && mtime && murl) {
		   fetch(`http://twenfluence.tech/api/v1/create.php?uid=${uid}&mname=${mname}&murl=${murl}&mtime=${mtime}`)
		   .then(response => response.json())
		   .then(data => {
			if(data.status=="200 OK") {
				if (data.message=="Inserted") {
					response.redirect(`/setup?message=${data.message}`)
				}
			}
			else {
				response.status(200).redirect(`/setup?message=${data.message}`)
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
	}
	else {
		response.send('User Unauthenticated!');
	}
});

app.post('/submitfeedback', function(request, response){
	var fname= request.body.fname
	var femail= request.body.femail
	var comment= request.body.comment
	    if (fname && femail && comment) {
		   fetch(`http://twenfluence.tech/api/v1/feedback.php?fname=${fname}&femail=${femail}&comment=${comment}`)
		   .then(response => response.json())
		   .then(data => {
			if(data.status=="200 OK") {
				if (data.message=="Submitted") {
					response.redirect(`/feedback?message=${data.message}`)
				}
			}
			else {
				response.status(200).redirect(`/feedback?message=${data.message}`)
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
});

app.post('/submitreport', upload.single('rfile'), function(request, response){
	var title= request.body.title
	var remail= request.body.remail
	var description= request.body.description
	var rfile= request.file.filename
	var file = __dirname + '/assets/' + request.file.filename;
	fs.rename(request.file.path,file,function(err){
		if(err){
			console.log(err);
			response.send(500);
		}
		else {
		if (title && remail && description && rfile) {
		   fetch(`http://twenfluence.tech/api/v1/report.php?title=${title}&remail=${remail}&description=${description}&rfile=${rfile}`)
		   .then(response => response.json())
		   .then(data => {
			if(data.status=="200 OK") {
				if (data.message=="Submitted") {
					response.redirect(`/report?message=${data.message}`)
				}
			}
			else {
				response.status(200).redirect(`/report?message=${data.message}`)
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
	}
	});
});

  
app.post('/delete', function(request, response){
	if(request.session.loggedin) {
		var mid= request.body.delID
			if (mid) {
			   fetch(`http://twenfluence.tech/api/v1/delete.php?mid=${mid}`)
			   .then(response => response.json())
			   .then(data => {
				if(data.status=="200 OK") {
					if (data.message=="Deleted") {
						response.redirect(`/setup?message=${data.message}`)
					}
				}
				else {
						response.status(200).redirect(`/setup?message=${data.message}`)
				}
			   }
				).catch(function(err) {
				 console.log(err);}
			   );
			}
   }
    else {
	response.send('User Unauthenticated!');
    }
});

app.get('/api/v1', function(request, response){
	if(request.session.loggedin) {
		var uid=request.session.uid
	    if (uid) {
		   fetch(`http://twenfluence.tech/api/v1/view.php?uid=${uid}`)
		   .then(response => response.json())
		   .then(data => {
			if(data!="") {
				response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(data));				
			}
		   }
			).catch(function(err) {
			 console.log(err);}
	       );
	    }
	}
	else {
		response.redirect('/login');
	}
});

app.get('/api/v1/delete', function(request, response){
	if(request.session.loggedin) {
		var mid= request.query.mid
			if (mid) {
			   fetch(`http://twenfluence.tech/api/v1/delete.php?mid=${mid}`)
			   .then(response => response.json())
			   .then(data => {
				if(data.status=="200 OK") {
					response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(data));
				}
			   }
				).catch(function(err) {
				 console.log(err);}
			   );
			}
	}
	else{
		response.redirect('/login');
	}
});

function setDaysTimeout(callback,days) {
    let msInDay = 86400*1000; 
    let dayCount = 0;
    let timer = setInterval(function() {
		checkForMeeting()
        dayCount++;

        if (dayCount === days) {
           clearInterval(timer);
           callback.apply(this, []);
        }
    }, msInDay);
}

const checkForMeeting = (request, response) => {
			   var api_key=//API Key
			   fetch(`http://twenfluence.tech/api/v1/show_users.php?hash=${api_key}&type=emails`)
			   .then(response => response.json())
			   .then(data => {
				if(data.status=="200 OK") {
					if (data.message=="User Details") {
						var emails=data.customers;
						const emails_arr = Object.fromEntries(emails.map((e,i)=>[i+1,e]));
						for(i=1; i<emails.length+1; i++) {
							var email=emails_arr[i];
						    fetch(`https://themindfulcode.in/api/v2/build.php?email=${emails_arr[i]}`)
						    .then(response => response.json())
						    .then(mail => {
							if(mail.status=="200 OK") {
								if (mail.message=="Sent") {	
							   }
							}
						    }
							).catch(function(err) {
							}
						    );
				     	}
				    } 
			    }
			   }
				).catch(function(err) {
				}
			   );
			}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	setDaysTimeout(function() {
   }, 31);
	console.log('App listening on port 3000!');
});
