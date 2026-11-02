import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import handler from './handler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PHONE_NUMBER = process.env.PHONE_NUMBER || process.argv[2] || ''
const PAIRING_DIR = './auth_info_baileys'

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(PAIRING_DIR)

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
        },
        browser: ['MALOTE BOT', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // Pairing code logic - 60s and auto-regenerate like pro bots
    if (!sock.authState.creds.registered) {
        if (!PHONE_NUMBER) {
            console.log('╔════════════════════════════════════╗')
            console.log('║  FALTA PHONE_NUMBER               ║')
            console.log('║  Pon variable PHONE_NUMBER en Render ║')
            console.log('║  Ejemplo: 51912345678              ║')
            console.log('╚════════════════════════════════════╝')
        } else {
            let cleanNumber = PHONE_NUMBER.replace(/[^0-9]/g, '')
            console.log(`\nSolicitando código para: ${cleanNumber}\n`)
            
            const generateCode = async () => {
                try {
                    await new Promise(r => setTimeout(r, 3000))
                    let code = await sock.requestPairingCode(cleanNumber)
                    code = code?.match(/.{1,4}/g)?.join('-') || code
                    console.log('╔══════════════════════════════════════════════════╗')
                    console.log(`║  MALOTE BOT - CÓDIGO DE VINCULACIÓN 60s         ║`)
                    console.log(`║                                                  ║`)
                    console.log(`║  CÓDIGO: ${code.padEnd(30)}║`)
                    console.log(`║  NÚMERO: ${cleanNumber.padEnd(30)}║`)
                    console.log(`║  Dura 60s y se regenera solo cada 55s           ║`)
                    console.log(`║                                                  ║`)
                    console.log(`║  WhatsApp > Dispositivos vinculados >            ║`)
                    console.log(`║  Vincular con número de teléfono                 ║`)
                    console.log('╚══════════════════════════════════════════════════╝\n')
                } catch (e) {
                    console.log('Error generando código:', e.message)
                    console.log('Reintentando en 10s...')
                }
            }

            await generateCode()
            // Auto regenera cada 55 segundos para que nunca expire en 1s
            setInterval(generateCode, 55000)
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode !== 401 : true)
            console.log('Conexión cerrada, reconectando...', shouldReconnect)
            if (shouldReconnect) start()
        } else if (connection === 'open') {
            console.log('╔══════════════════════════════════╗')
            console.log('║  MALOTE BOT CONECTADO ✓          ║')
            console.log('╚══════════════════════════════════╝')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            if (!m.message || m.key.fromMe) continue
            await handler(sock, m)
        }
    })
}

start()
