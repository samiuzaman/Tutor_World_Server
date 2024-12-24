const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://sports-equify.netlify.app"],
    credentials: false,
  })
);
app.use(express.json());

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
    await client.connect();

    const AllTutorialCollection = client
      .db("All_Tutorial")
      .collection("Tutorial");
    const AllBookedCollection = client.db("All_Tutorial").collection("Booked");
    const AllCategoryCollection = client
      .db("All_Tutorial")
      .collection("Category");

    // Get All Element
    app.get("/alltutorial", async (req, res) => {
      let query = {};
      // Tutorial data added by email candidate
      const email = req.query.email;
      if (email) {
        query = { email: email };
      }
      const category = req.query.language;
      if (category) {
        query = { language: category };
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
    app.post("/alltutorial", async (req, res) => {
      const tutorial = req.body;
      const result = await AllTutorialCollection.insertOne(tutorial);
      res.send(result);
    });

    // Patch Tutorial data
    app.patch("/alltutorial/:id", async (req, res) => {
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
    app.delete("/alltutorial/:id", async (req, res) => {
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

    // app.put("/mybooked/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log(req.params);
    //   const result = await AllTutorialCollection.updateOne(
    //     { tutor_id: id },
    //     { $inc: { review: 1 } }
    //   );
    //   res.send(result);
    // });

    // app.put("/alltutorial/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   console.log(req.body);
    //   const updatedDoc = {
    //     $set: {
    //       review: req.params.review,
    //     },
    //   };
    //   const result = await AllTutorialCollection.updateOne(filter, updatedDoc);
    //   res.send(result);
    // });

    // My Booked Collection
    app.get("/mybooked", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { bookers_email: email };
      }
      const myBooked = await AllBookedCollection.find(query).toArray();
      res.send(myBooked);
    });

    app.post("/mybooked", async (req, res) => {
      const booked = req.body;
      const result = await AllBookedCollection.insertOne(booked);
      res.send(result);
    });

    // Get Category
    app.get("/category", async (req, res) => {
      const category = await AllCategoryCollection.find().toArray();
      res.send(category);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
