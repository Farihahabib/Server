const express = require('express');
const Cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = 3100;
app.use(Cors({
    origin: '*',
}));

app.use(express.json());

const uri = "mongodb+srv://foodreviews:lcv46MXvkmygwEQd@cluster0.0glyfyp.mongodb.net/?appName=Cluster0";

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
    await client.connect();
const db = client.db('Foodreview')
const reviewsCollection = db.collection('Foodreviews')

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



 app.post('/reviews',async(req,res)=>{
  const data = req.body;
  console.log(data)
const result = await reviewsCollection.insertOne(data)
res.send({
  success:true,
  result
})
 })



await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
   finally {
  //   // Ensures that the client will close when you finish/error
  //   await client.close();
   }
}
run().catch(console.dir);



run().catch(console.dir);
app.get('/', (req, res)=>{
res.send('Server is running fine');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

