const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Blog = require('./models/blog');
const cors = require('cors');

// express app
const app = express();

// CORS setup
const corsOptions = {
  origin: 'http://localhost:4200',
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('dev'));
app.set('view engine', 'ejs');

// Custom middleware to expose the path
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// MongoDB connection
const dbURI = 'mongodb+srv://jorge:test1234@node.jnznlo6.mongodb.net/node?retryWrites=true&w=majority&appName=Node';

mongoose.connect(dbURI)
  .then(() => {
    app.listen(3000, () => {
      console.log('Server running on port 3000 and MongoDB connected');
    });
  })
  .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
  res.redirect('/blogs');
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

app.get('/blogs/create', (req, res) => {
  res.render('create', { title: 'Create a new blog' });
});

app.get('/blogs', (req, res) => {
  Blog.find().sort({ createdAt: -1 })
    .then(result => {
      res.status(200).json({ blogs: result, title: 'All blogs' })
      //res.render('index', { blogs: result, title: 'All blogs' });
    })
    .catch(err => console.log(err));
});

app.post('/blogs', (req, res) => {
  const blog = new Blog(req.body);

  blog.save()
    .then(() => {
      res.redirect('/blogs');
    })
    .catch(err => console.log(err));
});

app.get('/blogs/:id', (req, res) => {
  const id = req.params.id;

  Blog.findById(id)
    .then(result => {
      res.render('details', { blog: result, title: 'Blog Details' });
    })
    .catch(err => console.log(err));
});

app.delete('/blogs/:id', (req, res) => {
  const id = req.params.id;

  Blog.findByIdAndDelete(id)
    .then(() => {
      res.json({ redirect: '/blogs' });
    })
    .catch(err => console.log(err));
});

// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});
