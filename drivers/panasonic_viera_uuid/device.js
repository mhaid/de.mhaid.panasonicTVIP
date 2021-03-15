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
		let changeInputsAction = this.homey.flow.getActionCard('change_inputs');
		changeInputsAction.registerRunListener(async (args, state) => {
			this.log("OK: Action called (change_inputs):",args.times);
			for (let i = 0; i < args.times; i++) {
				this.homey.setTimeout(() => { requestCmd('NRC_CHG_INPUT-ONOFF',this); },i*500);
			}
			return true;
		});
		let pressKeyAction = this.homey.flow.getActionCard('press_key');
		pressKeyAction.registerRunListener(async (args, state) => {
			this.log("OK: Action called (press_key):",args.button);
			switch (args.button) {
				case "home":
					await requestCmd('NRC_HOME-ONOFF',this);
					break;
				case "apps":
					await requestCmd('NRC_APPS-ONOFF',this);
					break;
				case "return":
					await requestCmd('NRC_RETURN-ONOFF',this);
					break;
				case "cancel":
					await requestCmd('NRC_CANCEL-ONOFF',this);
					break;
				case "selector_up":
					await requestCmd('NRC_UP-ONOFF',this);
					break;
				case "selector_dn":
					await requestCmd('NRC_DOWN-ONOFF',this);
					break;
				case "selector_lf":
					await requestCmd('NRC_LEFT-ONOFF',this);
					break;
				case "selector_rg":
					await requestCmd('NRC_RIGHT-ONOFF',this);
					break;
				case "selector_enter":
					await requestCmd('NRC_ENTER-ONOFF',this);
					break;
				case "numpad_1":
					await requestCmd('NRC_D1-ONOFF',this);
					break;
				case "numpad_2":
					await requestCmd('NRC_D2-ONOFF',this);
					break;
				case "numpad_3":
					await requestCmd('NRC_D3-ONOFF',this);
					break;
				case "numpad_4":
					await requestCmd('NRC_D4-ONOFF',this);
					break;
				case "numpad_5":
					await requestCmd('NRC_D5-ONOFF',this);
					break;
				case "numpad_6":
					await requestCmd('NRC_D6-ONOFF',this);
					break;
				case "numpad_7":
					await requestCmd('NRC_D7-ONOFF',this);
					break;
				case "numpad_8":
					await requestCmd('NRC_D8-ONOFF',this);
					break;
				case "numpad_9":
					await requestCmd('NRC_D9-ONOFF',this);
					break;
				case "numpad_0":
					await requestCmd('NRC_D0-ONOFF',this);
					break;
				case "input":
					await requestCmd('NRC_CHG_INPUT-ONOFF',this);
					break;
				case "tv":
					await requestCmd('NRC_TV-ONOFF',this);
					break;
				case "hdmi1":
					await requestCmd('NRC_HDMI1-ONOFF',this);
					break;
				case "hdmi2":
					await requestCmd('NRC_HDMI2-ONOFF',this);
					break;
				case "hdmi3":
					await requestCmd('NRC_HDMI3-ONOFF',this);
					break;
				case "hdmi4":
					await requestCmd('NRC_HDMI4-ONOFF',this);
					break;
				case "sd-card":
					await requestCmd('NRC_SD_CARD-ONOFF',this);
					break;
				case "3d":
					await requestCmd('NRC_3D-ONOFF',this);
					break;
				default:
					return false;
			}
			return true;
		});
		
		// Check for Discorvery-Call	
		const discoveryStrategy = this.homey.discovery.getStrategy('discovery_viera');
		discoveryStrategy.on('result', discoveryResult => {
			console.log('HINT: Discovery result:', discoveryResult);
			discoveryResult.on('addressChanged', discoveryResult => {
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
		});
		//const discoveryStrategy = this.homey.discovery.getStrategy('discovery_viera');
		//this.homey.setInterval(() => { discoveryRefresh(discoveryStrategy,this); },30000);
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
		<[bodyType]:[action] xmlns:[bodyType]="urn:[urn]">
			[command]
		</[bodyType]:[action]>
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
			var postData = data.split("[bodyType]").join("u").split("[action]").join("X_SendKey").replace('[urn]','panasonic-com:service:p00NetworkControl:1').replace('[command]', '<X_KeyEvent>'+cmd+'</X_KeyEvent>');
			var postReq = http.request({
				host: settings.ip,
				port: '55000',
				path: '/nrc/control_0',
				method: 'POST',
				headers: {
					'Content-Type': 'text/xml; charset="utf-8"',
					'Content-Length': Buffer.byteLength(postData),
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
					return;
				}
				console.log("ERROR:",cmd,"statusCode:",res.statusCode);
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
			postReq.write(postData);
			postReq.end();
		} catch (e) {
			console.log("ERROR:",cmd,"unexpected:",e);
			reject(new Error("request_unexpected_error"));
		}
	});
}


// requestGet function
/*function requestGet (cmd,that) {
	if (!cmd) {
		return;
	}
	var settings = that.getSettings();

	try {
		var postData = data.split("[bodyType]").join("m").split("[action]").join(cmd).replace('[urn]','schemas-upnp-org:service:RenderingControl:1').replace('[command]', '<InstanceID>0</InstanceID><Channel>Master</Channel>');
		var postReq = http.request({
			host: settings.ip,
			port: '55000',
			path: '/dmr/control_0',
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset="utf-8"',
				'Content-Length': Buffer.byteLength(postData),
				'SOAPACTION': '"schemas-upnp-org:service:RenderingControl:1#'+cmd+'"'
			},
			timeout: 1500,
		}, function(res){
			console.log(res);
			if(res.statusCode == 200) {
				console.log("OK:",cmd,"request successfull");

				return;
			}
			console.log("ERROR:",cmd,"statusCode:",res.statusCode);
			return;
		});
		console.log("OK:",cmd,"request send");

		postReq.on('error', function(err) {
			if(err.errno == "EHOSTUNREACH"){
				console.log("ERROR:",cmd,"timeout");
				return;
			} else {
				console.log("ERROR:",cmd,"request:",err);
				return;
			}
		});
		postReq.write(postData);
		postReq.end();
	} catch (e) {
		console.log("ERROR:",cmd,"unexpected:",e);
		return;
	}
}*/
/*function requestGet (that) {
	var settings = that.getSettings();

	try {
		var postReq = http.request({
			host: settings.ip,
			port: '55000',
			path: '/nrc/control_0',
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset="utf-8"',
				'SOAPACTION': '"urn:panasonic-com:service:p00NetworkControl:1#X_GetVectorInfo"'
			},
			timeout: 1500,
		}, function(res){
			if(res.statusCode == 200) {
				console.log("OK:",'GetVectorInfo',"request successfull");
				console.log(res);
				return
			}
			console.log("ERROR: GetVectorInfo",res.statusCode);
			console.log(res);
		});
		console.log("OK:",'GetVectorInfo',"request send");

		postReq.on('error', function(err) {
			// Turn ONOFF property off after 3 failed cmds, if not already done
			numFailedReq += 1;
			if(numFailedReq == 3 && that.getCapabilityValue('onoff') == true) {
				that.setCapabilityValue('onoff', false)
					.catch(that.error);
			}

			if(err.errno == "EHOSTUNREACH"){
				console.log("ERROR:",'GetVectorInfo',"timeout");
				return;
			} else {
				console.log("ERROR:",'GetVectorInfo',"request:",err);
				return;
			}
		});
		postReq.write(data.replace('[command]', '').replace('[action]', 'X_GetVectorInfo'));
		postReq.end();
	} catch (e) {
		console.log("ERROR:",'GetVectorInfo',"unexpected:",e);
		return;
	}
}*/


// deviceStatus function
function deviceStatus(that) {
	try {
		var settings = that.getSettings();

		var postData = data.split("[bodyType]").join("u").split("[action]").join("X_SendKey").replace('[urn]','panasonic-com:service:p00NetworkControl:1').replace('[command]', '<X_KeyEvent>NRC_VOLDOWN-OFF</X_KeyEvent>');
		var postReq = http.request({
			host: settings.ip,
			port: '55000',
			path: '/nrc/control_0',
			method: 'POST',
			headers: {
				'Content-Type': 'text/xml; charset="utf-8"',
				'Content-Length': Buffer.byteLength(postData),
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
		postReq.write(postData);
		postReq.end();
	} catch (e) {
		console.log(e);
		that.setCapabilityValue('onoff', false);
		console.log("ERROR: Status:",e);
		return;
	}
}

// wakeOnLan function
function wakeOnLan(that){
	return new Promise((resolve, reject) => {
		var settings = that.getSettings();
		var macAddress = settings.mac;
		
		if(macAddress == null || macAddress == "") {
			console.log("WARNING: WakeOnLan not supported");
			reject(new Error("no_mac_available"));
			return;
		}
		console.log("OK: WakeOnLan request recieved",macAddress);

		try {
			var wolPackage = createMacPackage(macAddress);
			var socket = dgram.createSocket('udp4');

			sendMacPackage(socket,wolPackage,1,that, function(result){

				// check after 20 seconds if TV is on
				that.homey.setTimeout(() => { 
					deviceStatus(that);
					if(that.getCapabilityValue('onoff') == false) {
						//TV didn't turn on
						reject(new Error("wakeOnLAN_not_supported"));
						return;
					}

					if(result != "error") {
						console.log("OK: WakeOnLan requests send");
						resolve();
					} else {
						reject(new Error("request_error"));
					}
				},20000)
			});
		} catch (e) {
			console.log("ERROR: WakeOnLan ",e);
			reject(new Error("request_unexpected_error"));
		}
	});
}

// WakeOnLan createMacPackage function
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

// WakeOnLan sendMacPackage function
function sendMacPackage(socket,wolPackage,repeat,that,cb) {
	socket.send(wolPackage,0,wolPackage.length,9,'255.255.255.255',function(error) {
		if(!error) {
			console.log("OK: WakeOnLan request",repeat,"successfull");
			if(repeat < 5) {
				that.homey.setTimeout(() => { sendMacPackage(socket,wolPackage,repeat+1,that,cb); },500)
			} else {
				cb("success");
			}
		}
	});
	socket.on('error', function(error) {
		console.log("ERROR: WakeOnLan ",error.stack);
		socket.close();
		cb("error");
	});		
	socket.on('listening', function() {
		socket.setBroadcast(true);
	});	
}

function discoveryRefresh(discoveryStrategy,that) {

	const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults()); // { "my_result_id": DiscoveryResult }
	discoveryResults.forEach(discoveryResult => {
		console.log('HINT: Discovery result:', discoveryResult);
		if(!that.getData().id.includes("manual") && discoveryResult.id == that.getData().id) {
			console.log('HINT: Discovery result matched:',that.getData().id);
			var newSettings = that.getSettings();
			if(discoveryResult.address != newSettings.ip) {
				if(newSettings.iprefresh == true) {
					newSettings.ip = discoveryResult.address;
					that.setSettings(newSettings);
					console.log("OK: Discovery IP-Change:",discoveryResult.address);
				} else {
					console.log("HINT: Discovery IP-Change: Auto-refresh disabled");
				}
			}
		}
	});
}

module.exports = VieraDevice;
