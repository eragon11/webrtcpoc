'use strict';

window.addEventListener('load', function () {
  // Chat platform
  var chatTemplate = Handlebars.compile($('#chat-template').html());
  var chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
  var chatEl = $('#chat');
  var formEl = $('.form');
  var messages = [];
  var username = void 0;

  // Local Video
  var localImageEl = $('#local-image');
  var localVideoEl = $('#local-video');

  // Remote Videos
  var remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
  var remoteVideosEl = $('#remote-videos');
  var remoteVideosCount = 0;

  // Hide cameras until they are initialized
  localVideoEl.hide();

  // Add validation rules to Create/Join Room Form
  formEl.form({
    fields: {
      roomName: 'empty',
      username: 'empty'
    }
  });

  // create our webrtc connection
  var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'local-video',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: 'remote-videos',
    // immediately ask for camera access
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,
    autoAdjustMic: false
  });

  // We got access to local camera
  webrtc.on('localStream', function () {
    localImageEl.hide();
    localVideoEl.show();
  });

  // Remote video was added
  webrtc.on('videoAdded', function (video, peer) {
    // eslint-disable-next-line no-console
    var id = webrtc.getDomId(peer);
    var html = remoteVideoTemplate({ id: id });
    if (remoteVideosCount === 0) {
      remoteVideosEl.html(html);
    } else {
      remoteVideosEl.append(html);
    }
    $('#' + id).html(video);
    $('#' + id + ' video').addClass('ui image medium'); // Make video element responsive
    remoteVideosCount += 1;
  });

  // Update Chat Messages
  var updateChatMessages = function updateChatMessages() {
    var html = chatContentTemplate({ messages: messages });
    var chatContentEl = $('#chat-content');
    chatContentEl.html(html);
    // automatically scroll downwards
    var scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({ scrollTop: scrollHeight }, 'slow');
  };

  // Post Local Message
  var postMessage = function postMessage(message) {
    var chatMessage = {
      username: username,
      message: message,
      postedOn: new Date().toLocaleString('en-GB')
    };
    // Send to all peers
    webrtc.sendToAll('chat', chatMessage);
    // Update messages locally
    messages.push(chatMessage);
    $('#post-message').val('');
    updateChatMessages();
  };

  // Display Chat Interface
  var showChatRoom = function showChatRoom(room) {
    formEl.hide();
    var html = chatTemplate({ room: room });
    chatEl.html(html);
    var postForm = $('form');
    postForm.form({
      message: 'empty'
    });
    $('#post-btn').on('click', function () {
      var message = $('#post-message').val();
      postMessage(message);
    });
    $('#post-message').on('keyup', function (event) {
      if (event.keyCode === 13) {
        var message = $('#post-message').val();
        postMessage(message);
      }
    });
  };

  // Register new Chat Room
  var createRoom = function createRoom(roomName) {
    // eslint-disable-next-line no-console
    console.info('Creating new room: ' + roomName);
    webrtc.createRoom(roomName, function (err, name) {
      formEl.form('clear');
      showChatRoom(name);
      postMessage(username + ' created chatroom');
    });
  };

  // Join existing Chat Room
  var joinRoom = function joinRoom(roomName) {
    // eslint-disable-next-line no-console
    console.log('Joining Room: ' + roomName);
    webrtc.joinRoom(roomName);
    showChatRoom(roomName);
    postMessage(username + ' joined chatroom');
  };

  // Receive message from remote user
  webrtc.connection.on('message', function (data) {
    if (data.type === 'chat') {
      var message = data.payload;
      messages.push(message);
      updateChatMessages();
    }
  });

  // Room Submit Button Handler
  $('.submit').on('click', function (event) {
    if (!formEl.form('is valid')) {
      return false;
    }
    username = $('#username').val();
    var roomName = $('#roomName').val().toLowerCase();
    if (event.target.id === 'create-btn') {
      createRoom(roomName);
    } else {
      joinRoom(roomName);
    }
    return false;
  });
});