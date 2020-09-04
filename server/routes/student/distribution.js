function findLeastCountBucket(dayActivities) {
  var leastCount = 1000;
  for (let i = 0; i < dayActivities.length; i ++) {
    if (dayActivities[i].activities.length < leastCount) {
      leastCount = dayActivities[i].activities.length;
    }
  }

  while (true) {
    var random = Math.floor(Math.random() * dayActivities.length);
    if (dayActivities[random].activities.length === leastCount) {
      return random;
    }
  }
}

module.exports = {
  distributeActivities: function (activities) {
    var result = {
      dueDate: activities[0].dueDate
    };

    const today = new Date();
    const dueDate = new Date(result.dueDate);
    
    var res = Math.abs(dueDate - today) / 1000;
    var numDaysToDueDate = Math.floor(res / 86400);

    result.dayActivities = new Array();
    for (let i = 0; i <= numDaysToDueDate; i ++) {
      var dt = new Date();
      dt.setDate( dt.getDate() + i);
      result.dayActivities.push({ date: dt.toLocaleDateString("en-US"), activities:[] });
    }

    var index = 1;
    for (let i = 0; i < activities.length; i ++) {
      for (let j = 0; j < activities[i].days; j ++) {
        var leastIndex = findLeastCountBucket(result.dayActivities);
        result.dayActivities[leastIndex].activities.push({ index: index, activity: activities[i].activity, reps: activities[i].reps });
        index++;
      }
    }

    result.numPractices = index;
    result.ended = false;
    return result;
  }
};