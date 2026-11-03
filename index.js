
// MALOTE BOT GROUP - 5 ARCHIVOS + TU GATO
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const P = require("pino")
const config = require("./config")
const { sendWelcome, sendGoodbye } = require("./welcome")
const { handleGroupCommands } = require("./functions")

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({level:"silent"}),
    browser: ["Malote Bot", "Chrome", "1.0"],
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  if(!sock.authState.creds.registered){
    const NUMERO = process.env.NUMERO || config.ownerNumber
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(NUMERO)
        console.log("\n===== MALOTE BOT - CODIGO 8 DIGITOS: " + code + " =====\n")
      } catch(e){ console.log(e) }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    if(u.connection === 'close'){
      let shouldReconnect = (u.lastDisconnect.error instanceof Boom) ? u.lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true
      if(shouldReconnect) start()
    }
  })

  sock.ev.on('group-participants.update', async (anu) => {
    try {
      const metadata = await sock.groupMetadata(anu.id)
      for(let p of anu.participants){
        await new Promise(r=>setTimeout(r,1500))
        if(anu.action == 'add') await sendWelcome(sock, anu.id, p, metadata, config)
        if(anu.action == 'remove') await sendGoodbye(sock, anu.id, p, metadata, config)
      }
    } catch(e){ console.log(e) }
  })

  sock.ev.on('messages.upsert', async (m) => {
    let msg = m.messages[0]; if(!msg.message || msg.key.fromMe) return
    let from = msg.key.remoteJid; if(!from.endsWith('@g.us')) return
    let text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim()
    if(!text.startsWith("!")) return
    await new Promise(r=>setTimeout(r,400))
    await handleGroupCommands(sock, from, text, msg, config)
  })
}
start()
