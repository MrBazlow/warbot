const { ActivityType } = require('discord.js');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.user.setPresence({
			status: 'online',
			activities: [{ name: 'Huey Lewis & The News', type: ActivityType.Listening, url: 'https://open.spotify.com/track/648BMGrt98kUbLo24A4vgj?si=6d3849b705ca4e29' }],
		});
	},
};