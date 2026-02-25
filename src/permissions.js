const ROLE_PERMISSIONS = {
  owner: new Set([
    'server.manage',
    'channel.create',
    'channel.delete',
    'message.send',
    'message.delete',
    'voice.join',
    'voice.moderate',
    'layout.edit',
  ]),
  admin: new Set([
    'channel.create',
    'channel.delete',
    'message.send',
    'message.delete',
    'voice.join',
    'voice.moderate',
    'layout.edit',
  ]),
  member: new Set(['message.send', 'voice.join']),
};

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || new Set();
}

function hasPermission(role, permission) {
  return getRolePermissions(role).has(permission);
}

module.exports = {
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
};
