// node fixDateType2
const mongoClient = require('mongodb').MongoClient;
console.log(mongoClient);

mongoClient.connect('mongodb://127.0.0.1:27017/music', {useNewUrlParser: true }, function(err, db) {
  console.log(err);
  const musicDb = db.db("music");

  musicDb.collection("activities").find().forEach(function(data) {
    console.log(data);
    musicDb.collection("activities").updateOne({
        "_id": data._id
    }, {
        "$set": {
          "dueDate": new Date(data.dueDate)
        }
    });
  })
});