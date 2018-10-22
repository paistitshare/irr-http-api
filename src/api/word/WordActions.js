const Post = require('../../model/PostModel');
const mapReduceHelper = require('../../helpers/MapReduceHelper');

const getWords = async () => {
  const mapReducer = mapReduceHelper.getWordCountMapReduceObject();
  const mapReducePromise = Post.mapReduce(mapReducer);

  return await mapReducePromise.then(function (dbResponse) {
    const sortedResults = dbResponse.results
      .sort((prevResultRow, nextResultRow) => nextResultRow.value - prevResultRow.value);
    const preparedResponse = {};

    sortedResults.forEach((resultRow) => preparedResponse[resultRow._id] = resultRow.value);

    return preparedResponse;
  });
}

module.exports = {
  getWords
};
