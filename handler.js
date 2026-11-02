import fs from 'fs'
import path from 'path'

const menuImagePath1 = './media/menu.jpg'
const menuImagePath2 = './menu.jpg'

function getMenuImage() {
    if (fs.existsSync(menuImagePath1)) return fs.readFileSync(menuImagePath1)
    if (fs.existsSync(menuImagePath2)) return fs.readFileSync(menuImagePath2)
    return null
}

export default async function handler(sock, m) {
    const msg = m.message
    const text = (msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || '').toLowerCase().trim()
    const from = m.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    // No responder a estados ni a mensajes vacíos
    if (!text) return

    if (text === '.menu' || text === 'menu' || text === '.help' || text === '.malote') {
        const menuImage = getMenuImage()
        const menuText = `
╔══════════════════════════╗
║   𝙼𝙰𝙻𝙾𝚃𝙴 𝙱𝙾𝚃 🐱 24/7      ║
╚══════════════════════════╝

Hola! Soy MALOTE BOT, tu bot activo 24/7 en la nube.

*COMANDOS:*
➤ .menu - Muestra este menú (con tu foto de gato)
➤ .ping - Velocidad del bot
➤ .owner - Creador
➤ .sticker - Haz sticker de una imagen
➤ .alive - ¿Estoy vivo?

> Bot alojado en Render - Código dura 60s y se regenera solo
`.trim()

        if (menuImage) {
            await sock.sendMessage(from, { image: menuImage, caption: menuText }, { quoted: m })
        } else {
            await sock.sendMessage(from, { text: menuText }, { quoted: m })
        }
    }

    if (text === '.ping' || text === 'ping') {
        const start = Date.now()
        await sock.sendMessage(from, { text: 'Pong! 🏓' }, { quoted: m })
        const latency = Date.now() - start
        await sock.sendMessage(from, { text: `*Velocidad:* ${latency}ms\n*Estado:* Activo 24/7 en la nube ✓` })
    }

    if (text === '.alive') {
        await sock.sendMessage(from, { text: '✅ *MALOTE BOT ESTÁ VIVO* \n\n→ Hosting: Render.com\n→ Código: 60s auto-regen\n→ Foto menú: Tu gato malote\n→ 24/7 Activo' })
    }

    if (text === '.owner') {
        await sock.sendMessage(from, { text: '*Creador:* MALOTE\n*Bot:* MALOTE BOT 24/7\n*GitHub:* cristopher200830-ui' })
    }
}
