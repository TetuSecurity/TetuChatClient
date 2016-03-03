app.controller('ChatCtrl', function ($scope, $http, authService) {
  var remote = require('electron').remote;
  var ipc = require('electron').ipcRenderer;
  var fs = require('fs');
  var uuid = require('node-uuid');
  var ioclient = remote.require('./sockets.js'); //replace with socket service
  $scope.messagePartners = {};
  $scope.focus = null;
  $scope.friends = [];
  $scope.chatInput={};
  $scope.files={};


  function getFriends(){
    ioclient.emit('getFriends', authService.getUser().Username);
    ioclient.on('getFriendsResponse', function(data){
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
  }

  function getKey(username, callback){
    $http.get('https://chatserv1.tetusecurity.com:4321/key/'+username).then(function(res){
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
    var pos = 0;
    var psize = 8*8*1024; // arbitrary 8KB packet size
    var totpieces = Math.ceil(fsize/psize);
    while(fbuffer.length>0){
      var packet = fbuffer.slice(0,psize);
      fbuffer = fbuffer.slice(psize,fbuffer.length);
      var envelope = {ID: fid, FileName:fname, FileSize: fsize, To: $scope.focus, Position: pos, Total: totpieces, Data: packet, PublicKey: $scope.messagePartners[$scope.focus].PublicKey};
      ipc.send('encrypt-request', envelope);
      pos++;
    }
  };

  $scope.clickFile =function(){
    angular.element('#sendfile').trigger('click');
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

  $scope.fileNameChanged = function(ele){
    var file = ele.files[0];
    $scope.sendFile(file.path);
  };

  $scope.downloadFile=function(ID){
    var file = $scope.files[ID];
    fs.writeFileSync('X:/tetufiles/'+file.FileName, file.Contents);
  };

  ipc.on('encrypt-response', function(event, envelope){
    if('FileName' in envelope){
      ioclient.emit('filetransfer', envelope);
    }
    else{
      ioclient.emit('message', {To:envelope.To, Message:envelope.Data, Signature: envelope.Signature, Key: envelope.Key});
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

  ioclient.on('message', function(data){
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

  ioclient.on('filetransfer', function(data){
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

  ioclient.on('friendsupdate', function(data){
    getFriends();
  });

  getFriends();
});
