import * as dotenv from 'dotenv'
import { ApplicationCommandRegistries, RegisterBehavior, SapphireClient } from '@sapphire/framework'
import { GatewayIntentBits } from 'discord.js'
import { TimerManager } from '@sapphire/time-utilities'

dotenv.config()

if (process.env.DISCORD_TOKEN === undefined) {
  console.error('No DISCORD_TOKEN assigned')
  process.exitCode = 1
  process.exit()
}

if (process.env.QRF_CHANNEL === undefined) {
  console.error('ERROR: QRF_CHANNEL VARIABLE NOT SET. QRF MESSAGES CANNOT BE SENT')
  process.exitCode = 1
  process.exit()
}

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages
  ],
  loadMessageCommandListeners: true
})

async function main(): Promise<void> {
  try {
    client.logger.info('Logging in...')
    await client.login(process.env.DISCORD_TOKEN)
    client.logger.info('Login successful')
  } catch (error) {
    client.logger.fatal(error)
    client.destroy()
    process.exitCode = 1
    process.exit()
  }
}

process.on('SIGTERM', () => {
  TimerManager.destroy()
})

void main()
