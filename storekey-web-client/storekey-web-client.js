/*

 * Storekey - Store Key Data IO Browser / Client Javascript

 */

var socket = null;

var storekey = function(host) {

    return {

	host: host,

	connect: function(fn) {
		this.socket = io(host, {
			'timeout': 500,
			'reconnection': false,
			'reconnectionDelay': 500,
			'reconnectionAttempts': 0
		});
		this.socket.emit('connected',[{"ok":"1"}]);
		fn(this.socket);
	},

	disconnect: function(reason) {
		this.socket.emit('disconnected',[{"reason":reason}]);
	},

	get: function(keyval) {
		this.socket.emit('get',[{key:keyval}]);
		
	},

	getSync: function(keyval, fn) {
		this.socket.emit('getSync',[{key:keyval}]);
		this.socket.on('getSync', function (data) {
			fn(data);
			delete this;
		});
		
	},

	set: function(keyval, valueval, lifetime) {
		var date = new Date();
		if (typeof lifetime == "undefined") {
			lifetime = date.getTime()+9999999999;
		} else {
			lifetime = date.getTime()+lifetime;
		}
		this.socket.emit('set',[{"key":keyval,"value":valueval,"expires":lifetime}]);
	},

	setSync: function(keyval, valueval, lifetime, fn) {
		var date = new Date();
		if (typeof lifetime == "function") {
			fn = lifetime;
			lifetime = 0;
		} else {
			lifetime = date.getTime()+lifetime;
		}
		this.socket.emit('setSync',[{"key":keyval,"value":valueval,"expires":lifetime}]);
		this.socket.on('setSync', function (data) {
			fn(data);
			delete this;
		});
	},

	delete: function(keyval) {
		this.socket.emit('delete',[{key:keyval}]);
	},

	deleteSync: function(keyval,fn) {
		this.socket.emit('deleteSync',[{key:keyval}]);
		this.socket.on('deleteSync', function (data) {
			fn(data);
			delete this;
		});
	}

    }

}

storekey.socket = socket;
