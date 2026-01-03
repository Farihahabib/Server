require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

// Firebase Admin setup
const decoded = Buffer.from(process.env.SS_SERVICE_KEY, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_DOMAIN || '*', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// ================= JWT Middleware =================
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: 'Unauthorized Access!' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'Unauthorized Access!' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.tokenEmail = decodedToken.email;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).send({ message: 'Unauthorized Access!' });
  }
};

// ================= MongoDB =================
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.0glyfyp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function run() {
  try {
    const db = client.db('Foodreview');
    const reviewsCollection = db.collection('Foodreviews');
    const favouritesCollection = db.collection('Myfavourites');
    const usersCollection = db.collection('UsersCollections');

    // ==================== REVIEWS ====================

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.json(result);
    });

    app.get('/reviews/:id', async (req, res) => {
      const objectId = new ObjectId(req.params.id);
      const result = await reviewsCollection.findOne({ _id: objectId });
      res.json({ success: true, result });
    });

    app.post('/reviews', verifyJWT, async (req, res) => {
      const data = req.body;
      data.created_by = req.tokenEmail; // save user email from token
      const result = await reviewsCollection.insertOne(data);
      res.json({ success: true, result });
    });

    app.put('/reviews/:id', verifyJWT, async (req, res) => {
      const objectId = new ObjectId(req.params.id);
      const data = req.body;

      // Optional: check if the user owns the review
      const review = await reviewsCollection.findOne({ _id: objectId });
      if (review.created_by !== req.tokenEmail) {
        return res.status(403).send({ message: 'Forbidden' });
      }

      const result = await reviewsCollection.updateOne({ _id: objectId }, { $set: data });
      res.json({ success: true, result });
    });

    app.delete('/reviews/:id', verifyJWT, async (req, res) => {
      const objectId = new ObjectId(req.params.id);
      const review = await reviewsCollection.findOne({ _id: objectId });
      if (review.created_by !== req.tokenEmail) {
        return res.status(403).send({ message: 'Forbidden' });
      }

      const result = await reviewsCollection.deleteOne({ _id: objectId });
      res.json(result);
    });

    // ==================== FAVOURITES ====================
    app.post('/myfavourites', verifyJWT, async (req, res) => {
      const data = req.body;
      data.favourites_by = req.tokenEmail;
      const result = await favouritesCollection.insertOne(data);

      const filter = { _id: new ObjectId(data._id) };
      const favouriteCount = await reviewsCollection.updateOne(filter, { $inc: { favourites: 1 } });

      res.json({ result, favouriteCount });
    });

    app.get('/my-favourites', verifyJWT, async (req, res) => {
      const result = await favouritesCollection.find({ favourites_by: req.tokenEmail }).toArray();
      res.json(result);
    });

    // ==================== USERS ====================
    app.post('/users', async (req, res) => {
      const userData = req.body;
      userData.created_at = new Date().toISOString();
      userData.last_loggedIn = new Date().toISOString();
      userData.role = 'User';

      const query = { email: userData.email };
      const alreadyExists = await usersCollection.findOne(query);

      if (alreadyExists) {
        const result = await usersCollection.updateOne(query, { $set: { last_loggedIn: new Date().toISOString() } });
        return res.json(result);
      }

      const result = await usersCollection.insertOne(userData);
      res.json(result);
    });
    
app.get('/user/role/',verifyJWT, async (req, res) => {
     const result = await usersCollection.findOne({ email: req.tokenEmail })
      res.send({ role: result?.role })
      console.log(result)
 })
// // Update role
// app.patch('/users/:id/role',verifyJWT, async (req, res) => {
//   const { role } = req.body;
//   const { id } = req.params;
//   const result = await usersCollection.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: { role } }
//   );
//   res.send(result);
// });

// // Delete user
// app.delete('/users/:id',verifyJWT, async (req, res) => {
//   const { id } = req.params;
//   const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
//   res.send(result);
// });

    // ==================== SEARCH ====================
    app.get('/search', async (req, res) => {
      const searchText = req.query.searchText || '';
      const result = searchText
        ? await reviewsCollection.find({ foodName: { $regex: searchText, $options: 'i' } }).toArray()
        : await reviewsCollection.find({}).toArray();

      res.json(result);
    });

    console.log('MongoDB connected and routes are ready!');
  } finally {
    // serverless => don't call client.close()
  }
}

run().catch(console.dir);

// Test endpoint
app.get('/', (req, res) => res.send('Server is running fine'));

// Export for Vercel
module.exports = app;















// const express = require('express');
// const Cors = require('cors');
// // const admin = require('firebase-admin');
// require('dotenv').config();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const app = express();
// const port = 3100;
// app.use(Cors({
//     origin: '*',
// }));

// app.use(express.json());


// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.0glyfyp.mongodb.net/?appName=Cluster0`;



// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
// const db = client.db('Foodreview')
// const reviewsCollection = db.collection('Foodreviews')
// const myfavouritesCollection = db.collection('Myfavourites')
// const usersCollection = db.collection('UsersCollections')
//  app.get('/reviews',async(req,res)=>{
//  const result = await reviewsCollection.find().toArray();
//   res.send(result)
//  })
// app.get('/reviews/:id',async(req,res)=>{
//   const {id} = req.params
//   console.log(id)
//   const objectId = new ObjectId(id)
// const result = await reviewsCollection.findOne({_id: objectId})

//   res.send({
//     success:true,
//     result
    
//   })
// })
// app.get('/top-ratedreviews',async(req,res)=>{
//   const result = await reviewsCollection.find().sort({"reviewer.rating":-1}).limit(6).toArray();
//    res.send(result)
// })
// app.get('/myreviews',async(req,res)=>{
//   const email = req.query.email;
//   console.log(email)
//   const result = await reviewsCollection.find({created_by: email}).toArray();
//   res.send(result)
// })


//  app.post('/reviews',async(req,res)=>{
//   const data = req.body;
//   console.log(data)
// const result = await reviewsCollection.insertOne(data)
// res.send({
//   success:true,
//   result
// })
//  })
// app.post('/myfavourites',async(req,res)=>{
//   const data = req.body
//   console.log(data)
//   const result = await myfavouritesCollection.insertOne(data)
//  const filter = {_id: new ObjectId(data._id)}
//  const update = {
//   $inc:
//   {
//     favourites: 1
//   }
//  }
//  const favouriteCount = await reviewsCollection.updateOne(filter,update)

//   res.send(result,favouriteCount)
// })
// app.get('/my-favourites',async(req,res)=>{
//   const email = req.query.email;
//   const result = await myfavouritesCollection.find({
// favourites_by: email}).toArray();
//   res.send(result)
// })
// app.put('/reviews/:id',async(req,res)=>{
//   const {id} = req.params;
//    const data = req.body;
//   const objectID = new ObjectId(id)
// const filter = {_id: objectID}
// const update = {
//   $set:data
// }
//  const result = await reviewsCollection.updateOne(filter,update)
//   res.send({
//     success:true,
//     result
//   })
// })
// app.delete('/reviews/:id',async(req,res)=>{
//   const {id} = req.params
// const objectId = new ObjectId(id)
// const filter = {_id: objectId}
//   const result = await reviewsCollection.deleteOne(filter)
//   res.send(result)

// })
// //save users
// //save users in database
//  app.post('/users', async (req, res) => {
//       const userData = req.body
//       userData.created_at = new Date().toISOString()
//       userData.last_loggedIn = new Date().toISOString()
//       userData.role = 'User'

//       const query = {
//         email: userData.email,
//       }

//       const alreadyExists = await usersCollection.findOne(query)
//       console.log('User Already Exists---> ', !!alreadyExists)

//       if (alreadyExists) {
//         console.log('Updating user info......')
//         const result = await usersCollection.updateOne(query, {
//           $set: {
//             last_loggedIn: new Date().toISOString(),
//           },
//         })
//         return res.send(result)
//       }

//       console.log('Saving new user info......')
//       const result = await usersCollection.insertOne(userData)
//       res.send(result)
//     })



// app.get('/search', async (req, res) => {
//   try {
//     const searchText = req.query.searchText || ""; // undefined হলে empty string
//     let result;

//     if (!searchText) {
//       result = await reviewsCollection.find({}).toArray(); // খালি input → সব review
//     } else {
//       result = await reviewsCollection
//         .find({ foodName: { $regex: searchText, $options: "i" } })
//         .toArray();
//     }

//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ error: "Server Error" });
//   }
// })


// // await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   }
//    finally {

//    }
// }

// run().catch(console.dir);
// app.get('/', (req, res)=>{
// res.send('Server is running fine');
// });

// // app.listen(port, () => {
// //     console.log(`Server is listening on port ${port}`);
// // });
// module.exports = app;
