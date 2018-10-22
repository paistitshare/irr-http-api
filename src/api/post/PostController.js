const postActions = require('./PostActions');

const getPosts = (req, res) => {
  if (req.query) {
    const latitude = req.query.lat;
    const longtitude = req.query.long;
    const radius = req.query.radius;

    return postActions
      .getPostsByQuery(longtitude, latitude, radius)
      .then(posts => res.status(200).json(posts))
      .catch((err) => {
        console.error(err);
        res.sendStatus(422)
      });
  }

  return postActions
      .getPosts()
      .then(posts => res.status(200).json(posts))
      .catch((err) => {
        console.error(err);
        res.sendStatus(422)
      });
}

module.exports = {
  getPosts,
};
