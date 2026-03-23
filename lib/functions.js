export const cleanJid = (jid = '') => {
  return jid
    .split(':')[0]
    .replace('@s.whatsapp.net', '')
    .replace('@lid', '')
}

export const isOwner = (jid) => {
  const num = cleanJid(jid)
  return global.owner.includes(num)
}

export const getAdmins = (participants = []) => {
  return participants
    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    .map(p => cleanJid(p.id || p.jid))
}

export const isAdmin = (jid, participants) => {
  const num = cleanJid(jid)
  const admins = getAdmins(participants)

  return admins.some(a => a === num)
}


export const getMention = (msg, sender) => {
  return msg?.key?.participant || msg?.participant || sender
}

export const getUser = (jid = '') => {
  return jid.split('@')[0]
}