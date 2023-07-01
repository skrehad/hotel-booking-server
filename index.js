const express = require("express");
const cors = require("cors");
const app = express();
// var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bwvhp.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const blogCollection = client
      .db("hotel-booking")
      .collection("blogCollection");

    app.get("/blog", async (req, res) => {
      const query = {};
      const users = await blogCollection.find(query).toArray();
      res.send(users);
    });

    app.post("/blog", async (req, res) => {
      const user = req.body;
      const result = await blogCollection.insertOne(user);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("hotel booking running");
});

app.listen(port, () => console.log(`hotel booking running on ${port}`));
