/**
 * Storekey Server
 **/

http = require('http');
fs = require('fs');
path = require('path');
package = require('./package.json');
var port = 1337;
var io = require('socket.io').listen(port);
var os   = require('os'),
    clui = require('clui');

var allocation = 32000000; // 32mb max key value memory usage
var allocated = 0;
var datastore = {};
var datadiff = "";
var lastcheck = 0;
var tick = 0;
var nile = 1024;
var deltajson = path.resolve(__dirname + "/storage/delta.txt");
var delta = Math.ceil(fs.readFileSync(deltajson).toString()).toFixed(0);
var storekeyjson = path.resolve(__dirname + "/storage/storekey.json");
var uptime = new Date();
var tock = 0;
var bestTick = 10;
var ticker = [0,0,0,0,0,0,0,0,0,0,0,0];
var saving = false;

//
// DATA STORAGE
//
var datastore = require(storekeyjson);
    if (datastore !== "") {
        console.log("Storage Delta: ", delta);
        console.log("Loaded Stored Keys: ", storekeyjson);
        var date = new Date();
        for (var ds in datastore) {
            if (typeof datastore[ds] !== "undefined") {
                allocated += JSON.stringify(datastore[ds]).length;
                if (datastore[ds].expires < date.getTime()) {
                    allocated -= JSON.stringify(datastore[ds]).length;
                    delete datastore[ds];
                    lastcheck = date.getTime();
                    tick++;
                }
            }
        }
        lastcheck = date.getTime();
        console.log("Memory Allocated: ", allocated +" bytes %", (allocated/allocation *100).toFixed(2));
    }

//
// DATE SORT FUNCTION
//
function custom_sort(a, b) {
    return new Date(a.expires).getTime() - new Date(b.expires).getTime();
}

var number = 1;
var statsinterval = null;
var Spinner = clui.Spinner;
var countdown = new Spinner('');
var datastoreLENGTH = Object.keys(datastore).length;

// Interval Based Object Counts (Enable For Debugging Only
//setInterval(function() {
//    datastoreLENGTH = Object.keys(datastore).length;
//},15000);

function storekey_stats() {
    var Gauge = clui.Gauge;
    var total = os.totalmem();
    var free = os.freemem();
    var used = total - free;
    var human = Math.ceil(used / 1000000) + ' MB';
    var lines = process.stdout.getWindowSize()[1];
    var Sparkline = require('clui').Sparkline;
    ticker.push(tick);
    if (ticker.length>12) {
        ticker.shift();
    }
    if (bestTick<tick) {
        bestTick = tick;
    }
    var reqSec = Sparkline(ticker, 'reqs/sec');
    var sysMem = Gauge(used, total, 20, total * 0.8, human);
    var skMem = Gauge(allocated, allocation, 20, allocation * 0.8, Math.ceil(allocated / 1000000) + ' MB');
    for(var i = 0; i < lines; i++) {
        console.log('\r\n');
    }
    var Progress = clui.Progress;
    var thisProgressBar = new Progress(20);
    //console.log(" Storekey Objects: "+ datastoreLENGTH); // Debugging Only!
    console.log(" Uptime:",tock);
    console.log(" StoreKey Load:   "+ thisProgressBar.update(tick, bestTick));
    console.log(" Requests/Sec:    "+ reqSec);
    console.log(" System Memory:   "+ sysMem);
    console.log(" Storekey Memory: "+ skMem);
    console.log(" Delta:",delta);
    console.log("");
    clearInterval(statsinterval);
    delete reqSec;
    delete memObj;
    delete sysMem;
    delete skMem;
    tick = 0;
    tock++;

    if (saving) {
        countdown.start();
        var savex = setInterval(function() {
            if (!saving) {
                countdown.stop();   
                clearInterval(savex);
            }
        }, 1000);
    }
}

//
// SHOW STOREKEY DATA
//
var date = new Date();
setInterval(function() {
    storekey_stats();
}, 1000);

//
// SAVE THE DATASTORE ARCHIVE INTERVAL
//
var date = new Date();
setInterval(function() {
    if (saving) {
        return;
    } else {
        saving = true;
        for (var ds in datastore) {
            if (datastore[ds].expires<date.getTime()) {
                allocated -= JSON.stringify(datastore[ds]).length;
                delete datastore[ds];
                tick++;
            }
        }
        datastore = Object.keys(datastore).sort(custom_sort);
        for (var ds in datastore) {
            if (allocated>allocation) {
                allocated -= JSON.stringify(datastore[ds]).length;
                delete datastore[ds];
                lastcheck = date.getTime();
                tick++;
            }
        }
        lastcheck = date.getTime();
        delta++;

        fs.writeFile(deltajson, delta, {flag:"w+"}, function() {
            fs.writeFile(storekeyjson, JSON.stringify(datastore), {flag:"w+"}, function() {
                saving = false;
            });
        });
    }
}, 60000);

//
// SERVER STARTUP STATUS
//
console.log("STORE KEY SERVER - Version ", package.version);
console.log("Listening On Port ", port);
console.log("Allocating ", allocation, " bytes");
console.log("\n================================================\n=         STORE KEY SERVER NOW ONLINE!         =\n================================================\n");

//
// GET DATA
//
function getData(data, cb) {
    if (typeof datastore[data[0].key] !== "undefined") {
        var date = new Date();
        if (datastore[data[0].key].expires>date.getTime()) {
            cb({
                key: data[0].key,
                value: datastore[data[0].key].value,
                expires: datastore[data[0].key].expires
            });
        }
    }
}

//
// SET DATA
//
function setData(data, cb) {
    while (allocated>allocation) {
        if (datastore[data[0].key]) {
            tick++;
            allocated -= JSON.stringify(datastore[data[0]]).length;
            delete datastore[data[0].key];
        } else {
            break;
        }
    }
    datastore[data[0].key] = {
        value: data[0].value,
        expires: data[0].expires
    };
    allocated += JSON.stringify(datastore[data[0].key]).length;
}

//
// DELETE DATA
//
function deleteData(data, cb) {
    if (typeof datastore[data[0].key] !== "undefined") {
        if (typeof datastore[data[0]] !== "undefined") {
            allocated -= JSON.stringify(datastore[data[0]]).length;
        }
        delete datastore[data[0].key];
        cb(true);
    }
}

//
// LISTEN FOR CONNECTIONS
//
io.on('connection', function (socket) {

    /**
     * Occurs when the client disconnects from the server
     * @var string reason - Optional - reason for disconnecting, not used
     */
    socket.on('disconnected', function (reason) {
    // Disconnected User
    });


    /**
     * Occurs when a client requests data
     * @var string data - Key of the memory object to get
     */
    socket.on('get', function(data) {
        getData(data, function(bits) {
            socket.emit('get', bits);
        });
        tick++;
    });


    /**
     * Occurs when a client requests data synchronously
     * @var string data - Key of the memory object to get
     * @function fn - Function to callback upon data completion
     */
    socket.on('getSync', function(data,fn) {
        getData(data, function(bits) {
            socket.emit('getSync', bits);
        });
        tick++;
    });


    /**
     * Occurs when a client sets data
     * @var string data - Key & Value of the data to set
     */
    socket.on('set', function(data) {
        setData(data, function(bits) {
        });
        tick++;
    });


    /**
     * Occurs when a client sets data synchronously
     * @var string data - Key & Value of the data to set
     * @function fn - Function to callback upon data completion
     */
    socket.on('setSync', function(data) {
        setData(data, function(bits) {
            socket.emit('setSync');
        });
        tick++;
    });


    /**
     * Occurs when a client requests a deletion
     * @var string data - Key of the data to remove
     */
    socket.on('delete', function(data) {
        deleteData(data, function(bits) {
        });
        tick++;
    });


    /**
     * Occurs when a client requests a deletion synchronously
     * @var string data - Key of the data to remove
     * @function fn - Function to callback upon data completion
     */
    socket.on('deleteSync', function(data) {
        deleteData(data, function(bits) {
            socket.emit('deleteSync');
        });
        tick++;
    });

    //
    // CONNECTED
    //
    socket.emit('connected', {
        "online": "true"
    });

});
