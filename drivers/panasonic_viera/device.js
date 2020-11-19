'use strict';

const Homey = require('homey');
var http = require('http');

var numFailedReq = 0;

class VieraDevice extends Homey.Device {
	
	onInit() {
		this.log('VieraDevice has been inited');

		this.registerCapabilityListener('onoff', await this.onCapabilityOnoff.bind(this));
		this.registerCapabilityListener('channel_up', await this.onCapabilityChannelUp.bind(this));
		this.registerCapabilityListener('channel_down', await this.onCapabilityChannelDn.bind(this));
		this.registerCapabilityListener('volume_up', await this.onCapabilityVolumeUp.bind(this));
		this.registerCapabilityListener('volume_down', await this.onCapabilityVolumeDn.bind(this));
		this.registerCapabilityListener('volume_mute', await this.onCapabilityVolumeMute.bind(this));
		this.registerCapabilityListener('tv_input', await this.onCapabilityTvInput.bind(this));
		this.registerCapabilityListener('tv_apps', await this.onCapabilityTvApps.bind(this));
		this.registerCapabilityListener('tv_home', await this.onCapabilityTvHome.bind(this));
		this.registerCapabilityListener('tv_return', await this.onCapabilityTvReturn.bind(this));
		this.registerCapabilityListener('tv_cancel', await this.onCapabilityTvCancel.bind(this));
		this.registerCapabilityListener('tv_selector_uod', await this.onCapabilityTvSelectorUod.bind(this));
		this.registerCapabilityListener('tv_selector_lor', await this.onCapabilityTvSelectorLor.bind(this));
		
		// Check for Status every 5 Minutes
		this.homey.setInterval(await this.checkOnOff.bind(this),300000);
	}

	/*onDiscoveryResult(discoveryResult) {
		console.log("MAC discovery",discoveryResult);

		if(this.getData().id.includes("manual")) {
			return true;
		} else {
			return discoveryResult.id === this.getData().id;
		}
	}*/

	/*async onDiscoveryAvailable(discoveryResult) {
		//TODO
		//if(this.getData().id.includes("manual")) {
		//	return true;
		//} else {
		//	return await deviceStatus(this.getSettings());
		//}
		console.log("onDiscoveryAvailable");
		return true;
	}*/

	/*onDiscoveryAddressChanged(discoveryResult) {
		// Update your connection details here, reconnect when the device is offline
		if(!this.getData().id.includes("manual")) {
			var newSettings = this.getSettings();
			if(newSettings.iprefresh == true) {
				newSettings.ip = discoveryResult.address;
				this.setSettings(newSettings);
				console.log(discoveryResult.address);
			} else {
				console.log("IP Change, but auto-refresh disabled");
			}
		}
	}*/

	/*onDiscoveryLastSeenChanged(discoveryResult) {
		// When the device is offline, try to reconnect here
		console.log("Last seen changed");
	}*/
	
	// this method is called when the 5-minutes interval is called
	async checkOnOff() {
		return await deviceStatus(this.getSettings(),this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityOnoff( value, opts ) {
		return await requestCmd('NRC_POWER-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityChannelUp( value, opts ) {
		return await requestCmd('NRC_CH_UP-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityChannelDn( value, opts ) {
		return await requestCmd('NRC_CH_DOWN-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeUp( value, opts ) {
		return await requestCmd('NRC_VOLUP-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeDn( value, opts ) {
		return await requestCmd('NRC_VOLDOWN-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeMute( value, opts ) {
		return await requestCmd('NRC_MUTE-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvInput( value, opts ) {
		return await requestCmd('NRC_CHG_INPUT-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvApps( value, opts ) {
		return await requestCmd('NRC_APPS-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvHome( value, opts ) {
		return await requestCmd('NRC_HOME-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvReturn( value, opts ) {
		return await requestCmd('NRC_RETURN-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvCancel( value, opts ) {
		return await requestCmd('NRC_CANCEL-ONOFF',this);
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvSelectorUod( value, opts ) {

		switch (value) {
			case "up": 
					return await requestCmd('NRC_UP-ONOFF',this);
				break;
			case "down": 
					return await requestCmd('NRC_DOWN-ONOFF',this);
				break;
			case "idle": 
					return await requestCmd('NRC_ENTER-ONOFF',this);
				break;
			default:
					return new Error("unexpected_error");
				break;
		}
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvSelectorLor( value, opts ) {

		switch (value) {
			case "up": 
					return await requestCmd('NRC_LEFT-ONOFF',this);
				break;
			case "down": 
					return await requestCmd('NRC_RIGHT-ONOFF',this);
				break;
			case "idle": 
					return await requestCmd('NRC_ENTER-ONOFF',this);
				break;
			default:
					return new Error("unexpected_error");
				break;
		}
	}
}

const data = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
	<s:Body>
		<u:X_SendKey xmlns:u="urn:panasonic-com:service:p00NetworkControl:1">
			<X_KeyEvent>[command]</X_KeyEvent>
		</u:X_SendKey>
	</s:Body>
</s:Envelope>`;

// requestCmd function
function requestCmd (cmd,that) {
	return new Promise((resolve, reject) => {
		if (!cmd) {
			reject(new Error("unexpected_error"));
		}
		var settings = that.getSettings();

		try {
			var post_req = http.request({
				host: settings.ip,
				port: '55000',
				path: '/nrc/control_0',
				method: 'POST',
				headers: {
					'Content-Type': 'text/xml; charset="utf-8"',
					'SOAPACTION': '"urn:panasonic-com:service:p00NetworkControl:1#X_SendKey"'
			 	},
			 	timeout: 1500,
			}, function(res){
				if(res.statusCode == 200) {
					console.log("OK: request send: ",cmd);

					// Turn ONOFF property on if not already done
					numFailedReq = 0;
					if(that.getCapabilityValue('onoff') == false) {
						that.setCapabilityValue('onoff', true)
							.catch(that.error);
					}

					//Check for actions
					//TODO

					resolve();
				}
				reject(new Error("request_status_"+res.statusCode));
			});
			post_req.on('error', function(err) {
				// Turn ONOFF property off after 3 failed cmds, if not already done
				numFailedReq += 1;
				if(numFailedReq == 3 && that.getCapabilityValue('onoff') == true) {
					that.setCapabilityValue('onoff', false)
						.catch(that.error);
				}
				reject(new Error("request_error"));
			});
			post_req.on('timeout', function(err) {
				// Turn ONOFF property off after 3 failed cmds, if not already done
				numFailedReq += 1;
				if(numFailedReq == 3 && that.getCapabilityValue('onoff') == true) {
					that.setCapabilityValue('onoff', false)
						.catch(that.error);
				}
				reject(new Error("device_unavailable"));
			});
			post_req.write(data.replace('[command]', cmd));
			post_req.end();
		} catch (e) {
			reject(new Error("request_unexpected_error"));
		}
	});
}

function deviceStatus(settings,that) {
	return new Promise((resolve, reject) => {
		try {
			var post_req = http.request({
				host: settings.ip,
				port: '55000',
				path: '/nrc/control_0',
				method: 'POST',
				headers: {
					'Content-Type': 'text/xml; charset="utf-8"',
					'SOAPACTION': '"urn:panasonic-com:service:p00NetworkControl:1#X_SendKey"'
			 	},
			 	timeout: 1500,
			}, function(res){
				if(res.statusCode == 200) {
					console.log("OK: request send");
					this.setCapabilityValue('onoff', true);
					resolve();
				}
				that.setCapabilityValue('onoff', false);
				resolve();
			});
			post_req.on('error', function(err) {
				that.setCapabilityValue('onoff', false);
				resolve();
			});
			post_req.on('timeout', function(err) {
				that.setCapabilityValue('onoff', false);
				resolve();
			});
			post_req.write(data.replace('[command]', 'NRC_VOLDOWN-OFF'));
			post_req.end();
		} catch (e) {
			console.log(e);
			that.setCapabilityValue('onoff', false);
			resolve();
		}
	});
}

module.exports = VieraDevice;
