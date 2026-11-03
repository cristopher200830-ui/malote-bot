
const fs = require('fs')
async function getPpUrl(sock, jid){
  try { return await sock.profilePictureUrl(jid, 'image') } 
  catch { return "./assets/bot-profile.jpg" }
}
async function sendWelcome(sock, groupId, participant, metadata, config){
  const ppUrl = await getPpUrl(sock, participant)
  const userTag = participant.split('@')[0]
  let text = config.welcomeText
    .replace(/@user/g, `@${userTag}`)
    .replace(/@group/g, metadata.subject)
    .replace(/@botname/g, config.botName)
  
  // 1. Envía foto de perfil del que entra + texto
  await sock.sendMessage(groupId, {
    image: { url: ppUrl },
    caption: text,
    mentions: [participant]
  })
  // 2. Envía sticker de su foto
  await sock.sendMessage(groupId, { sticker: { url: ppUrl } })
  // 3. Envía sticker de tu gato (perfil del bot)
  await sock.sendMessage(groupId, { sticker: { url: config.welcomeImg } })
}

async function sendGoodbye(sock, groupId, participant, metadata, config){
  const ppUrl = await getPpUrl(sock, participant)
  const userTag = participant.split('@')[0]
  let text = config.goodbyeText
    .replace(/@user/g, `@${userTag}`)
    .replace(/@group/g, metadata.subject)
    .replace(/@botname/g, config.botName)

  await sock.sendMessage(groupId, {
    image: { url: ppUrl },
    caption: text,
    mentions: [participant]
  })
  await sock.sendMessage(groupId, { sticker: { url: ppUrl } })
}

module.exports = { sendWelcome, sendGoodbye, getPpUrl }
