'use strict';

const Homey = require('homey');

class VieraDriver extends Homey.Driver {
	
	onInit() {
		this.log('VieraDriver legacy has been inited');
	}
}

module.exports = VieraDriver;