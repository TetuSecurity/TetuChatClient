var fs = require('fs');

module.exports={
    write:function(data){
      fs.writeFileSync('./data.json', JSON.stringify(data));
    },
    read: function(){
      return JSON.parse(fs.readFileSync('./data.json'));
    }
}
