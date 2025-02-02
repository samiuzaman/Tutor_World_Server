const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://tutor-world.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("Token: ", token);
  if (!token) {
    return res.status(401).send({ message: "unAuthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkh8w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const AllTutorialCollection = client
      .db("All_Tutorial")
      .collection("Tutorial");
    const AllBookedCollection = client.db("All_Tutorial").collection("Booked");
    const AllCategoryCollection = client
      .db("All_Tutorial")
      .collection("Category");

    // Auth Related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/logout", async (req, res) => {
      res.clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
    });

    // Get All Element
    app.get("/alltutorial", async (req, res) => {
      let query = {};
      // Tutorial data added by email candidate
      const email = req.query.email;
      if (email) {
        query = { email: email };
      }
      // Category Data
      const category = req.query.language;
      if (category) {
        query = { language: category };
      }
      // Searcing Data
      const { search } = req.query;
      if (search) {
        query = { language: { $regex: search, $options: "i" } };
      }

      const cursor = AllTutorialCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get Single Tutorial
    app.get("/alltutorial/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllTutorialCollection.findOne(query);
      res.send(result);
    });

    // Post Client Site to Database
    app.post("/alltutorial", verifyToken, async (req, res) => {
      const tutorial = req.body;
      const result = await AllTutorialCollection.insertOne(tutorial);
      res.send(result);
    });

    // Patch Tutorial data
    app.patch("/alltutorial/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          language: body.language,
          price: body.price,
          description: body.description,
          image: body.image,
        },
      };
      const result = await AllTutorialCollection.updateMany(filter, updatedDoc);
      res.send(result);
    });

    // Delete Tutorial for Database
    app.delete("/alltutorial/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AllTutorialCollection.deleteOne(query);
      res.send(result);
    });

    // Update Review Value
    app.put("/mybooked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const tutorial = await AllTutorialCollection.findOne(query);
      let count = tutorial.review;
      if (tutorial.review) {
        count = Number(tutorial.review) + 1;
      }
      console.log(tutorial);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          review: count,
        },
      };
      const updateReview = await AllTutorialCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updateReview);
    });

    // My Booked Collection
    app.get("/mybooked", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { bookers_email: email };
      }
      const myBooked = await AllBookedCollection.find(query).toArray();
      res.send(myBooked);
    });

    app.post("/mybooked", verifyToken, async (req, res) => {
      const booked = req.body;

      // if a user placed a booked already in this tutor
      const query = {
        tutor_id: booked?.tutor_id,
        tutor_email: booked?.tutor_email,
        bookers_email: booked?.bookers_email,
      };
      const alreadyExist = await AllBookedCollection.findOne(query);
      if (alreadyExist) {
        return res.status(400).send("You have already booked in tutor");
      }

      const result = await AllBookedCollection.insertOne(booked);
      res.send(result);
    });

    // Get Category
    app.get("/category", async (req, res) => {
      const category = await AllCategoryCollection.find().toArray();
      res.send(category);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is Running...");
});

app.listen(port, () => {
  console.log(`Express App Running port: ${port}`);
});
