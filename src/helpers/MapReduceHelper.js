const getWordCountMapReduceObject = () => {
  const mapReducer = {};

  mapReducer.map = function () {
    var text = this.title;

    if (text) {
        var words = text.toLowerCase().split(' ');

        for (var i = words.length - 1; i >= 0; i--) {
            if (words[i]) {
                emit(words[i], 1);
            }
        }
    }
  };

  mapReducer.reduce = function (k, values) {
    var count = 0;

    values.forEach(function (value) {
      count += value;
    });

    return count;
  };

  mapReducer.resolveToObject = true;

  return mapReducer;
};

module.exports = {
  getWordCountMapReduceObject
};
