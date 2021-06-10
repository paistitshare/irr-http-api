const wordActions = require('./WordActions');

const getWords = (req, res) => {
  wordActions
    .getWords()
    .then(words => res.status(200).json(words))
    .catch(() => res.sendStatus(422));
}

module.exports = {
  getWords,
};
