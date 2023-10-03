const express = require('express');
const mongoose = require('mongoose');
const { errors: celebrateErrors } = require('celebrate');
const helmet = require('helmet');
const cors = require('cors');

const limiter = require('./extensions/rateLimit');
const router = require('./routes/index');
const errors = require('./middlewares/errors');

const {
  PORT = 3000,
  URL = 'mongodb://localhost:27017/bitfilmsdb',
} = process.env;

const app = express();

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors({
  origin: '*',
}));

app.use(limiter);

app.use(helmet());
app.use(express.json());
app.use('/', router);

app.use(celebrateErrors());
app.use(errors);

app.listen(PORT);
