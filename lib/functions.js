export const getJid = (jid) => jid?.split('@')[0]

export const isOwner = (jid) => {
  return global.owner.includes(getJid(jid))
}

export const getAdmins = (participants = []) => {
  return participants
    .filter(p => p.admin)
    .map(p => p.id || p.jid)
}

export const isAdmin = (jid, participants) => {
  const admins = getAdmins(participants)
  return admins.includes(jid)
}