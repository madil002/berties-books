module.exports = function (app, shopData) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const { check, validationResult } = require('express-validator');

    const redirectLogin = (req, res , next) => {
        if (!req.session.userId){
            res.redirect('/login')
        }else{
            next();
        }
    }

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });
    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });
    app.get('/search', function (req, res) {
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });
    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);
    });
    app.post('/registered', [check('email').isEmail(), check('password').isLength({min:8})], check('username').isLength({min:4, max:15}), function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./register');
        }
        else {
            const plainPassword = req.body.password;
            bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
                if (err) {
                    console.error(err.message);
                    res.redirect('./');
                }
                else {
                    let sqlquery = "INSERT INTO users (username, firstname, lastname, email, hashedPassword) VALUES (?,?,?,?,?)"
                    let newrecord = [req.sanitize(req.body.username), req.sanitize(req.body.first), req.sanitize(req.body.last), req.sanitize(req.body.email), req.sanitize(hashedPassword)];
                    db.query(sqlquery, newrecord, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        else {
                            result = 'Hello ' + req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) + ' you are now registered!  We will send an email to you at ' + req.body.email;
                            result += 'Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                            res.send(result);
                        }
                    })
                }
            })
        }
    });
    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });
    app.get('/listusers', function (req, res){
        let sqlquery = "SELECT firstname, lastname, username FROM users";
        db.query(sqlquery, (err, result) => {
            if(err) {
                return console.error(err.message);
            }
            let newData = Object.assign({}, shopData, {availableUsers : result});
            console.log(newData)
            res.render("listusers.ejs", newData);
        })
    })

    app.get('/addbook', function (req, res) {
        res.render('addbook.ejs', shopData);
    });

    app.post('/bookadded', function (req, res) {
        // saving data in database
        let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
        // execute sql query
        let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else
                res.send(' This book is added to database, name: ' + req.sanitize(req.body.name) + ' price ' + req.sanitize(req.body.price));
        });
    });
    app.get('/bargainbooks', function (req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("bargains.ejs", newData)
        });
    });
    app.get('/login', function(req,res){
        res.render("login.ejs", shopData);
    });
    app.post('/loggedin', function (req, res) {
        req.sanitize(username) = req.body.username;
        req.sanitize(password) = req.body.password;

        db.query(`SELECT hashedpassword FROM users WHERE username = '${username}'`, (err, result) => {
            if (err) {
                return console.error(err.message);
            }

            //Assuming no same usernames registered else would have to add error checking
            if (result.length == 1) {
                hashedPassword = result[0].hashedpassword;

                bcrypt.compare(password, hashedPassword, function (err, result) {
                    if (err) {
                        return console.error(err.message);
                    } else if (result == true) {
                        req.session.userId = username;
                        res.send("Logged in!")
                    } else if (result == false) {
                        res.send("Incorrect!")
                    }
                })
            }else{
                res.send("User not found!")
            }
        })
    })
    app.get('/deleteuser', function (req,res){
        res.render("deleteuser.ejs", shopData);
    })
    app.post('/deleteduser', function (req,res){
        req.sanitize(username) = req.body.username;

        db.query(`DELETE FROM users WHERE username = "${username}"`, function (err, result){
            if (err){
                return console.error(err.message);
            }
            else{
                res.send("User deleted!");
            }
        })
    })
    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('you are now logged out. <a href=' + './' + '>Home</a>');
        })
    })
    app.get('/weather', function (req, res) {
        res.render("weather.ejs", shopData);
    })
    app.post('/displayweather', function (req, res) {
        const request = require('request');
        const desiredCity = req.sanitize(req.body.city);

        let apiKey = 'aed5c1c0d936504cc3ce185b062f904b';
        let city = desiredCity;
        let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`

        request(url, function (err, response, body) {
            if (err) {
                console.log('error:', error);
                res.redirect('/weather')
            } else {
                var weather = JSON.parse(body)
                if (weather !== undefined && weather.main !== undefined) {
                    function formatTime(unixTimestamp) {
                        const date = new Date(unixTimestamp * 1000);
                        const hours = date.getHours();
                        const minutes = "0" + date.getMinutes();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const formattedTime = `${hours % 12 || 12}:${minutes.substr(-2)} ${ampm}`;
                        return formattedTime;
                    }
                    var sunriseTime = formatTime(weather.sys.sunrise);
                    var sunsetTime = formatTime(weather.sys.sunset);
                    var wmsg = 'Weather forecast for ' + weather.name + ': <br>' +
                        'Temperature: ' + weather.main.temp + '<br>' +
                        'Humidity: ' + weather.main.humidity + '<br>' +
                        'Pressure: ' + weather.main.pressure + '<br>' +
                        'Sunrise: ' + sunriseTime + '<br>' +
                        'Sunset: ' + sunsetTime;
                    res.send(wmsg);
                }
                else {
                    res.send("No Data found");
                }
            }
        });
    })
}
