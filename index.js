const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');
        const clothesCollection = db.collection('clothes');

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            // Generate JWT token
            const token = jwt.sign({ email: user.email , name : user.name}, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // Get all Clothes
        app.get('/api/v1/winter-clothes', async (req, res) => {
            const result = await clothesCollection.find().toArray();
            res.json(result)
        })
        // Get all Clothes
        app.get('/api/v1/limit-clothes', async (req, res) => {
            const result = await clothesCollection.find().limit(6).toArray();
            res.json(result)
        })

        // get product searching by Id
        app.get('/api/v1/winter-clothes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await clothesCollection.findOne(query)
            res.json(result)
        })

        // get product searching by email
        app.get('/api/v1/winter-cloth/:email', async (req, res) => {
            const email = req.params.email;
            const result = await clothesCollection.find({ email: email }).toArray()
            res.json(result)
        })

        // Delete product by using id
        app.delete("/api/v1/winter-clothes/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await clothesCollection.deleteOne(query)
            res.send(result)
        })

        // -----------update data form database-----------//
        app.patch('/api/v1/winter-clothes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateProduct = req.body;
            const products = {
                $set: {
                    ...updateProduct
                }
            }
            const result = await clothesCollection.updateOne(query, products)
            res.json(result)

        })

        // ----------inset data into database-------------
        app.post('/api/v1/winter-clothes', async (req, res) => {
            const body = req.body
            const result = await clothesCollection.insertOne(body);
            res.json(result)
        })


        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});