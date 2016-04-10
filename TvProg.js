var tvModule = require('tvModule'),
    epgData,
    tvSocket;

exports.init = function () {
    info('[ TvProg ] is initializing ... (v%s)', Config.modules.TvProg.version);
}

exports.action = function (data, next) {
    info('[ TvProg ] is called ... %s', data);

    if (data.hasOwnProperty('update'))
        tvModule.writeXml(function (xmlClbk) {
            next({tts: 'chaines actualisées'});
            info('[ TvProg ] ',xmlClbk);
        });
    else {
        var sendData = data.hasOwnProperty('name') ? {chnl: data.id, ico: tvModule.allReplace(data.name.toLowerCase() + '.png')} : epgData;

        if (!sendData) return next({tts: 'chaine inconnue'});

        tvModule.sendEpg(sendData, function (sendClbk) {
            tvSocket.emit('send-info', sendClbk);
            epgData = sendClbk.epgData;

            if (data.hasOwnProperty('lbsend')) {
                if (!SARAH.exists('LiveboxRemote')) return next({ });
                next({tts: 'le programme est affiché sur la box'});
                SARAH.run('LiveboxRemote', {epg: sendClbk.channelId});
            } 
            else {
                next({tts: 'actuellement sur la chaine' + sendClbk.epgData.chnl + ': ' + sendClbk.epgFile.title});
            }
        });
    }
}

exports.socket = function ( io, socket ) {
    io.of('/tvprog').on('connection', function (socket) {
        tvSocket = socket;
        info('[ TvProg ] connected to portlet ...');
        tvSocket.on('tvprog', function ( msg ) { 
            info('[ TvProg ] %s ...', msg);
        });
        tvSocket.on('get-info', function (msg) {
            tvModule.sendEpg(msg, function (sendClbk) {
                tvSocket.emit('send-info', sendClbk);
                epgData = sendClbk.epgData;
            });
        });
    });
}

exports.dispose = function () {
    info('[ TvProg ] is disposed ...');
}
