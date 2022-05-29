var http = require("http");
var url = require("url");
var mysql = require('mysql');
//Change to localhost MYSQL server
var con = mysql.createConnection({
    host: "localhost:3004",
    user: "root",
    password: "root",
    port: "3306", 
    database: "elective"
    });


//Form Validation 

var server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'}); 
    var q = url.parse(req.url, true).query;
     
     var name = q.name; //VARCHAR
     var roll = q.roll; //VARCHAR
     var eleco = q.eleco; //VARCHAR
     var elect  = q.elect; //VARCHAR
    
    if(name == null || name == ""){
        res.write("Name can't be blank\n");
       
    }
    
     
    
    else{
    res.write('\nForm submitted\t'); 
    console.log("\n Form Submitted");
    con.connect(function (err) {
            if (err) throw err;
            console.log("Connected RDS");
        });

        var cap = 3;
        
        var sql = `INSERT INTO electiveinfo(name,rollno,elective1,elective2) VALUES ("${name}","${roll}","${eleco}","${elect}")`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log(result);
        });

        var sql = `SELECT COUNT ( DISTINCT elective1 ) AS "Number of students opted for Data Mining" FROM electiveinfo;`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log(result);
        });

        var sql = `SELECT COUNT ( DISTINCT elective2 ) AS "Number of students opted for Machine Learning" FROM electiveinfo;`;
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log(result);
        });

        con.query('SELECT * from electiveinfo', function (error, results, fields) {
          if (error) throw error;
          console.log("The field results are");
          console.log(typeof(fields) +" "+ fields[0].name+" "+fields[1].name+" "+fields[2].name+" "+fields[2].name);
          console.log("The Select results are");
          console.log(results);
        });
        
        con.end();
    }
    res.end();
});
server.listen(3004);