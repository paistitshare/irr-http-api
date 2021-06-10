const Post = require('../../model/PostModel');

const approxEquatorialRadius = 3963.2;

const getPosts = async () => {
  return await Post.find({});
}

const getPostsByQuery = async (longtitude, latitude, radius = 10) => {
  return await Post.find({
    location: {
      $geoWithin: {
        $centerSphere: [
          [ longtitude, latitude ],
          radius / approxEquatorialRadius
        ]
      }
    }
  });
}

module.exports = {
  getPosts,
  getPostsByQuery
};
