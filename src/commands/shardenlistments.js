const { SlashCommandBuilder, codeBlock } = require('discord.js');
const { shardData } = require('../foxholeShards.js');
const AsciiTable = require('ascii-table');
const axios = require('axios');
const { axiosETAGCache } = require('axios-etag-cache');
const axiosWithETAGCache = axiosETAGCache(axios);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shardenlistments')
		.setDescription('Returns current Enlistments')
		.addStringOption(option =>
			option.setName('shard')
				.setDescription('Get a specific shards Enlistments')
				.addChoices(
					...Object.keys(shardData).map((shard) => ({ name: shardData[shard].name, value: shard })),
				)),
	async execute(interaction) {
		await interaction.deferReply();

		const shardName = interaction.options.getString('shard');
		const tableObject = {};

		async function getWarReport(shardAPI) {

			let colonialEnlistments = 0;
			let wardenEnlistments = 0;
			let totalEnlistments = 0;

			const homeRegions = [
				'HomeRegionC',
				'HomeRegionW',
			];

			const mapReports = homeRegions.map((sMap) =>
				axiosWithETAGCache({
					url: shardAPI + 'worldconquest/warReport/' + sMap,
					timeout: 5000,
				}),
			);

			try {
				const result = await Promise.all(mapReports);
				colonialEnlistments = result[0].data.totalEnlistments;
				wardenEnlistments = result[1].data.totalEnlistments;
				totalEnlistments = colonialEnlistments + wardenEnlistments;
			}
			catch (err) {
				console.log(err);
			}

			return {
				'Colonials': colonialEnlistments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
				'Wardens': wardenEnlistments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
				'Total': totalEnlistments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
			};
		}

		if (shardName !== null) {
			const shardAPI = shardData[shardName].api;
			try {
				const shardWarReport = await getWarReport(shardAPI);
				tableObject[shardData[shardName].name] = shardWarReport;
			}
			catch (error) {
				tableObject[shardData[shardName].name] = {
					'Colonials': '0',
					'Wardens': '0',
					'Total': '0',
				};
				console.log(error);
			}
		}
		else {
			const arrayShards = Object.keys(shardData);
			for (let i = 0; i < arrayShards.length; i++) {
				const currentShard = arrayShards[i];
				const shardAPI = shardData[currentShard].api;
				try {
					const shardWarReport = await getWarReport(shardAPI);
					tableObject[shardData[currentShard].name] = shardWarReport;
				}
				catch (error) {
					tableObject[shardData[shardName].name] = {
						'Colonials': '0',
						'Wardens': '0',
						'Total': '0',
					};
					console.log(error);
				}
			}
		}
		const table = new AsciiTable();
		table.setHeading('Shard', 'Colonials', 'Wardens', 'Total');
		const tableObjectKeys = Object.keys(tableObject);
		for (let i = 0; i < tableObjectKeys.length; i++) {
			const currentRow = tableObject[tableObjectKeys[i]];
			const rowValues = [];
			rowValues.push(tableObjectKeys[i]);
			rowValues.push(currentRow.Colonials);
			rowValues.push(currentRow.Wardens);
			rowValues.push(currentRow.Total);
			table.addRow(rowValues);
		}

		const tableBlock = codeBlock(table.toString());
		await interaction.editReply({ content: tableBlock });
	},
};