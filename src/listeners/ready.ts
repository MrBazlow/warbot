import { Listener } from '@sapphire/framework'
import { ActivityType } from 'discord.js'

export class UserEvent extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      once: true
    })
  }

  public run() {
    const { client, logger } = this.container
    logger.info(`Ready! Logged in as ${client.user?.tag ?? ''}`)
    client.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: 'Tom Petty And The Heartbreakers',
          type: ActivityType.Listening,
          url: 'https://open.spotify.com/track/7gSQv1OHpkIoAdUiRLdmI6?si=dceb7384fef7407b'
        }
      ]
    })
  }
}
