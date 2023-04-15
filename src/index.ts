import * as dotenv from 'dotenv'
import { ApplicationCommandRegistries, RegisterBehavior, SapphireClient } from '@sapphire/framework'
import { GatewayIntentBits } from 'discord.js'

dotenv.config()

if (process.env.DISCORD_TOKEN === undefined) {
  console.error('No DISCORD_TOKEN assigned')
  process.exit(1)
}

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds],
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
    process.exit(1)
  }
}

void main()
