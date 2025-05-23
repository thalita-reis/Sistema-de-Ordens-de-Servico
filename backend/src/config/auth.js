module.exports = {
  secret: process.env.JWT_SECRET || 'super-secret-key',
  expiresIn: '7d'
};