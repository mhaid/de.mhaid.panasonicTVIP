'use strict';

const Homey = require('homey');
var http = require('http');
var dgram = require('dgram');
var Buffer = require('buffer').Buffer;

var numFailedReq = 0;

class VieraDevice extends Homey.Device {
	
	async onInit() {
		this.log('VieraDevice has been inited');

		this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
		this.registerCapabilityListener('channel_up', this.onCapabilityChannelUp.bind(this));
		this.registerCapabilityListener('channel_down', this.onCapabilityChannelDn.bind(this));
		this.registerCapabilityListener('volume_up', this.onCapabilityVolumeUp.bind(this));
		this.registerCapabilityListener('volume_down', this.onCapabilityVolumeDn.bind(this));
		this.registerCapabilityListener('volume_mute', this.onCapabilityVolumeMute.bind(this));
		this.registerCapabilityListener('tv_input', this.onCapabilityTvInput.bind(this));
		this.registerCapabilityListener('tv_apps', this.onCapabilityTvApps.bind(this));
		this.registerCapabilityListener('tv_home', this.onCapabilityTvHome.bind(this));
		this.registerCapabilityListener('tv_return', this.onCapabilityTvReturn.bind(this));
		this.registerCapabilityListener('tv_cancel', this.onCapabilityTvCancel.bind(this));
		this.registerCapabilityListener('tv_selector_uod', this.onCapabilityTvSelectorUod.bind(this));
		this.registerCapabilityListener('tv_selector_lor', this.onCapabilityTvSelectorLor.bind(this));
		
		// Check for Status every 5 Minutes
		this.homey.setInterval(() => { deviceStatus(this); },30000);

		// Check for Flow Action-Calls
		let changeInputAction = this.homey.flow.getActionCard('change_input');
		changeInputAction.registerRunListener(async (args, state) => {
			this.log("OK: Action called (change_input)");
			await requestCmd('NRC_CHG_INPUT-ONOFF',this);
			return true;
		});
		let changeInputsAction = this.homey.flow.getActionCard('change_inputs');
		changeInputsAction.registerRunListener(async (args, state) => {
			this.log("OK: Action called (change_inputs):",args.times);
			for (let i = 0; i < args.times; i++) {
				this.homey.setTimeout(() => { requestCmd('NRC_CHG_INPUT-ONOFF',this); },i*500);
			}
			return true;
		});
		
		// Check for Discorvery-Call
		const discoveryStrategy = this.homey.discovery.getStrategy('discovery_viera');
		discoveryStrategy.on('addressChanged', discoveryResult => {
			if(!this.getData().id.includes("manual")) {
				var newSettings = this.getSettings();
				if(newSettings.iprefresh == true) {
					newSettings.ip = discoveryResult.address;
					this.setSettings(newSettings);
					console.log("OK: Discovery IP-Change:",discoveryResult.address);
				} else {
					console.log("HINT: Discovery IP-Change: Auto-refresh disabled");
				}
			}
		});
	}

	// this method is called when the user has requested a state change (turned on or off)
	async onCapabilityOnoff( value, opts ) {
		if(this.getCapabilityValue('onoff') == false) {
			return wakeOnLan(this);
		} else {
			return requestCmd('NRC_POWER-ONOFF',this);
		}
	}

	// this method is called when the user has requested a state change (channel up)
	async onCapabilityChannelUp( value, opts ) {
		return requestCmd('NRC_CH_UP-ONOFF',this);
	}

	// this method is called when the user has requested a state change (channel down)
	async onCapabilityChannelDn( value, opts ) {
		return requestCmd('NRC_CH_DOWN-ONOFF',this);
	}

	// this method is called when the user has requested a state change (volume up)
	async onCapabilityVolumeUp( value, opts ) {
		return requestCmd('NRC_VOLUP-ONOFF',this);
	}

	// this method is called when the user has requested a state change (volume down)
	async onCapabilityVolumeDn( value, opts ) {
		return requestCmd('NRC_VOLDOWN-ONOFF',this);
	}

	// this method is called when the user has requested a state change (volume mute)
	async onCapabilityVolumeMute( value, opts ) {
		return requestCmd('NRC_MUTE-ONOFF',this);
	}

	// this method is called when theuser has requested a state change (tv input)
	async onCapabilityTvInput( value, opts ) {
		return requestCmd('NRC_CHG_INPUT-ONOFF',this);
	}

	// this method is called when the user has requested a state change (tv apps)
	async onCapabilityTvApps( value, opts ) {
		return requestCmd('NRC_APPS-ONOFF',this);
	}

	// this method is called when the user has requested a state change (tv home)
	async onCapabilityTvHome( value, opts ) {
		return requestCmd('NRC_HOME-ONOFF',this);
	}

	// this method is called when the user has requested a state change (tv return)
	async onCapabilityTvReturn( value, opts ) {
		return requestCmd('NRC_RETURN-ONOFF',this);
	}

	// this method is called when the user has requested a state change (tv cancel)
	async onCapabilityTvCancel( value, opts ) {
		return requestCmd('NRC_CANCEL-ONOFF',this);
	}

	// this method is called when the user has requested a state change (selector input)
	async onCapabilityTvSelectorUod( value, opts ) {

		switch (value) {
			case "up": 
					return requestCmd('NRC_UP-ONOFF',this);
				break;
			case "down": 
					return requestCmd('NRC_DOWN-ONOFF',this);
				break;
			case "idle": 
					return requestCmd('NRC_ENTER-ONOFF',this);
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
					return requestCmd('NRC_LEFT-ONOFF',this);
				break;
			case "down": 
					return requestCmd('NRC_RIGHT-ONOFF',this);
				break;
			case "idle": 
					return requestCmd('NRC_ENTER-ONOFF',this);
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
			var postReq = http.request({
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
					console.log("OK:",cmd,"request successfull");

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
			console.log("OK:",cmd,"request send");

			postReq.on('error', function(err) {
				// Turn ONOFF property off after 3 failed cmds, if not already done
				numFailedReq += 1;
				if(numFailedReq == 3 && that.getCapabilityValue('onoff') == true) {
					that.setCapabilityValue('onoff', false)
						.catch(that.error);
				}

				if(err.errno == "EHOSTUNREACH"){
					console.log("ERROR:",cmd,"timeout");
					reject(new Error("device_unavailable"));
				} else {
					console.log("ERROR:",cmd,"request:",err);
					reject(new Error("request_error"));
				}
			});
			/*postReq.on('timeout', function(err) {
				// Turn ONOFF property off after 3 failed cmds, if not already done
				numFailedReq += 1;
				if(numFailedReq == 3 && that.getCapabilityValue('onoff') == true) {
					that.setCapabilityValue('onoff', false)
						.catch(that.error);
				}
				console.log("ERROR:",cmd,"timeout");
				reject(new Error("device_unavailable"));
			});*/
			postReq.write(data.replace('[command]', cmd));
			postReq.end();
		} catch (e) {
			console.log("ERROR:",cmd,"unexpected:",e);
			reject(new Error("request_unexpected_error"));
		}
	});
}

function deviceStatus(that) {
	try {
		var settings = that.getSettings();

		var postReq = http.request({
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
				that.setCapabilityValue('onoff', true);
				console.log("OK: Status to on");
			} else {
				that.setCapabilityValue('onoff', false);
				console.log("OK: Status to off");
			}
			return;
		});
		postReq.on('error', function(err) {
			that.setCapabilityValue('onoff', false);
			if(err.errno != "EHOSTUNREACH"){
				console.log("ERROR: Status:",err);
			}
			return;
		});
		postReq.on('timeout', function(err) {
			that.setCapabilityValue('onoff', false);
			console.log("Hint: Status timeout");
			return;
		});
		postReq.write(data.replace('[command]', 'NRC_VOLDOWN-OFF'));
		postReq.end();
	} catch (e) {
		console.log(e);
		that.setCapabilityValue('onoff', false);
		console.log("ERROR: Status:",e);
		return;
	}
}

function wakeOnLan(that){
	return new Promise((resolve, reject) => {

		var macAddress = that.getData().id;
		
		if(macAddress == null || macAddress == "" || macAddress.includes("manual")) {
			console.log("WARNING: WakeOnLan not supported");
			reject(new Error("no_mac_available"));
		}
		console.log("OK: WakeOnLan request recieved",macAddress);

		try {
			var wolPackage = createMacPackage(macAddress);
			var socket = dgram.createSocket('udp4');
			socket.send(wolPackage,0,wolPackage.length,9,'255.255.255.255',function(error) {
				if(!error) {
					console.log("OK: WakeOnLan request successfull");
					deviceStatus(that);
					resolve();
				}
			});
			socket.on('error', function(error) {
				console.log("ERROR: WakeOnLan ",error.stack);
				socket.close();
				reject(new Error("request_error"));
			});		
			socket.on('listening', function() {
				socket.setBroadcast(true);
			});

			console.log("OK: WakeOnLan request send");

		} catch (e) {
			console.log("ERROR: WakeOnLan ",e);
			reject(new Error("request_unexpected_error"));
		}
	});
}

function createMacPackage(macAddress) {
	var macBytes = 6;
	var numMacs = 16;
	var i;

	var macBuffer = new Buffer.alloc(macBytes);
	var buffer = new Buffer.alloc((1 + numMacs) * macBytes);

	if(macAddress.length == (2 * macBytes + (macBytes - 1))) {
		macAddress = macAddress.replace(new RegExp(macAddress[2], 'g'), '');
	}

	if(macAddress.length != (2 * macBytes || macAddress.match(/[^a-fA-F0-9]/))) {
		throw new Error("malformed MAC address '" + macAddress + "'");
	}

	for(var i = 0; i < macBytes; ++i) {
		macBuffer[i] = parseInt(macAddress.substr((2 * i), 2), 16);
	}

	for(var i = 0; i < macBytes; ++i) {
		buffer[i] = 0xff;
	}

	for(var i = 0; i < numMacs; ++i) {
		macBuffer.copy(buffer, (i + 1) * macBytes, 0, macBuffer.length);
	}

	return buffer;
}

module.exports = VieraDevice;
