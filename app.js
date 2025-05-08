const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Blog = require('./models/blog');
const Note = require('./models/note');
const Folder = require('./models/folder');
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


// Return notes all info
app.get('/notes', (req, res) => {
  const allNotesArr = [];
  const pinnedNotesArr = [];
  const otherNotesArr = [];
  const discardNotesArr = [];
  const folderArr = []

  const getFolders = Folder.find().sort({ createdAt: -1 }).exec();
  const getNotes = Note.find().sort({ createdAt: -1 }).exec();

  console.log(getNotes);

  Promise.all([getFolders, getNotes])
    .then(([foldersResult, notesResult]) => {
      foldersResult.forEach(folder => {
        folderArr.push(folder);
      });

      notesResult.forEach(note => {
        if (note.discard === true) {
          discardNotesArr.push(note);
        } else {
          allNotesArr.push(note);
          if (note.pinned === true) {
            pinnedNotesArr.push(note);
          } else {
            otherNotesArr.push(note);
          }
        }
      });
      res.json({ allNotes: allNotesArr, pinnedNotes: pinnedNotesArr, otherNotes: otherNotesArr, discardNotes: discardNotesArr, folders : folderArr});
    })
    .catch(err => console.log(err));
});

// Return folders
app.get('/folders', async (req, res) => {
    const folders = await Folder.find().sort({ createdAt: -1 }).exec();
    const notes = await Note.find().sort({ createdAt: -1 }).exec();

    const foldersWithNotes = {};

    folders.forEach(folder => {
      foldersWithNotes[folder.folder] = [];
    });

    // Populate the notes into their respective folder arrays
    notes.forEach(note => {
      if (foldersWithNotes.hasOwnProperty(note.folder) && note.discard == false) {
        foldersWithNotes[note.folder].push(note);
      }
    });

    res.json(foldersWithNotes);
});

// Create note
app.post('/createNote', (req, res) => {
    const note = new Note({
    title: req.body.title,
    body: req.body.body
  });

   note.save()
    .catch(err => console.log(err));
});

// Create folder
app.post('/createFolder', (req, res) => {
  const folder = new Folder({
    folder: req.body.folder
  });

 folder.save().then(res.redirect('/notes'))
  .catch(err => console.log(err));
});

// Discard note
app.patch('/note/:id/discard', async (req,res) => {
  const noteId = req.params.id;

  const updatedNote = await Note.findByIdAndUpdate(
    noteId,
    { discard: true },
    { new: true }
  );
  res.redirect('/notes');
});

// Recover note
app.patch('/note/:id/recover', async (req,res) => {
  const noteId = req.params.id;

  const updatedNote = await Note.findByIdAndUpdate(
    noteId,
    { discard: false },
    { new: true }
  );
  res.redirect('/notes');
});

// Pin note
app.patch('/note/:id/pin', async (req,res) => {
  const noteId = req.params.id;

  const updatedNote = await Note.findByIdAndUpdate(
    noteId,
    { pinned: true },
    { new: true }
  );
  res.redirect('/notes');
});

// Unpin note
app.patch('/note/:id/unPin', async (req,res) => {
  const noteId = req.params.id;

  const updatedNote = await Note.findByIdAndUpdate(
    noteId,
    { pinned: false },
    { new: true }
  );
  res.redirect('/notes');
});

//Delete note completely
app.delete('/note/:id/delete', (req, res) => {
  const noteId = req.params.id;
  console.log('ID de la nota a eliminar (backend):', noteId);

  Note.findByIdAndDelete(noteId)
    .then(() => {
      res.json({ redirect: '/notes' });
    })
    .catch(err => console.log(err));
});

//Delete folder
app.delete('/folder/:id/delete', (req, res) => {
  const folderId = req.params.id;

  Folder.findByIdAndDelete(folderId)
    .then(() => {
      res.json({ redirect: '/folders' });
    })
    .catch(err => console.log(err));
});



app.get('/blogs/:id', (req, res) => {
  const id = req.params.id;

  Note.findById(id)
    .then(result => {
      res.render('details', { notes: result, title: 'Note Details' });
    })
    .catch(err => console.log(err));
});

/*
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
*/
