module.exports = function (app, shopData) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;

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

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
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
    app.post('/registered', function (req, res) {
        const plainPassword = req.body.password;

        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if(err){
                console.error(err.message);
                res.redirect('./');
            }
            else{
                let sqlquery = "INSERT INTO users (username, firstname, lastname, email, hashedPassword) VALUES (?,?,?,?,?)"
                let newrecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
                db.query(sqlquery, newrecord, (err, result) =>{
                    if(err) {
                        return console.error(err.message);
                    }
                    else {
                        result = 'Hello ' + req.body.first + ' ' + req.body.last + ' you are now registered!  We will send an email to you at ' + req.body.email;
                        result += 'Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                        res.send(result);
                    }
                })
            }
          })        
    });
    app.get('/list', function (req, res) {
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
        let newrecord = [req.body.name, req.body.price];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            else
                res.send(' This book is added to database, name: ' + req.body.name + ' price ' + req.body.price);
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
    // app.post('/loggedin', function(req, res){
    //     username = req.body.username;
    //     password = req.body.password;
        
    //     db.query(`SELECT * FROM users WHERE username = '${username}'`, (err, result) => {
    //         if (err) {
    //             return console.error(err.message);
    //         }
    //         console.log(result[0].hashedpassword);
    //     })
    // })
    app.post('/loggedin', function (req, res) {
        username = req.body.username;
        password = req.body.password;

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
}
