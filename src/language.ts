export default {
  lang: {
    en: 'English'
  },
  strings: {
    en: {
      verificationEmbed: {
        languageFlag: ':flag_gb:',
        greeting: 'Welcome to the %SERVER_NAME%\nSelect a language to continue',
        requirements: {
          title: 'Welcome to %SERVER_NAME%!',
          description:
            'This verification request will expire %EXPIRETIME%\n```Your unique verification code is: %CODE%```\nTo verify your account we require two screenshots of the following:',
          profilePhoto:
            'A complete screenshot of your profile page, showing enlistments, your playtime and your faction. A minimum playtime of 1 hour is required.',
          codePhoto:
            'A screenshot of you in-game in warden uniform and your unique verification code above your head and visible in the chat window',
          referenceImage:
            'Here are sample screenshots:\nhttps://cdn.discordapp.com/attachments/749364782737522758/750442609444520036/unknown.png'
        }
      },
      pending: 'Please wait for a moderator to verify you',
      approved: 'You have been verified welcome',
      denied: 'Your Application has been denied please restart the process.\nReason: %REASON%',
      error: 'Something went wrong. Try again later'
    }
  }
} as const
