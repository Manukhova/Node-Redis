const { MAX_RANDOM_STRING_LENGTH } = require('./config');

const getRandomString = () => {
  const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  let randomWord = '';

  for (let i = 0; i < MAX_RANDOM_STRING_LENGTH; i++) {
    randomWord += alphabet[Math.round(Math.random() * (alphabet.length - 1))];
  }

  return randomWord;
};

module.exports = {
  getRandomString
};
