!function ($) {
  var tvSocket = false;
  
  var registerSocketIO = function () {
    var epgData = localStorage.getItem('epgData');
    if (epgData == null) localStorage.setItem('epgData', JSON.stringify({chnl:1, ico: "tf1.png"}));
    epgData = JSON.parse(localStorage.getItem('epgData'));

    tvSocket = io('/tvprog');
    tvSocket.emit('tvprog', 'connected to portlet');
    tvSocket.emit('get-info', epgData);

    tvSocket.on('send-info', function (msg) {
      $('#epgIcon').attr('src', "data:image/png;base64," + msg.epgIcon).css({'width':'126px', 'height':'71px'});
      $('.epgText').text(msg.epgFile.title);
      $('#epgPrev').attr('src', msg.epgFile.imageUrl).css({'width':'100%', 'height':'100%'});
      localStorage.setItem('epgData', JSON.stringify(msg.epgData));
    });
  }
  
  var register = function () {
    registerSocketIO();
  }

  $(document).ready(function() {
    register();
  });
  
}(jQuery);
