
function writeXml (xmlClbk) {
    var fs = require('fs'),
        file = __dirname + '\\' + 'TvProg.xml',
        xml  = fs.readFileSync ( file, 'utf8' ).replace( /§[^§]+§/gm, "§ -->\n<!-- §" ), // Deleting
        pos = xml.search( /<!-- §/gm ),
        tab  ='\n\t\t\t',
        writeXml = xml.slice( 0, pos ) + '\t\t<one-of>'+ tab,
        end = xml.slice(pos);
    getEpg( function (epgFile) {
        epgFile = epgFile.channels.channel;
        for (var i= 0; i < epgFile.length; i++) {
            var tag = '<tag>out.action.id = "' + (i+1) + '"; out.action.img="' + epgFile[i].image + '";out.action.name="'+ epgFile[i].name+'";</tag>'
            writeXml = writeXml + tab + '<item>' + (i+1) + tag + '</item>' + tab + '<item>' + epgFile[i].name + tag +'</item>\n';
        }
        writeXml = writeXml + '\n\t\t</one-of>'+ tab + end;
        fs.writeFileSync ( file, writeXml, 'utf8' );
        xmlClbk('Ecriture des chaines: OK');
    });

}

function getEpg (epgFile) {
    var options = {
        url : 'http://lsm-rendezvous040413.orange.fr/API/',
        qs : {'api_token' : 'be906750a3cd20d6ddb47ec0b50e7a68', 'output' : 'json', 'withChannels' : '1'}
    };
    require('request') (options, function (err, response, body) {
        !err && response.statusCode == 200 ? epgFile(JSON.parse(body)) : error('[ LiveboxRemote ]' + err);
    });
}

function sendEpg (epgData, sendClbk) {
    getEpg( function (epgFile) {
        require('fs').readFile(__dirname + '/www/images/icons/' + epgData.ico, function (err, buf) {
            sendClbk ({ epgIcon : buf.toString('base64'), epgFile : epgFile.diffusions.diffusion[epgData.chnl -1], epgData : epgData });
        });
    });
}

exports.action = function ( data, next ) {
    info('[ TvProg ] is called ...', data);
    if (data.hasOwnProperty('update'))
        writeXml(function (xmlClbk) {
            next({ tts: 'chaines actualisées'});
            info('[ TvProg ] ',xmlClbk);
        });
    else sendEpg({chnl: data.id, ico: data.img}, function (sendClbk) {
        next({ tts: 'actuellement sur la chaine' + data.id +'; ' + sendClbk.epgFile.title});
        sock.emit('send-info', sendClbk);
    });
}

exports.cron = function ( next ) {
    info('[ TvProg ] CRON is called ...');
}

exports.socket = function ( io, socket ) {
    sock = socket;
    socket.on('tvprog', function ( msg ) {
        info('[ TvProg ] %s ...', msg);
    }).on('get-info', function (msg) {
        sendEpg(msg, function (sendClbk) {
            socket.emit('send-info', sendClbk);
        });
    }).on('disconnect', function (socket) {
        info('[ TvProg ] Disconnected from portlet.');
    });
}

// ------------------------------------------
//  Plugin's functions
// ------------------------------------------
var sock;
exports.init = function () {
    info('[ TvProg ] is initializing ...');
}

exports.dispose = function () {
    info('[ TvProg ] is disposed ...');
}
