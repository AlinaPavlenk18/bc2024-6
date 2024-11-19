const { program} = require('commander');
const fs = require('fs');
const path = require('path');
const multer  = require('multer');
const express = require('express');
const app = express();
const upload = multer();

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory path')
  .parse(process.argv);

const options = program.opts();

const host = options.host;
const port = options.port;
const cachePath = options.cache;

app.get('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  const note = fs.readFileSync(notePath, 'utf8');
  res.send(note);
});

app.put('/notes/:name', express.text(), (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.writeFileSync(notePath, req.body);
  res.send('Note updated');
});

app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cachePath).map((filename) => ({
    name: filename,
    text: fs.readFileSync(path.join(cachePath, filename), 'utf8'),
  }));
  res.json(notes);
});

app.post('/write',  upload.none(), (req, res) => {
  const noteName = req.body.note_name;
  const noteContent = req.body.note;
  const notePath = path.join(cachePath, noteName);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }

  fs.writeFileSync(notePath, noteContent);
  res.status(201).send('Note created');
});

app.get('/UploadForm.html', (req, res) => {
  const formPath = path.join(__dirname, 'UploadForm.html');
  res.sendFile(formPath);
});

// Перевірка наявності обов’язкових параметрів
if (!host || !port || !cachePath) {
    console.error('Error: all options --host, --port, and --cache are required');
    process.exit(1);
  }
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});

app.get('/', (req, res) => {
    res.send('Сервер працює!');
  });