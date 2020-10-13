'use strict';

const Homey = require('homey')

class VieraDriver extends Homey.Driver {
	
	onInit() {
		this.log('VieraDriver has been inited');
	}

	onPair( socket ) {

		const discoveryStrategy = this.getDiscoveryStrategy('discovery_viera');
		discoveryStrategy.on('result', discoveryResult => {
			console.log('Got result:', discoveryResult);
		});
		const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults()); // { "my_result_id": DiscoveryResult }

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

		socket.setHandler('listing_devices', async function (data) {
			return devices;
		});

		socket.setHandler('selected_device', async function (data) {
			return null;
			device = data;
			console.log("nextView");
			console.log(device);
			socket.nextView();
		});

		socket.setHandler('get_device', async function (data) {
			return device;
		});
	}
}

module.exports = VieraDriver;