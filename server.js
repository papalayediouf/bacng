const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Render port or local fallback

// Middleware
app.use(express.json());
app.use(cors());

// Serve the static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contact API',
      version: '1.0.0',
      description: 'API pour gérer des contacts',
    },
  },
  apis: ['./server.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connexion réussie à MongoDB');
  })
  .catch((error) => {
    console.error('Erreur lors de la connexion à MongoDB :', error);
  });

// Define the Mongoose Schema and Model
const todoSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ },
  telephone: { type: String, required: true },
});
const Todo = mongoose.model('Todo', todoSchema);

// Routes
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/todos', async (req, res) => {
  const { prenom, nom, email, telephone } = req.body;
  try {
    const newTodo = new Todo({ prenom, nom, email, telephone });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(400).send('Error creating contact');
  }
});

app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { prenom, nom, email, telephone } = req.body;
  try {
    const contact = await Todo.findByIdAndUpdate(id, { prenom, nom, email, telephone }, { new: true });
    if (contact) {
      res.json(contact);
    } else {
      res.status(404).send('Contact not found');
    }
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).send('Error updating contact');
  }
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Todo.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).send('Error deleting contact');
  }
});

// Serve index.html as the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API documentation is available at http://localhost:${port}/api-docs/`);
});
