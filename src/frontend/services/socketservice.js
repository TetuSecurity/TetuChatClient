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
    connect:function(host, callback){
      if(!!socket){
        return callback();
      }
      target = host;
      var m = io.Manager(host,{reconnection: false, timeout: 2000});
      m.once('connect_error', function(err){
        socket.disconnect();
        socket = null;
        return callback(err);
      });
      m.once('connect_timeout', function(){
        socket.disconnect();
        socket = null;
        return callback('connection timed out');
      });
      socket = io.connect(host);
      socket.once('connected', function(){
        return callback();
      });
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
