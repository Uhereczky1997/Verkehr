const pg = require("pg");
const express = require("express");
const { calculateTraffic } = require("./utils/street.js");

const app = express();
const port = 8080;

app.use(express.json());

app.listen(port, () => {
  console.log("listening to port: " + port);
});

const pool = new pg.Pool({
  host: "localhost",
  database: "ase_verkehr",
  user: "postgres",
  password: "1234",
  port: "5432",
});

app.get("/cars", async (req, res) => {
  try {
    const dbResponse = await pool.query("select * from car");
    return res.status(200).json(dbResponse.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
app.post("/cars", async (req, res) => {
  const body = req.body;
  console.log(body);
  try {
    const dbResponse = await pool.query(
      "insert into car (start_position, end_position, skip, speed) values ($1,$2,$3,$4) returning *",
      [body.startPosition, body.endPosition, body.skip, body.speed]
    );
    return res.status(200).json(dbResponse.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
app.get("/street", async (req, res) => {
  try {
    const dbResponse = await pool.query("select * from street");
    return res.status(200).json(dbResponse.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
app.post("/street", async (req, res) => {
  const body = req.body;
  try {
    const dbResponse = await pool.query(
      "insert into street (length) values ($1) returning *",
      [body.length]
    );
    return res.status(200).json(dbResponse.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
app.get("/clear", async (req, res) => {
  try {
    const dbResponse = await pool.query("delete from car; delete from street;");
    return res.status(200).json(dbResponse.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
app.get("/traffic", async (req, res) => {
  try {
    const traffic = await calculateTraffic(pool);
    return res.json(traffic);
  } catch (error) {
    console.log(error);
    return res.status(500).send();
  }
});
