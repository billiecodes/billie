const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_LIMIT = parseInt(process.env.UPLOAD_LIMIT, 10);

// Parse users from environment variable
const users = process.env.USERS.split(',').map(user => {
  const [username, password, email] = user.split(':');
  return { username, password, email };
});

app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const uploadSchema = new mongoose.Schema({
  email: String,
  fileName: String,
  uploadDate: { type: Date, default: Date.now }
});

const Upload = mongoose.model('Upload', uploadSchema);

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.session.loggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const email = req.session.email;
    console.log(`Received upload request from ${email}`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const uploadCount = await Upload.countDocuments({
      email: email,
      uploadDate: { $gte: startOfDay }
    });

    console.log(`Upload count for ${email} today: ${uploadCount}`);

    if (uploadCount >= UPLOAD_LIMIT) {
      console.log(`Upload limit reached for ${email}`);
      return res.status(400).json({ error: 'Upload limit reached' });
    }

    const newUpload = new Upload({
      email: email,
      fileName: req.file.filename
    });

    await newUpload.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Photo Upload Confirmation',
      text: 'Your photo has been successfully uploaded.',
      attachments: [
        {
          filename: req.file.filename,
          path: path.join(__dirname, 'uploads', req.file.filename)
        }
      ]
    };

    console.log('Sending email to:', email);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email');
      }
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'File uploaded and email sent successfully' });
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.loggedIn = true;
    req.session.email = user.email;
    req.session.username = user.username;
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
