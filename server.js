const { program} = require('commander');
const fs = require('fs');
const path = require('path');
const multer  = require('multer');
const express = require('express');
const app = express();
const upload = multer();
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

app.use(cors());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Note API',
      version: '1.0.0',
      description: 'API для роботи з нотатками',
    },
    servers: [
      {
        url: 'http://127.0.0.1:8008',
      },
    ],
  },
  apis: ['./server.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory path')
  .parse(process.argv);

const options = program.opts();

const host = options.host;
const port = options.port;
const cachePath = options.cache;

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати вміст певної нотатки
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     responses:
 *       200:
 *         description: Вміст нотатки
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатку не знайдено
 */
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  const note = fs.readFileSync(notePath, 'utf8');
  res.send(note);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити існуючу нотатку
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Нотатку оновлено
 *       404:
 *         description: Нотатку не знайдено
 */
app.put('/notes/:name', express.text(), (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.writeFileSync(notePath, req.body);
  res.send('Note updated');
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     responses:
 *       200:
 *         description: Нотатку видалено
 *       404:
 *         description: Нотатку не знайдено
 */
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name);
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Note not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати список усіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   text:
 *                     type: string
 */
app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cachePath).map((filename) => ({
    name: filename,
    text: fs.readFileSync(path.join(cachePath, filename), 'utf8'),
  }));
  res.json(notes);
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Нотатку створено
 *       400:
 *         description: Нотатка вже існує
 */
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

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Завантажити HTML-форму з файлу
 *     responses:
 *       200:
 *         description: HTML-форма успішно завантажена
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
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
    res.send('Сервер працює!!!');
  });
 