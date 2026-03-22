import axios from 'axios';

const linkCommand = {
    name: 'link',
    alias: ['enlace', 'link'],
    category: 'group',
    group: true,
    botAdmin: true, // se valida desde el handler
    run: async ({ sock, msg, isBotAdmin }) => {
        try {
            if (!isBotAdmin) return sock.sendMessage(msg.key.remoteJid, { text: global.messages.botAdmin });

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
            const inviteCode = await sock.groupInviteCode(msg.key.remoteJid);
            const mainLink = `https://chat.whatsapp.com/${inviteCode}`;

            let shortLink;
            try {
                const { data } = await axios.post(
                    'https://dix.lat/v1/short.php',
                    { url: mainLink },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                shortLink = data.status ? data.url : 'No disponible';
            } catch (error) {
                console.error('Error al acortar:', error);
                shortLink = 'Error en el servicio';
            }

            const caption = `*─── 「 ENLACE DE GRUPO 」 ───*\n\n▢ *GRUPO:* ${groupMetadata.subject}\n▢ *MIEMBROS:* ${groupMetadata.participants.length}\n▢ *CREADOR:* @${groupMetadata.owner?.split('@')[0] || 'Desconocido'}\n\n▢ *ENLACE PRINCIPAL:*\n• ${mainLink}\n\n▢ *ENLACE CORTO:*\n• ${shortLink}\n\n*──────────────────────────*`;

            await sock.sendMessage(msg.key.remoteJid, {
                text: caption,
                contextInfo: {
                    mentionedJid: [groupMetadata.owner],
                    externalAdReply: {
                        title: 'INVITACIÓN OFICIAL',
                        body: groupMetadata.subject,
                        mediaType: 1,
                        sourceUrl: mainLink,
                        thumbnailUrl: await sock.profilePictureUrl(msg.key.remoteJid, 'image').catch(() => null),
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: msg });
        } catch (e) {
            console.error(e);
        }
    }
};

export default linkCommand;
