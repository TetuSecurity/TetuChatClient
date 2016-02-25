app.controller('ChatCtrl', function ($scope, $interval, $timeout, authService) {
  var remote = require('electron').remote;
  var ipc = require("electron").ipcRenderer;
  var fs = require('fs');
  var uuid = require('node-uuid');
  var ioclient = remote.require('./sockets.js');
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

  $scope.isActive=function(username){
    for(var i=0; i<$scope.friends.length; i++){
      if($scope.friends[i].Username === username){
        return $scope.friends[i].Active;
      }
    }
    return false;
  };

  $scope.sendMessage = function(){
    ipc.send('encrypt-request', $scope.chatInput.Text, $scope.messagePartners[$scope.focus].PublicKey, $scope.focus);
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Message: $scope.chatInput.Text});
    $scope.chatInput = {};
    ipc.on('encrypt-response', function(event, envelope){
      ioclient.emit('message', {To:envelope.To, Message:envelope.Data, Signature: envelope.Signature});
    });
  };

  $scope.sendFile=function(file){
    var fname = file.replace(/(.*[/\\])?([^/\\.]+\.[a-zA-Z0-9.]*)$/mig, '$2');
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Type: 'FILE', Message: 'sent file: '+ fname});
    var fbuffer = fs.readFileSync(file);
    var fsize = fbuffer.length;
    var fid = uuid.v4();
    var pos = 0;
    var psize = rsa.getMaxMessageSize();
    var totpieces = Math.ceil(fsize/psize);
    while(fbuffer.length>0){
      var packet = fbuffer.slice(0,psize);
      fbuffer = fbuffer.slice(psize,fbuffer.length);
      var enc_pack = rsa.encryptFile(packet, $scope.messagePartners[$scope.focus].PublicKey);
      ioclient.emit('filetransfer', {ID: fid, FileName:fname, FileSize: fsize, To: $scope.focus, Position: pos, Total: totpieces, Data: enc_pack.Data, Signature: enc_pack.Signature});
      pos++;
    }
  };

  $scope.clickFile =function(){
    angular.element('#sendfile').trigger('click');
  };

  $scope.openChat=function(friend){
    if(!(friend.Username in $scope.messagePartners)){
      $scope.messagePartners[friend.Username]={Username: friend.Username, Messages:[]};
      ioclient.emit('getKey', friend.Username);
    }
    $scope.focus = friend.Username;
    $scope.messagePartners[$scope.focus].newMessage= false;
  };

  $scope.fileNameChanged = function(ele){
    var file = ele.files[0];
    $scope.sendFile(file.path);
  };

  ioclient.on('getKeyResponse', function(data){
    if(data.Error){
      console.log(data.Error);
    }
    else if(data.Success){
      if(data.Username in $scope.messagePartners){
        $scope.messagePartners[data.Username].PublicKey= data.Key;
      }
      $scope.$apply();
    }
    else{
      console.log(data);
    }
  });

  ioclient.on('message', function(data){
    var author = data.From;
    if(!(author in $scope.messagePartners)){
      $scope.messagePartners[author] = {Username: author, Messages: []};
      ioclient.emit('getKey', data.From);
    }
    ipc.send('decrypt-request', data.Message, data.Signature, author);
    ipc.on('decrypt-response', function(event, res){
      console.log(res);
      $scope.messagePartners[res.From].Messages.push({From: res.From, Message: res.Data});
      if(res.From !== $scope.focus){
        $scope.messagePartners[res.From].newMessage= true;
      }
      $scope.$apply();
    });
  });

  ioclient.on('filetransfer', function(data){
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
    }
    $scope.files[data.ID].Contents[data.Position] = rsa.decryptFile({Data: data.Data, Signature: data.Signature});
    $scope.files[data.ID].Progress = (($scope.files[data.ID].Contents.length/$scope.files[data.ID].Total)*100);
    if($scope.files[data.ID].Contents.length == $scope.files[data.ID].Total){
      $scope.files[data.ID]= {FileName: $scope.files[data.ID].FileName, Contents: Buffer.concat($scope.files[data.ID].Contents, data.FileSize), Status:'DONE'};
    }
    $scope.$apply();
  });

  ioclient.on('friendsupdate', function(data){
    getFriends();
  });

  getFriends();
});
