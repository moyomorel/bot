// je corrige la syntaxe de l'import 
import  {DisconnectReason, makeWASocket,  useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import P from 'pino'
//import QRCode from 'qrcode'

async function startBot() {
    // Gestion de l'authentification (stockée dans un dossier)
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const { version } = await fetchLatestBaileysVersion()
    // Création du socket
    const sock = makeWASocket({
        version: version,
        auth: state,
        //logger: P(),
        printQRInTerminal: false,
    })

    // j'ai mit la sauvegarde des crédentials ici
    // Sauvegarde des credentials quand ils changent
    sock.ev.on('creds.update', saveCreds)

    // Écoute des mises à jour de connexion
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect} = update /* j'ai supprimé qr on authentifie avec le code 
                                                        d'appairage pas le qr code */

        //ça sert à rien de garder le qr code
        /*if (qr) {
            console.log('📱 QR code reçu, scanne-le avec WhatsApp:', qr)
            console.log(await QRCode.tostring(qr , {type:'terminal'}))
        }*/

        if (connection === 'open') {
            // c'est quand la connexion est établis avec succes que le client peux repondre à un message

            console.log('✅ Connecté à WhatsApp')

            // Exemple : répondre à un message
            sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0]
            if (!msg.key.fromMe && msg.message?.conversation) {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋, je suis ton bot Baileys !' })
                }
    })


        } else if (connection === 'close') {
            //attention on ne tente pas la reconnexion n'importe quand

            const statusCode = lastDisconnect?.error?.output?.statusCode //optionnel mais parlant

            const reason = lastDisconnect?.error?.toString() || 'Unknown'// raison de déconnexion

            console.log(`❌ Connexion fermée. raison: ${reason}, statuscode: ${statusCode} `)
            // on ne reconnecte que si on suppose que l'utilisateur a le client de son coté 
            // donc s'il n'a pas déconnecté l'appareil
            
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && reason !== 'Unknown'

            if(shouldReconnect){
                 // relance automatique si la sesssion est la chez l'user faire une attente de 5s pour pas
                 // brutaliser les serveurs de whatsapp
                console.log('🔄 Reconnecting in 5 seconds...');

                setTimeout(() => startBot(), 5000);

            } else {

                console.log('🚫 Logged out permanently. Please reauthenticate manually.');

            }
        }
    })

    setTimeout(async() => {
        //lors de la création du socket il faut maintenant créer un client whatsapp
        if(!state.creds.registered){//si l'etat de connexion n'existe pas on le crée

            const number = "237620644711" // tu mets le numéro ici 

            console.log(`requesting pairing code for ${number}`)

            const pairingCode = await sock.requestPairingCode(number)

            console.log(`entre ce code dans whatsapp pour pair ${pairingCode}`)       

        }
    }, 5000)

    return sock

}

startBot()
