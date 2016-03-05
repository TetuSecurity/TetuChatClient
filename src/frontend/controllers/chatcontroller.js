app.controller('ChatCtrl', function ($scope, $http, authService, socketService) {
  var remote = require('remote');
  var dialog = remote.require('dialog');
  var ipc = require('electron').ipcRenderer;
  var fs = require('fs');
  var uuid = require('node-uuid');
  $scope.messagePartners = {};
  $scope.focus = null;
  $scope.friends = [];
  $scope.chatInput={};
  $scope.files={};


  function getFriends(){
    socketService.emit('getFriends', authService.getUser().Username);
  }

  function getKey(username, callback){
    $http.get(socketService.getTarget()+'key/'+username).then(function(res){
      var data = res.data;
      if(data.Success){
        $scope.messagePartners[data.Username].PublicKey= data.Key;
        return callback();
      }
      else{
        return callback(data.Error);
      }
    }, function(err){
      return callback(err);
    });
  }

  function initConvo(partner, callback){
    if(!(partner in $scope.messagePartners)){
      $scope.messagePartners[partner] = {Username: partner, Messages: []};
      getKey(partner, function(err){
        if(err){
          return callback(err);
        }
        else {
          return callback();
        }
      });
    }
    else{
      return callback();
    }
  }

  $scope.isActive=function(username){
    for(var i=0; i<$scope.friends.length; i++){
      if($scope.friends[i].Username === username){
        return $scope.friends[i].Active;
      }
    }
    return false;
  };

  $scope.sendMessage = function(){
    ipc.send('encrypt-request', {Data: new Buffer($scope.chatInput.Text), PublicKey: $scope.messagePartners[$scope.focus].PublicKey, To: $scope.focus});
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Message: $scope.chatInput.Text});
    $scope.chatInput = {};
  };

  $scope.sendFile=function(file){
    var fname = file.replace(/(.*[/\\])?([^/\\.]+\.[a-zA-Z0-9.]*)$/mig, '$2');
    console.log('sending file', fname);
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Type: 'FILE', Message: 'sent file: '+ fname});
    $scope.$apply();
    var fbuffer = fs.readFileSync(file);
    var fsize = fbuffer.length;
    var fid = uuid.v4();
    var psize = 8*8*1024; // arbitrary 8KB packet size
    var totpieces = Math.ceil(fsize/psize);
    for(var pos=0; pos<totpieces; pos++){
      var packet = fbuffer.slice(0,psize);
      fbuffer = fbuffer.slice(psize,fbuffer.length);
      var envelope = {ID: fid, FileName:fname, FileSize: fsize, To: $scope.focus, Position: pos, Total: totpieces, Data: packet, PublicKey: $scope.messagePartners[$scope.focus].PublicKey};
      ipc.send('encrypt-request', envelope);
    }
  };

  $scope.openChat=function(friend){
    initConvo(friend.Username, function(err){
      if(err){
        console.log(err);
      }
      else{
        $scope.focus = friend.Username;
        $scope.messagePartners[$scope.focus].newMessage= false;
      }
    });
  };

  $scope.clickFile=function(){
    dialog.showOpenDialog({title:'Choose a file', properties:['openFile']}, function(filenames){
      if(filenames && filenames.length>0){
        $scope.sendFile(filenames[0]);
      }
    });
  };

  $scope.saveFile=function(fileID){
    if(fileID in $scope.files){
      var file = $scope.files[fileID];
      var ext = file.FileName.substring(file.FileName.lastIndexOf('.')+1);
      dialog.showSaveDialog({
        title:'Save As',
        defaultPath:'./'+file.FileName,
        filters:[
          {name: 'All files', extensions:['*']},
          {name: ext, extensions:[ext]}
        ]
      }, function(savepath){
        if(savepath && savepath.length>0){
          fs.writeFileSync(savepath, file.Contents);
        }
      });
    }
    else{
      console.log('no such file');
    }
  };

/*
  Background process events
*/

  ipc.on('encrypt-response', function(event, envelope){
    if('FileName' in envelope){
      socketService.emit('filetransfer', envelope);
    }
    else{
      socketService.emit('message', {To:envelope.To, Message:envelope.Data, Signature: envelope.Signature, Key: envelope.Key});
    }
  });

  ipc.on('decrypt-response', function(event, res){
    if('FileName' in res){
      $scope.files[res.ID].Contents[res.Position] = res.Data;
      $scope.files[res.ID].Progress = (($scope.files[res.ID].Contents.length/$scope.files[res.ID].Total)*100);
      if($scope.files[res.ID].Contents.length == $scope.files[res.ID].Total){
        $scope.files[res.ID]= {FileName: $scope.files[res.ID].FileName, Contents: Buffer.concat($scope.files[res.ID].Contents, res.FileSize), Status:'DONE'};
      }
    }
    else{
      $scope.messagePartners[res.From].Messages.push({From: res.From, Message: res.Data.toString('utf8')});
    }
    if(res.From !== $scope.focus){
      $scope.messagePartners[res.From].newMessage= true;
    }
    $scope.$apply();
  });

/*
  Socket events
*/

  socketService.on('message', function(data){
    var author = data.From;
    initConvo(author, function(err){
      if(err){
        console.log(err);
      }
      else{
        ipc.send('decrypt-request', {Data: data.Message, Signature: data.Signature, Key:data.Key, From:author, PublicKey:$scope.messagePartners[author].PublicKey});
      }
    });
  });

  socketService.on('filetransfer', function(data){
    initConvo(data.From, function(err){
      if(err){
        console.log(err);
      }
      if(!(data.ID in $scope.files)){
        $scope.files[data.ID]= {
          ID: data.ID,
          FileName: data.FileName,
          FileSize: data.FileSize,
          Total : data.Total,
          Progress: 0,
          Status: 'IN PROGRESS',
          Contents : []
        };
        $scope.messagePartners[data.From].Messages.push({From: data.From, Type: 'FILE', ID:data.ID});
        $scope.$apply();
      }
      data.PublicKey = $scope.messagePartners[data.From].PublicKey;
      ipc.send('decrypt-request', JSON.parse(JSON.stringify(data)));
    });
  });

  socketService.on('friendsupdate', function(data){
    getFriends();
  });

  socketService.on('getFriendsResponse', function(data){
    if(data.Error){
      console.log(data.Error);
    }
    else if(data.Success){
      $scope.friends= data.Friends;
      $scope.$apply();
    }
    else{
      console.log(data);
    }
  });

  getFriends();
});
