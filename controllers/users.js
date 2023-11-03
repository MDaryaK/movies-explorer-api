const errorConstants = require('http2').constants;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');

module.exports.addUser = async (req, res, next) => {
  const {
    name,
    email,
    password,
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
    });

    res
      .status(errorConstants.HTTP_STATUS_CREATED)
      .send({
        name: user.name,
        email: user.email,
      });
  } catch (error) {
    if (error.code === 11000) {
      next(new ConflictError('Пользователь с таким email уже зарегистрирован'));
    } else if (error instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
    } else {
      next(error);
    }
  }
};

module.exports.updateUserInfo = async (req, res, next) => {
  const { name, email } = req.body;

  try {
    const checkUser = await User.findOne({ email });

    console.log(checkUser, req.body, req.user);

    if (checkUser && (checkUser.email === email && String(checkUser._id) !== String(req.user._id))) {
      next(new ConflictError('Email занят'));
      return;
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
      name,
      email,
    }, {
      new: true,
      runValidators: true,
    });

    res.send(user);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
    } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError('Пользователь с указанным id не найден'));
    } else {
      next(error);
    }
  }
};

module.exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findUserByCredentials(email, password);
    const token = jwt.sign({ _id: user._id }, 'some-jwt-key');

    res.send({ token });
  } catch (error) {
    next(error);
  }
};

module.exports.getUserInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.send(user);
  } catch (error) {
    next(error);
  }
};
