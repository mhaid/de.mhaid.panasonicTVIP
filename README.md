# de.mhaid.panasonicTVIP

__App is still in Beta__

This app offers an IP remote control for your Panasonic Viera television.

The app has an automatic device search; if it does not detect your device, you can add it manually.

If the MAC address of the TV has been specified in addition to the IP, Homey will search in the background for a change of the IP-Adress of the TV.

For best user experience and stability, a static IP address is recommended. This can be set in the settings of your TV.

__FAQ__

**Is my TV supported?**
Officially Panasonic supports all flat-panel TVs from 2011 to 2018 with Viera functionality.
This homey app emulates the Panasonic TV Remote 2 app from Panasonic Corp; therefore any TV that can be controlled by this app should also be controlable by this homey app.

**What settings do I need to make on my TV to make the app work?**
First of all, the TV must be connected to the same network (via WLAN or LAN) as the Homey app.
The "TV Remote" setting in the Network-Settings must also be switched on.

**How do I add my device?**
After the setup process has been started via the Home app, a list of Panasonic devices (if applicable) appears on the network.
Normally Homey should automatically detect the TV and correctly identify the IP and MAC address.
If this is the case, you can click on this entry and no further settings need to be made.

**What is the MAC and IP address of my TV**
The MAC and IP address can be found in the TV's network settings.
The Mac address is also often given with colons instead of hyphens (e0:ce:c3:xx:xx:xx). Upper and lower case is not relevant because it consists of HEX numbers (0-F).

**The MAC address of my TV is detected, but the IP address is wrong. What now?**
In some cases the MAC address is detected correctly but the IP address is not.
To change the IP address, click on the entry with the correct MAC address and change the IP address in the next view.

**My TV is not detected at all**
In this case select the option "TV not found? Enter manually...".
Then enter the IP address of the TV in the next view.
Optionally you can also enter the MAC address. However, this is not absolutely necessary.

If you have further questions or if the app still doesn't work, create an issue on Github in this or send an email (mhaid2016@outlook.com).

__Acknowledgement__

Command requests based on the great work of m4recek: https://github.com/m4recek/panasonic-viera-remote-control

Wake On Lan based on the great work of agnat: https://github.com/agnat/node_wake_on_lan

To further improve the app, please report bugs and suggest new features on [GitHub (mhaid)](https://github.com/mhaid/de.mhaid.panasonicTVIP/issues)

Cheers!


View the App in [Homey Appstore](https://github.com/mhaid/de.mhaid.panasonicTVIP/issues)
