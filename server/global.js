const crypto = require('crypto');
const password = 'mypassword';

module.exports = {
  dbConnection: 'mongodb://127.0.0.1:27017/music',
  formatDateToString: function(date) {
    return date.toLocaleDateString("en-US");
  },

  encrypt: function(value) {
    const mykey = crypto.createCipher('aes-128-cbc', password);
    var mystr = mykey.update(value, 'utf8', 'hex')
    mystr += mykey.final('hex');
    
    console.log(mystr);
    return mystr;
  },
  
  decrypt: function(value, res) {
    try {
      const mykey = crypto.createDecipher('aes-128-cbc', password);
      var mystr = mykey.update(value, 'hex', 'utf8')
      mystr += mykey.final('utf8');
  
      return mystr;
      }
    catch(err) {
      res.redirect("/error");
    }    
  },

  checkTeacherSecurity: function(req, res) {
    var tid = req.cookies['tid'];
    if (tid === undefined) {
      res.redirect('/');
    }
  },

  checkStudentSecurity: function(req, res) {
    var sid = req.cookies['sid'];
    if (sid === undefined) {
      res.redirect("/error");
    }
  }
};