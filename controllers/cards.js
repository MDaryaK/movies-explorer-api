const errorConstants = require('http2').constants;
const mongoose = require('mongoose');
const Card = require('../models/card');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.createCard = async (req, res, next) => {
  const { name, link } = req.body;

  try {
    const card = await Card.create({
      name,
      link,
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

module.exports.getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({});
    res.send(cards);
  } catch (e) {
    next(e);
  }
};

module.exports.deleteCard = async (req, res, next) => {
  Card.findById(req.params.cardId)
    .orFail()
    .then((card) => {
      if (!card.owner.equals(req.user._id)) {
        next(new ForbiddenError('Вы не можете удалять чужие карточки'));
      }
      Card.deleteOne({ _id: req.params.cardId })
        .orFail()
        .then(() => res.send({ message: 'Карточка успешно удалена' }))
        .catch((error) => {
          if (error instanceof mongoose.Error.CastError) {
            next(new BadRequestError('Некорректный id'));
          } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
            next(new NotFoundError('Карточка с указанным id не найдена'));
          } else {
            next(error);
          }
        });
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Карточка с указанным id не найдена'));
      } else {
        next(error);
      }
    });
};

module.exports.addLike = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.cardId, {
      $addToSet: {
        likes: req.user._id,
      },
    }, {
      new: true,
    }).orFail();

    res.send(card);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Некорректный id'));
    } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError('Карточка с указанным id не найдена'));
    } else {
      next(error);
    }
  }
};

module.exports.deleteLike = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.cardId, {
      $pull: {
        likes: req.user._id,
      },
    }, {
      new: true,
    }).orFail();

    res.send(card);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      next(new BadRequestError('Некорректный id'));
    } else if (error instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError('Карточка с указанным id не найдена'));
    } else {
      next(error);
    }
  }
};
