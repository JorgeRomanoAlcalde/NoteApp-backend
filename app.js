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

// Edit note
app.patch('/note/:id/edit', async (req,res) => {
  const noteId = req.params.id;

  const { title, body } = req.body;


  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { title: title, body: body },
      { new: true }
    );

    if (!updatedNote) {
      console.warn(`Nota no encontrada para el ID: ${noteId}`);
      return res.status(404).json({ message: 'Note not found.' });
    }

    console.log('Nota actualizada exitosamente:', updatedNote);
    return res.status(200).json(updatedNote);

  } catch (error) {
    console.error('Error al actualizar la nota:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Create folder
app.post('/createFolder', (req, res) => {
  const folder = new Folder({
    folder: req.body.folder
  });

 folder.save().then(res.redirect('/notes'))
  .catch(err => console.log(err));
});

//Discard note
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

  Note.findByIdAndDelete(noteId)
    .then(() => {
      res.json({ redirect: '/notes' });
    })
    .catch(err => console.log(err));
});

//Delete folder
app.delete('/folder/:folderName/delete', (req, res) => {
  const folderName = req.params.folderName;

  Folder.findOneAndDelete({ folder: folderName })
    .then(deletedFolder => {
      if (deletedFolder) {
        res.json({ message: `Carpeta "${folderName}" eliminada exitosamente` });
      } else {
        res.status(404).json({ message: `No se encontró ninguna carpeta con el nombre "${folderName}"` });
      }
    })
});