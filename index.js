const express = require("express");
const cors = require("cors");
const app = express();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// console.log(stripe);

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

// jwt token functionality
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const hotelCollection = client
      .db("hotel-booking")
      .collection("hotelCollection");
    const offerHotelCollection = client
      .db("hotel-booking")
      .collection("offerHotelCollection");
    const bookingCollection = client
      .db("hotel-booking")
      .collection("bookingCollection");
    const blogCollection = client
      .db("hotel-booking")
      .collection("blogCollection");
    const userCollection = client
      .db("hotel-booking")
      .collection("userCollection");
    const galleryCollection = client
      .db("hotel-booking")
      .collection("galleryCollection");
    const reviewCollection = client
      .db("hotel-booking")
      .collection("reviewCollection");
    const paymentsCollection = client
      .db("hotel-booking")
      .collection("paymentsCollection");

    // verify admin for access another user to admit admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      // console.log(decodedEmail);
      const user = await userCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // hotels collection
    app.get("/hotels", async (req, res) => {
      const query = {};
      const users = await hotelCollection.find(query).toArray();
      res.send(users);
    });

    // hotel collection for post in the client site
    app.post("/hotels", verifyJWT, verifyAdmin, async (req, res) => {
      const user = req.body;
      const result = await hotelCollection.insertOne(user);
      res.send(result);
    });

    //for single hotel collection
    app.get("/hotels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await hotelCollection.findOne(query);
      res.send(user);
    });

    //delete hotel from manage hotels
    app.delete("/hotels/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await hotelCollection.deleteOne(filter);
      res.send(result);
    });

    //all user collection
    app.get("/booking", verifyJWT, async (req, res) => {
      const email = req.query.email;
      // console.log(req.headers.authorization);
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    // booking collection for post in the client site
    app.post("/booking", async (req, res) => {
      const user = req.body;
      const result = await bookingCollection.insertOne(user);
      res.send(result);
    });

    // for find single booking for payment
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const booking = await bookingCollection.findOne(query);
      res.send(booking);
    });

    // for delete booking
    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // blog collection for get
    app.get("/blog", async (req, res) => {
      const query = {};
      const users = await blogCollection.find(query).toArray();
      res.send(users);
    });

    // blog collection for post in the client site
    app.post("/blog", verifyJWT, verifyAdmin, async (req, res) => {
      const user = req.body;
      const result = await blogCollection.insertOne(user);
      res.send(result);
    });

    //all user collection
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });

    // user collect from client site
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = {
        email: user.email,
      };
      const alreadyLogin = await userCollection.find(query).toArray();
      if (alreadyLogin.length > 0 && alreadyLogin[0].email === user.email) {
        return res.send({ acknowledged: false });
      }
      const result = await userCollection.insertOne(user);
      res.send({ result, email: user.email });
    });

    //for single user collection
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    //delete single user collection
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    });

    // for get jwt token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // for create admin
    app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // for check admin email
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // gallery collection
    app.get("/gallery", async (req, res) => {
      const query = {};
      const users = await galleryCollection.find(query).toArray();
      res.send(users);
    });

    // hotel collection for post in the client site
    app.post("/gallery", verifyJWT, verifyAdmin, async (req, res) => {
      const user = req.body;
      const result = await galleryCollection.insertOne(user);
      res.send(result);
    });

    // offer hotels collection
    app.get("/offerHotels", async (req, res) => {
      const query = {};
      const users = await offerHotelCollection.find(query).toArray();
      res.send(users);
    });

    // reviews collection
    app.get("/reviews", async (req, res) => {
      const query = {};
      const users = await reviewCollection.find(query).toArray();
      res.send(users);
    });

    // review collection for post in the client site
    app.post("/reviews", async (req, res) => {
      const user = req.body;
      const result = await reviewCollection.insertOne(user);
      res.send(result);
    });
    // for payment system
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.totalPrice;
      const amount = price * 100;
      // console.log(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      // console.log(paymentIntent);
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: new ObjectId(id) };
      // const options = { upsert: true };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updateResult = await bookingCollection.updateOne(filter, updateDoc);
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
