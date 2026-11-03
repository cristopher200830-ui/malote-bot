
module.exports = {
  async handleGroupCommands(sock, from, text, msg, config){
    const args = text.slice(1).split(" ")
    const cmd = args[0].toLowerCase()
    const metadata = await sock.groupMetadata(from)
    const isAdmin = metadata.participants.find(p => p.id === msg.key.participant)?.admin

    switch(cmd){
      case "todos": case "tagall": case "integrantes":
        let members = metadata.participants.map(a=>a.id)
        let t = `*${config.botName} - ${metadata.subject}*\nTotal: ${members.length}\n\n` + members.map((a,i)=>`${i+1}. @${a.split('@')[0]}`).join("\n")
        await sock.sendMessage(from, {text: t, mentions: members})
        break
      case "link": case "enlace":
        let code = await sock.groupInviteCode(from)
        await sock.sendMessage(from, {text: `Link: https://chat.whatsapp.com/${code}`})
        break
      case "cerrar": if(isAdmin){ await sock.groupSettingUpdate(from, 'announcement'); await sock.sendMessage(from, {text:"🔒 Grupo cerrado"})} break
      case "abrir": if(isAdmin){ await sock.groupSettingUpdate(from, 'not_announcement'); await sock.sendMessage(from, {text:"🔓 Grupo abierto"})} break
      case "kick": if(isAdmin){ let u = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(u) await sock.groupParticipantsUpdate(from, [u], "remove")} break
      case "promote": if(isAdmin){ let u = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(u) await sock.groupParticipantsUpdate(from, [u], "promote")} break
      case "info": await sock.sendMessage(from, {text: `*${metadata.subject}*\nMiembros: ${metadata.participants.length}\nDesc: ${metadata.desc||'Sin desc'}`}); break
      case "juegos": await sock.sendMessage(from, {text: `*JUEGOS ${config.botName}*\n!ruleta\n!dado\n!verdad\n!reto\n!sorteo`}); break
      case "ruleta": let e = metadata.participants[Math.floor(Math.random()*metadata.participants.length)]; await sock.sendMessage(from, {text:`🔫 Le toco a @${e.id.split('@')[0]} 💀`, mentions:[e.id]}); break
      case "dado": await sock.sendMessage(from, {text:`🎲 ${Math.floor(Math.random()*6)+1}`}); break
    }
  }
}
