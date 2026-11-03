// MALOTE BOT GROUP - FIX 428 ERROR
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
    syncFullHistory: false,
    markOnlineOnConnect: false
  })

  sock.ev.on('creds.update', saveCreds)

  // CODIGO DE 8 DIGITOS - ARREGLADO PARA ERROR 428
  if(!sock.authState.creds.registered){
    const NUMERO = process.env.NUMERO || config.ownerNumber
    console.log("Esperando 8 segundos para pedir código...")
    setTimeout(async () => {
      let retries = 0
      while(retries < 3){
        try {
          console.log(`Intento ${retries+1} - Pidiendo código para ${NUMERO}`)
          let code = await sock.requestPairingCode(NUMERO)
          console.log(`\n===== MALOTE BOT - CODIGO 8 DIGITOS: ${code} =====\n`)
          console.log("¡COPIALO RAPIDO! Dura 20 segundos\n")
          break
        } catch(e){
          console.log(`Error ${e.output?.statusCode || e.message} - Reintentando en 10s...`)
          retries++
          await new Promise(r=>setTimeout(r,10000))
        }
      }
    }, 8000)
  }

  sock.ev.on('connection.update', async (u) => {
    if(u.connection === 'close'){
      let shouldReconnect = (u.lastDisconnect.error instanceof Boom) ? u.lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true
      if(shouldReconnect){
        console.log("Reconectando...")
        setTimeout(start, 3000)
      }
    }
    if(u.connection === 'open'){
      console.log("¡MALOTE BOT CONECTADO!")
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
