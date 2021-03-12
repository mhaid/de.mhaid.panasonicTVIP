'use strict';

const Homey = require('homey');

class VieraDriver extends Homey.Driver {
	
	onInit() {
		this.log('VieraDriver has been inited');
	}

	onPair( socket ) {

		const discoveryStrategy = this.homey.discovery.getStrategy('discovery_viera');
		const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults()); // { "my_result_id": DiscoveryResult }

		const devices = Object.values(discoveryResults).map(discoveryResult => {
			return {
				'name': 'Viera TV ['+discoveryResult.address+']',
				'data': {
					'id': discoveryResult.id,
					'address': discoveryResult.address,
					'usn': discoveryResult.headers.usn,
				}
			};
		});
		var device = null;

		socket.setHandler('selected_device', async function (data) {
			device = data;
			console.log("nextView");
			socket.nextView();
		});

		socket.setHandler('showView', async function (view_id) {
			if(view_id=="request_device"){
				console.log(devices);
				await socket.emit('listing_devices',devices);
			}else if(view_id=="request_ip"){
				console.log(device);
				await socket.emit('get_device',device);
			}
		});
	}
}

module.exports = VieraDriver;