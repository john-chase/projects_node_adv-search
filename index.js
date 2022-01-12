/******SETUP******/
//required packages
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const chalk = require('chalk');
const app = express();
console.clear();

//use ENV for DEV
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  console.log(chalk.white.inverse("\nENV Variables:"))
  console.log('DB_HOST: '+process.env.DB_HOST)
  console.log('DB_PORT: '+process.env.DB_PORT)
  console.log('DB_USER: '+process.env.DB_USER)
  console.log('DB_USER: '+process.env.DB_PASSWORD)
  console.log('DB_DATABASE: '+process.env.DB_DATABASE+"\n")
}

// parse application/json
app.use(bodyParser.json());

//CORS - must be set before any request forwarding
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

//create database connection
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

//connect to database
conn.connect((err) => {
  if(err) throw err;
  console.log(chalk.white.inverse('Mysql connected on port '+process.env.DB_PORT+'...'));
});

/******ROUTES******/
//advanced search route
app.get('/api/expeditions/advSearch/',(req, res) => {
  let sql = " \
  SELECT \
  exps.id, \
  exps.code, \
  exps.title, \
  exps.year, \
  exps.url, \
  locs.loc, \
  types.type, \
      GROUP_CONCAT(DISTINCT exs.explorer ORDER BY exs.explorer ASC SEPARATOR ' + ') as explorer, \
      GROUP_CONCAT(DISTINCT tops.topic ORDER BY tops.topic DESC SEPARATOR ' + ') as topic \
      FROM expeditions as exps INNER JOIN locations as locs ON locs.id = exps.location_id \
      INNER JOIN types ON types.id = exps.type_id \
      INNER JOIN (topics as tops INNER JOIN expeditions_topics as et ON tops.id = et.topic_id) ON exps.ID = et.exp_id \
      INNER JOIN (explorers as exs INNER JOIN expeditions_explorers as ee ON exs.id = ee.explorer_id) ON exps.ID = ee.exp_id \
      WHERE 1=1"
  if (typeof req.query.years !== 'undefined' && req.query.years) {
    const years = req.query.years.split(",");
    //console.log(years)
    sql += " AND (";
    for(let i=0, count=years.length; i<count; i++) {
      sql += "exps.year = "+years[i]
      if(i!==count-1) { sql += " OR "}
    }
    sql += ")";
  }
  if (typeof req.query.types !== 'undefined' && req.query.types) {
    //console.log("\n\nTYPES = "+req.query.types)
    sql += " AND (exps.type_id = "+req.query.types+")";
  }  
  if (typeof req.query.locs !== 'undefined' && req.query.locs) {
    const locations = req.query.locs.split(",");
    //console.log(locations)
    sql += " AND (";
    for(let i=0, count=locations.length; i<count; i++) {
      sql += "locs.id = '"+locations[i]+"'"
      if(i!==count-1) { sql += " OR "}
    }
    sql += ")";
  }
  if (typeof req.query.topics !== 'undefined' && req.query.topics) {
    //console.log(req.query.topics,req.query.topics.split(","))
    const topics = req.query.topics.split(",");
    //console.log(topics)
    sql += " AND (";
    for(let i=0, count=topics.length; i<count; i++) {
      sql += "tops.id = '"+topics[i]+"'"
      if(i!==count-1) { sql += " OR "}
    }
    sql += ")";
  }
  if (typeof req.query.explorers !== 'undefined' && req.query.explorers > 0) {
    //console.log(req.query.explorers,req.query.explorers.split(","))
    const explorers = req.query.explorers.split(",");
    //console.log(explorers)
    sql += " AND (";
    for(let i=0, count=explorers.length; i<count; i++) {
      sql += "ee.explorer_id = '"+explorers[i]+"'"
      if(i!==count-1) { sql += " OR "}
    }
    sql += ")";
  }
  sql += " \
    GROUP BY exps.id, exps.code, exps.year, locs.loc \
    ORDER BY exps.year desc, exps.id desc"
  console.log(chalk.green("\nRoute: /api/expeditions/advSearch/\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
  if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

//lookups routes
app.get('/api/expeditions/lookupYears/:id/:sort',(req, res) => {
  let sql = " \
    SELECT \
      DISTINCT(year) \
    FROM expeditions \
    ORDER BY year "+req.params.sort
    //req.params.id is not used, but preserved for sgnature matching
      console.log(chalk.green("\nRoute: /api/expeditions/lookupYears/:sort\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/lookupLocations/:id/:sort',(req, res) => {
  let sql = " \
    SELECT id, loc \
    FROM locations \
    WHERE 1=1 "
    if(req.params.id!=='0') {
      sql+= "AND ("
      const id = req.params.id.split(",");
      for(let i=0, count=id.length; i<count; i++) {
        sql += "id = "+id[i]
        if(i!==count-1) { sql += " OR "}
      }
      sql+= ") "
    }
    sql += " ORDER BY loc "+req.params.sort
    console.log(chalk.green("\nRoute: /api/expeditions/lookupLocations/:id/:sort\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/lookupTopics/:id/:sort',(req, res) => {
  let sql = " \
    SELECT id, topic \
    FROM topics \
    WHERE 1=1 "
    if(req.params.id!=='0') {
      sql+= "AND ("
      const id = req.params.id.split(",");
      for(let i=0, count=id.length; i<count; i++) {
        sql += "id = "+id[i]
        if(i!==count-1) { sql += " OR "}
      }
      sql+= ") "
    }
    sql += " ORDER BY topic "+req.params.sort
    console.log(chalk.green("\nRoute: /api/expeditions/lookupTopics/:id/:sort\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/lookupTypes/:id/:sort',(req, res) => {
  let sql = " \
    SELECT id, type \
    FROM types  \
    WHERE 1=1 "
    if(req.params.id!=='0') {
      sql+= "AND ("
      const id = req.params.id.split(",");
      for(let i=0, count=id.length; i<count; i++) {
        sql += "id = "+id[i]
        if(i!==count-1) { sql += " OR "}
      }
      sql+= ") "
    }
    sql += " ORDER BY type "+req.params.sort
    console.log(chalk.green("\nRoute: /api/expeditions/Types/:sort\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/lookupExplorers/:id/:sort',(req, res) => {
  let sql = " \
    SELECT id, explorer \
    FROM explorers  \
    WHERE 1=1 "
    if(req.params.id!=='0') {
      sql+= "AND ("
      const id = req.params.id.split(",");
      for(let i=0, count=id.length; i<count; i++) {
        sql += "id = "+id[i]
        if(i!==count-1) { sql += " OR "}
      }
      sql+= ") "
    }
    sql += " ORDER BY explorer "+req.params.sort
    console.log(chalk.green("\nRoute: /api/expeditions/Explorers/:sort\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

/*counts routes*/
app.get('/api/expeditions/countAll/:qry',(req, res) => {
  let sql = " \
    SELECT COUNT(*) as total FROM ( \
      SELECT \
      count(distinct e.id) \
      FROM expeditions as e INNER JOIN locations as l ON l.id = e.location_id \
      INNER JOIN types as t ON t.id = e.type_id \
      INNER JOIN (topics as p INNER JOIN expeditions_topics as et ON p.id = et.topic_id) ON e.ID = et.exp_id \
      INNER JOIN (explorers as x INNER JOIN expeditions_explorers as ee ON x.id = ee.explorer_id) ON e.ID = ee.exp_id \
      WHERE 1=1 AND "+req.params.qry+" \
      GROUP BY e.id \
    ) alias;"
      console.log(chalk.green("\nRoute: /api/expeditions/countAll/:qry\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countExpeditions/',(req, res) => {
  let sql = " \
    SELECT \
    count(*) as total \
    FROM expeditions"
      console.log(chalk.green("\nRoute: /api/expeditions/countExpeditions/\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countExplorers/',(req, res) => {
  let sql = " \
    SELECT \
    count(*)-1 as total \
    FROM explorers"
      console.log(chalk.green("\nRoute: /api/expeditions/countExplorers/\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countTypes/:type_id',(req, res) => {
  let sql = " \
    SELECT \
    count(*) as total \
    FROM expeditions \
    WHERE type_id="+req.params.type_id
      console.log(chalk.green("\nRoute: /api/expeditions/countTypes/:type_id\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countYears/:year',(req, res) => {
  let sql = " \
    SELECT \
    count(*) as total \
    FROM expeditions \
    WHERE year="+req.params.year
      console.log(chalk.green("\nRoute: /api/expeditions/countYears/:year\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countLocations/:location_id',(req, res) => {
  let sql = " \
    SELECT \
    count(*) as total \
    FROM expeditions \
    WHERE location_id="+req.params.location_id
      console.log(chalk.green("\nRoute: /api/expeditions/countLocations/:location_id\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

app.get('/api/expeditions/countTopics/:topic_id',(req, res) => {
  let sql = " \
    SELECT \
    count(*) as total \
    FROM expeditions \
    INNER JOIN (topics INNER JOIN expeditions_topics ON topics.id = expeditions_topics.topic_id) ON expeditions.ID = expeditions_topics.exp_id \
    WHERE expeditions_topics.topic_id="+req.params.topic_id
      console.log(chalk.green("\nRoute: /api/expeditions/countTopics/:topic_id\n"+sql.replace(/\s{2,}/g, "\n")));
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
  });
});

/******ERRORS******/
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500 );
  res.json({
      error: {
          message: error.message
      }
  })
});

/******SERVER******/
const serverPort = process.env.PORT || 3000
app.listen(serverPort, () => {
  console.log(chalk.white.inverse('HTTP server started on port '+serverPort+'...\n'));
});

// REFERENCE: http://mfikri.com/en/blog/nodejs-restful-api-mysql