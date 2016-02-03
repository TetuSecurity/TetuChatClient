app.controller('ChatCtrl', function ($scope, authService) {
  var remote = require('electron').remote;
  var ioclient = remote.require('./sockets.js');
  var rsa = remote.require('./rsa-engine')(ioclient);
  $scope.messages = [];
  $scope.messagePartners = {};
  $scope.focus = null;
  $scope.friends = [];
  $scope.chatInput={};
  $scope.friendSearch={};

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
  };

  getFriends();

  $scope.isActive=function(username){
    for(var i=0; i<$scope.friends.length; i++){
      if($scope.friends[i].Username === username){
        return $scope.friends[i].Active;
      }
    }
    return false;
  };

  $scope.sendMessage = function(){
    var enc = rsa.encrypt($scope.chatInput.Text, $scope.messagePartners[$scope.focus].PublicKey);
    $scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Message: $scope.chatInput.Text});
    ioclient.emit('message', {To:$scope.focus, Message:enc});
    $scope.chatInput = {};
  };

  $scope.openChat=function(friend){
    if(!(friend.Username in $scope.messagePartners)){
      $scope.messagePartners[friend.Username]={Username: friend.Username, Messages:[]};
      ioclient.emit('getKey', friend.Username);
    }
    $scope.focus = friend.Username;
    $scope.messagePartners[$scope.focus].newMessage= false;
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
      $scope.messagePartners[author].newMessage= true
    }
    console.log($scope.messagePartners);
    $scope.$apply();
  });

  ioclient.on('friendsupdate', function(data){
    getFriends();
  });

});
