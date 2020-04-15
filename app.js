'use strict';

const Homey = require('homey')

class PanasonicIpApp extends Homey.App {
	
	onInit() {
		this.log('PanasonicIpApp is running...');
	}
	
}

module.exports = PanasonicIpApp;