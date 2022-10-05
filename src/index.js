const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes, Client, Collection, GatewayIntentBits } = require('discord.js');
// Comment me out before docker build
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Find all discord bot commands in ./commands folder
const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
	commands.push(command.data.toJSON());
}
// Send discord a list of all commands the bot can perform
try {
	if (!process.env.DISCORD_TOKEN) {
		return console.log('No DISCORD_TOKEN found');
	}
	const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
	rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
		.then(() => console.log('Successfully removed all previous Global Commands'))
		.then(() => rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands }))
		.then(() => console.log('Successfully registered commands as Global Commands.'))
		.catch(console.error);
}
catch (error) {
	return console.log(error);
}


// Find all events in ./events folder
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

