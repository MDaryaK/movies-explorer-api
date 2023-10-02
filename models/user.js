const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const UnauthorizedError = require('../errors/UnauthorizedError');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator(email) {
        validator.isEmail(email);
      },
      message: 'Введите email',
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

userSchema.statics.findUserByCredentials = async function findUserByCredentials(email, password) {
  const user = await this.findOne({ email }).select('+password');

  if (!user) {
    throw new UnauthorizedError('Пользователь не найден');
  }

  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    throw new UnauthorizedError('Пароль не подходит');
  }

  return user;
};

module.exports = mongoose.model('user', userSchema);
