'use strict';

const Homey = require('homey');
var http = require('http');

class VieraDevice extends Homey.Device {
	
	onInit() {
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
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityOnoff( value, opts ) {
		return requestCmd('NRC_POWER-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityChannelUp( value, opts ) {
		return requestCmd('NRC_CH_UP-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityChannelDn( value, opts ) {
		return requestCmd('NRC_CH_DOWN-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeUp( value, opts ) {
		return requestCmd('NRC_VOLUP-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeDn( value, opts ) {
		return requestCmd('NRC_VOLDOWN-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityVolumeMute( value, opts ) {
		return requestCmd('NRC_MUTE-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvInput( value, opts ) {
		return requestCmd('NRC_CHG_INPUT-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvApps( value, opts ) {
		return requestCmd('NRC_APPS-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvHome( value, opts ) {
		return requestCmd('NRC_HOME-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvReturn( value, opts ) {
		return requestCmd('NRC_RETURN-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvCancel( value, opts ) {
		return requestCmd('NRC_CANCEL-ONOFF',this.getSettings());
	}

	// this method is called when the Device has requested a state change (turned on or off)
	async onCapabilityTvSelectorUod( value, opts ) {

		switch (value) {
			case "up": 
					return requestCmd('NRC_UP-ONOFF',this.getSettings());
				break;
			case "down": 
					return requestCmd('NRC_DOWN-ONOFF',this.getSettings());
				break;
			case "idle": 
					return requestCmd('NRC_ENTER-ONOFF',this.getSettings());
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
					return requestCmd('NRC_LEFT-ONOFF',this.getSettings());
				break;
			case "down": 
					return requestCmd('NRC_RIGHT-ONOFF',this.getSettings());
				break;
			case "idle": 
					return requestCmd('NRC_ENTER-ONOFF',this.getSettings());
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
function requestCmd (cmd,settings) {
	return new Promise((resolve, reject) => {
		if (!cmd) {
			reject(new Error("unexpected_error"));
		}

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
					resolve();
				}
				reject(new Error("request_status_"+res.statusCode));
			});
			post_req.on('error', function(err) {
				reject(new Error("request_error"));
			});
			post_req.on('timeout', function(err) {
				reject(new Error("device_unavailable"));
			});
			post_req.write(data.replace('[command]', cmd));
			post_req.end();
		} catch (e) {
			reject(new Error("request_unexpected_error"));
		}
	});
}

module.exports = VieraDevice;