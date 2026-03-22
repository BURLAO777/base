export function getGroupAdmins(participants) {
  let admins = []
  for (let i of participants) {
    if (i.admin === 'admin' || i.admin === 'superadmin') {
      admins.push(i.id)
    }
  }
  return admins
}