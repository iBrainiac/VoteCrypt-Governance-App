const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB (replace with your own connection string)
mongoose.connect('mongodb://localhost:27017/votingApp', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for voter details
const voterSchema = new mongoose.Schema({
    name: String,
    department: String,
    email: String,
    wallet: String,
    biometric: String
});

const Voter = mongoose.model('Voter', voterSchema);

// POST route for voter registration
app.post('/register', (req, res) => {
    const newVoter = new Voter(req.body);
    newVoter.save()
        .then(() => res.status(201).send('Voter registered successfully!'))
        .catch(err => res.status(400).send('Error registering voter: ' + err));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
