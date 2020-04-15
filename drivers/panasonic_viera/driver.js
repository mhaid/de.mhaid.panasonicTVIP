'use strict';

const Homey = require('homey')

class VieraDriver extends Homey.Driver {
	
	onInit() {
		this.log('VieraDriver has been inited');
	}

	onPair( socket ) {
		// Show a specific view by ID
		socket.showView('request_ip');
	}
}

module.exports = VieraDriver;