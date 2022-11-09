const { SlashCommandBuilder, codeBlock } = require('discord.js');
const { shardData } = require('../foxholeShards.js');
const AsciiTable = require('ascii-table');
const axios = require('axios');
const { axiosETAGCache } = require('axios-etag-cache');
const axiosWithETAGCache = axiosETAGCache(axios);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shardstats')
		.setDescription('Returns stats')
		.addStringOption(option =>
			option.setName('shard')
				.setDescription('Get a specific shard stats')
				.addChoices(
					...Object.keys(shardData).map((shard) => ({ name: shardData[shard].name, value: shard })),
				)),
	async execute(interaction) {
		await interaction.deferReply();

		const shardName = interaction.options.getString('shard');
		const tableObject = {};

		async function fetchJSON(url) {
			const res = await axiosWithETAGCache({
				url: url,
				timeout: 2000,
			});
			return res.data;
		}

		async function getMaps(api) {
			try {
				const shardMaps = JSON.parse(JSON.stringify(await fetchJSON(api + 'worldconquest/maps')));
				return shardMaps;
			}
			catch (error) {
				console.log(error);
			}
		}

		async function getWarReport(shardAPI, serverMaps) {

			let totalColonialCasualties = 0;
			let totalWardenCasualties = 0;
			let totalCasualties = 0;
			let dayOfWar = 0;

			const mapReports = serverMaps.map((sMap) =>
				axiosWithETAGCache(shardAPI + 'worldconquest/warReport/' + sMap),
			);
			try {
				const result = await Promise.all(mapReports);
				result.map((returnedResult) => {
					const report = JSON.parse(JSON.stringify(returnedResult.data));
					totalColonialCasualties = totalColonialCasualties + report.colonialCasualties;
					totalWardenCasualties = totalWardenCasualties + report.wardenCasualties;
					dayOfWar = report.dayOfWar;
				});
			}
			catch (err) {
				console.log(err);
			}


			totalCasualties = totalColonialCasualties + totalWardenCasualties;

			return {
				'Colonials': totalColonialCasualties.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
				'Wardens': totalWardenCasualties.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
				'Total': totalCasualties.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
				'Day': dayOfWar.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
			};
		}

		if (shardName !== null) {
			const shardAPI = shardData[shardName].api;
			try {
				const mapList = await getMaps(shardAPI);
				const shardWarReport = await getWarReport(shardAPI, mapList);
				tableObject[shardData[shardName].name] = shardWarReport;
			}
			catch (error) {
				tableObject[shardData[shardName].name] = {
					'Colonials': '0',
					'Wardens': '0',
					'Total': '0',
					'Day': '0',
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
					const mapList = await getMaps(shardAPI);
					const shardWarReport = await getWarReport(shardAPI, mapList);
					tableObject[shardData[currentShard].name] = shardWarReport;
				}
				catch (error) {
					console.log(error);
				}
			}
		}
		const table = new AsciiTable();
		table.setHeading('Shard', 'Colonials', 'Wardens', 'Total', 'Day');
		const tableObjectKeys = Object.keys(tableObject);
		for (let i = 0; i < tableObjectKeys.length; i++) {
			const currentRow = tableObject[tableObjectKeys[i]];
			const rowValues = [];
			rowValues.push(tableObjectKeys[i]);
			rowValues.push(currentRow.Colonials);
			rowValues.push(currentRow.Wardens);
			rowValues.push(currentRow.Total);
			rowValues.push(currentRow.Day);
			table.addRow(rowValues);
		}

		const tableBlock = codeBlock(table.toString());
		await interaction.editReply({ content: tableBlock });
	},
};