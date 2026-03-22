import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys'
import P from 'pino'
import QRCode from 'qrcode'

async function startBot() {
    // Gestion de l'authentification (stockée dans un dossier)

    // Création du socket
    const sock = makeWASocket({
        auth: state,
        logger: P()
    })

    // Écoute des mises à jour de connexion
    sock.ev.on('connection.update', async (update) => {
        const { connection,lastDisconnect, qr } = update

        if (qr) {
            console.log('📱 QR code reçu, scanne-le avec WhatsApp:', qr)
            console.log(await QRCode.tostring(qr , {type:'terminal'}))
        }

        if (connection === 'open') {
            console.log('✅ Connecté à WhatsApp')
        } else if (connection === 'close') {
            console.log('❌ Connexion fermée....')
        }
    })

    // Sauvegarde des credentials quand ils changent
    sock.ev.on('creds.update', saveCreds)

    // Exemple : répondre à un message
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋, je suis ton bot Baileys !' })
        }
    })

    //reconnection avecles identifiants
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect} = update  
        if(connection === 'close' && (lastDisconnect?.error )?.output?.statusCode === DisconnectReason.restartRequired){
            
        }
    })

}

startBot()
