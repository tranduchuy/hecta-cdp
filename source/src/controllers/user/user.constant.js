module.exports = {
  saltLength: 10,
  tokenConfirmEmailLength: 50,
  tokenExpiredInHour: 48,
  availableSortPropertiesForAdmin: [
    'name',
    'email',
    'username',
    'address',
    'city',
    'district',
    'ward',
    'role',
    'type'
  ],
  queryProperties: {
    like: ['name', 'username', 'email', 'phone'],
    exactly: ['city', 'district', 'ward', 'type', 'gender', 'role']
  }
};