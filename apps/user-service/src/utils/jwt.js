const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load RSA private key for JWT signing
const getPrivateKey = () => {
  try {
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || '/app/secrets/private.pem';
    return fs.readFileSync(privateKeyPath, 'utf8');
  } catch (error) {
    console.error('Error loading JWT private key:', error.message);
    throw new Error('JWT private key not found');
  }
};

const getPublicKey = () => {
  try {
    const path = process.env.JWT_PUBLIC_KEY_PATH || '/app/secrets/public.pem';
    return fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error('JWT public key error:', err.message);
    throw new Error('JWT public key not found');
  }
};

const generateAccessToken = (user) => {
  const privateKey = getPrivateKey();
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      area_id: user.area_id, // Include area_id for delivery persons
    },
    privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: '7d' 
    }
  );
};

const generateRefreshToken = (user) => {
  const privateKey = getPrivateKey();
  return jwt.sign(
    { id: user.id },
    privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: '30d' 
    }
  );
}

const verifyToken = (token) => {
  const publicKey = getPublicKey();
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };