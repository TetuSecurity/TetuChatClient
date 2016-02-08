app.controller('ChatCtrl', function ($scope, $interval, $timeout, authService) {
  var remote = require('electron').remote;
  var fs = remote.require('fs');
  var uuid = remote.require('node-uuid');
  var ioclient = remote.require('./sockets.js');
  var rsa = remote.require('./rsa-engine')(ioclient);
  $scope.messages = [];
  $scope.messagePartners = {};
  $scope.focus = null;
  $scope.friends = [];
  $scope.chatInput={};
  $scope.typeTimeout = null;
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
    console.log(rsa.getMaxMessageSize());
    var enc = rsa.encrypt($scope.chatInput.Text, $scope.messagePartners[$scope.focus].PublicKey);
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Message: $scope.chatInput.Text});
    ioclient.emit('message', {To:$scope.focus, Message:enc});
    $scope.chatInput = {};
    $scope.messagePartners[$scope.focus].isTyping = false;
    if(!$scope.messagePartners[$scope.focus].typeTimer){
      $interval.cancel($scope.messagePartners[$scope.focus].typeTimer);
    }
  };

  $scope.sendFile=function(file){
    var fname = file.replace(/(.*[/\\])?([^/\\.]+\.[a-zA-Z0-9.]*)$/mig, '$2');
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
    console.log('sent ' + pos + ' packets');
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

  $scope.evaluateTyping=function(){
    if($scope.messagePartners)
    ioclient.emit('sending', {To: $scope.focus});
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
    var m = rsa.decrypt(data.Message);
    var author = data.From;
    if(!(author in $scope.messagePartners)){
      $scope.messagePartners[author] = {Username: author, Messages: []};
      ioclient.emit('getKey', data.From);
    }
    $scope.messagePartners[author].Messages.push({From: data.From, Message: m});
    if(author !== $scope.focus){
      $scope.messagePartners[author].newMessage= true;
    }
    $scope.$apply();
  });

  ioclient.on('sending', function(data){
    var author = data.From;
    if(author in $scope.messagePartners){
      $scope.messagePartners[author].partnerTyping = true;
      $scope.$apply();
      if($scope.messagePartners[author].partnerTypeTimer){
        $timeout.cancel($scope.messagePartners[author].partnerTypeTimer);
      }
      $scope.messagePartners[author].partnerTypeTimer = $timeout(function(){
        $scope.messagePartners[author].partnerTyping = false;
        $scope.$apply();
      }, 3000);
    }
  });

  ioclient.on('filetransfer', function(data){
    console.log(data);
    if(!(data.ID in $scope.files)){
      $scope.files[data.ID]= {
        ID: data.ID,
        FileName: data.FileName,
        FileSize: data.FileSize,
        Total : data.Total,
        Contents : []
      };
    }
    $scope.files[data.ID].Contents[data.Position] = rsa.decryptFile({Data: data.Data, Signature: data.Signature});
    console.log('File transfer ' + (($scope.files[data.ID].Contents.length/$scope.files[data.ID].Total)*100)+'% complete');
    if($scope.files[data.ID].Contents.length == $scope.files[data.ID].Total){
      var content = Buffer.concat($scope.files[data.ID].Contents, data.FileSize);
      fs.writeFileSync('./'+$scope.files[data.ID].FileName, content);
      console.log('file Written!');
    }
    $scope.$apply();
  });

  ioclient.on('friendsupdate', function(data){
    getFriends();
  });

  getFriends();
});
