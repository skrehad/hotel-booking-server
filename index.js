const express = require("express");
const cors = require("cors");
const app = express();
// var jwt = require("jsonwebtoken");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("doctor portal running");
});

app.listen(port, () => console.log(`doctor portal running on ${port}`));
