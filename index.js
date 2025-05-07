const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb+srv://text_stegano:text_stegano@cluster0.zhfof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with MongoDB Atlas URI

app.use(cors());
app.use(bodyParser.json());

// Define a Mongoose schema for messages
const messageSchema = new mongoose.Schema({
  id: String,
  password: String,
  encoded: String,
  createdAt: { type: Date, default: Date.now }
});

// Create a Mongoose model
const Message = mongoose.model('Message', messageSchema);

// Connect to MongoDB using Mongoose
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
 console.log( "MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// Steganography encode: converts text to binary and then whitespace
function encodeToWhitespace(text) {
  return text.split('').map(c => {
    return c.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('').replace(/0/g, ' ').replace(/1/g, '\t');
}

// Decode: convert whitespace back to text
function decodeFromWhitespace(whitespace) {
  const binary = whitespace.replace(/ /g, '0').replace(/\t/g, '1');
  let text = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      text += String.fromCharCode(parseInt(byte, 2));
    }
  }
  return text;
}
app.post('/',(req,res)=>{
  console.log("helo");
  res.send("Hello");
}
// Save encoded message
app.post('/encode', async (req, res) => {
  try {
    const { text, password } = req.body;
    const encoded = encodeToWhitespace(text);
    const id = Date.now().toString(); // Generate a unique ID for the message
    const newMessage = new Message({ id, password, encoded });
    await newMessage.save();
    res.json({ id });
  } catch (error) {
    console.error('Error encoding message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve and decode message
app.get('/decode', async (req, res) => {
    try {
      const { id, password } = req.query;
      const doc = await Message.findOne({ id, password });
      if (!doc) return res.status(404).json({ error: 'Message not found' });
      const decoded = decodeFromWhitespace(doc.encoded);
      res.json({ text: decoded }); // match Flutter expectations
    } catch (error) {
      console.error('Error decoding message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
