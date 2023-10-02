const errorConstants = require('http2').constants;
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.createMovie = async (req, res, next) => {
  try {
    const card = await Movie.create({
      ...req.body,
      owner: req.user._id,
    });

    res
      .status(errorConstants.HTTP_STATUS_CREATED)
      .send(card);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Переданы некорректные данные при создании карточки'));
    } else {
      next(error);
    }
  }
};

module.exports.getMovies = async (req, res, next) => {
  try {
    const cards = await Movie.find({});
    res.send(cards);
  } catch (e) {
    next(e);
  }
};

module.exports.deleteMovie = async (req, res, next) => {
  Movie.findById(req.params.movieId)
    .orFail()
    .then((card) => {
      if (!card.owner.equals(req.user._id)) {
        next(new ForbiddenError('Вы не можете удалять чужие фильмы'));
      }
      Movie.deleteOne({ _id: req.params.movieId })
        .orFail()
        .then(() => res.send({ message: 'Фильм успешно удалена' }))
        .catch((error) => {
          if (error instanceof mongoose.Error.CastError) {
            next(new BadRequestError('Некорректный id'));
          } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
            next(new NotFoundError('Фильм с указанным id не найдена'));
          } else {
            next(error);
          }
        });
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Фильм с указанным id не найдена'));
      } else {
        next(error);
      }
    });
};
