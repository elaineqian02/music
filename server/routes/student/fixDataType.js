// node fixDateType
const mongoClient = require('mongodb').MongoClient;

mongoClient.connect('mongodb://127.0.0.1:27017/music', {useNewUrlParser: true }, function(err, db) {
  const musicDb = db.db("music");

  musicDb.collection("activities").find().forEach(function(data) {
    musicDb.collection("activities").updateOne({
        "_id": data._id
    }, {
        "$set": {
          "days": parseInt(data.days),
          "reps": parseInt(data.reps)
        }
    });
  })
});