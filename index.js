const express = require('express');
const Cors = require('cors');
// const admin = require('firebase-admin');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = 3100;
app.use(Cors({
    origin: '*',
}));

app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.0glyfyp.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
const db = client.db('Foodreview')
const reviewsCollection = db.collection('Foodreviews')
const myfavouritesCollection = db.collection('Myfavourites')
const usersCollection = db.collection('UsersCollections')
 app.get('/reviews',async(req,res)=>{
 const result = await reviewsCollection.find().toArray();
  res.send(result)
 })
app.get('/reviews/:id',async(req,res)=>{
  const {id} = req.params
  console.log(id)
  const objectId = new ObjectId(id)
const result = await reviewsCollection.findOne({_id: objectId})

  res.send({
    success:true,
    result
    
  })
})
app.get('/top-ratedreviews',async(req,res)=>{
  const result = await reviewsCollection.find().sort({"reviewer.rating":-1}).limit(6).toArray();
   res.send(result)
})
app.get('/myreviews',async(req,res)=>{
  const email = req.query.email;
  console.log(email)
  const result = await reviewsCollection.find({created_by: email}).toArray();
  res.send(result)
})


 app.post('/reviews',async(req,res)=>{
  const data = req.body;
  console.log(data)
const result = await reviewsCollection.insertOne(data)
res.send({
  success:true,
  result
})
 })
app.post('/myfavourites',async(req,res)=>{
  const data = req.body
  console.log(data)
  const result = await myfavouritesCollection.insertOne(data)
 const filter = {_id: new ObjectId(data._id)}
 const update = {
  $inc:
  {
    favourites: 1
  }
 }
 const favouriteCount = await reviewsCollection.updateOne(filter,update)

  res.send(result,favouriteCount)
})
app.get('/my-favourites',async(req,res)=>{
  const email = req.query.email;
  const result = await myfavouritesCollection.find({
favourites_by: email}).toArray();
  res.send(result)
})
app.put('/reviews/:id',async(req,res)=>{
  const {id} = req.params;
   const data = req.body;
  const objectID = new ObjectId(id)
const filter = {_id: objectID}
const update = {
  $set:data
}
 const result = await reviewsCollection.updateOne(filter,update)
  res.send({
    success:true,
    result
  })
})
app.delete('/reviews/:id',async(req,res)=>{
  const {id} = req.params
const objectId = new ObjectId(id)
const filter = {_id: objectId}
  const result = await reviewsCollection.deleteOne(filter)
  res.send(result)

})
//save users
//save users in database
 app.post('/users', async (req, res) => {
      const userData = req.body
      userData.created_at = new Date().toISOString()
      userData.last_loggedIn = new Date().toISOString()
      userData.role = 'User'

      const query = {
        email: userData.email,
      }

      const alreadyExists = await usersCollection.findOne(query)
      console.log('User Already Exists---> ', !!alreadyExists)

      if (alreadyExists) {
        console.log('Updating user info......')
        const result = await usersCollection.updateOne(query, {
          $set: {
            last_loggedIn: new Date().toISOString(),
          },
        })
        return res.send(result)
      }

      console.log('Saving new user info......')
      const result = await usersCollection.insertOne(userData)
      res.send(result)
    })



app.get('/search', async (req, res) => {
  try {
    const searchText = req.query.searchText || ""; // undefined হলে empty string
    let result;

    if (!searchText) {
      result = await reviewsCollection.find({}).toArray(); // খালি input → সব review
    } else {
      result = await reviewsCollection
        .find({ foodName: { $regex: searchText, $options: "i" } })
        .toArray();
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server Error" });
  }
})


// await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
   finally {

   }
}

run().catch(console.dir);
app.get('/', (req, res)=>{
res.send('Server is running fine');
});

// app.listen(port, () => {
//     console.log(`Server is listening on port ${port}`);
// });
module.exports = app;
