'use strict';

const Homey = require('homey')

class VieraDriver extends Homey.Driver {
	
	onInit() {
		this.log('VieraDriver has been inited');
	}

	onPair( socket ) {

		const discoveryStrategy = Homey.ManagerDiscovery.getDiscoveryStrategy('discovery_viera');
		discoveryStrategy.on('result', discoveryResult => {
			console.log('Got result:', discoveryResult);
		});
		const discoveryResults = discoveryStrategy.getDiscoveryResults(); // { "my_result_id": DiscoveryResult }

		//const discoveryStrategy = this.getDiscoveryStrategy();
		//const discoveryResults = discoveryStrategy.getDiscoveryResults();

		const devices = Object.values(discoveryResults).map(discoveryResult => {
			return {
				'name': 'Viera TV ['+discoveryResult.address+']',
				'data': {
					'id': discoveryResult.id,
					'address': discoveryResult.address,
					'mac': discoveryResult.mac,
				}
			};
		});
		var device = null;

		this.log(devices);

		socket.on('listing_devices', function( data, callback ) {
			callback( null, devices );
		});

		socket.on('selected_device', function( data, callback ) {
			callback();
			device = data;
			console.log("nextView");
			console.log(device);
			socket.nextView();
		});

		socket.on('get_device', function( data, callback ) {
			callback(null, device);
		});
	}
}

module.exports = VieraDriver;