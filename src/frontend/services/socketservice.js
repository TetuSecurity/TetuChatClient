app.factory('socketService', function(){
  var target;
  var socket;

	return {
    isConnected:function(){
      return !!socket;
    },
    getTarget:function(){
      return target;
    },
    connect:function(host){
      target = host;
      socket = io.connect(host);
    },
    on:function(channel, callback){
      if(socket){
        socket.on(channel, function(data){
          return callback(data);
        });
      }
      else{
        console.log('socket is not connected');
      }
    },
    once:function(channel, callback){
      if(socket){
        socket.once(channel, function(data){
          return callback(data);
        });
      }
      else{
        console.log('socket is not connected');
      }
    },
    emit:function(channel, data){
      if(socket){
        socket.emit(channel, data);
      }
      else{
        console.log('socket is not connected');
      }
    },
    removeAllListeners:function(channel){
      if(socket){
        socket.removeAllListeners(channel);
      }
      else{
        console.log('socket is not connected');
      }
    }
  };

});
