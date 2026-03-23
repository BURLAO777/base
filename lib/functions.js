export const cleanJid = (jid = '') => {
  return jid.split(':')[0].replace(/@.*$/, '')
}

export const isOwner = (jid) => {
  const num = cleanJid(jid)
  return global.owner.includes(num)
}

export const getAdmins = (participants = []) => {
  return participants
    .filter(p => p.admin)
    .map(p => cleanJid(p.id || p.jid))
}

export const isAdmin = (jid, participants) => {
  const num = cleanJid(jid)
  const admins = getAdmins(participants)
  return admins.includes(num)
}