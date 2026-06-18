const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tempus_dev_secret_CHANGE_IN_PROD';

/**
 * RBAC role hierarchy.
 * administrador  → full access
 * contador       → read/write on all business entities
 * auxiliar       → limited write (permissions JSON governs exact ops)
 */
const ROLES = ['auxiliar', 'contador', 'administrador'];

/**
 * verifyToken — validates Bearer JWT and attaches decoded payload to req.user.
 * Payload shape: { id, email, nome, role }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.', code: 'MISSING_TOKEN' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    // backwards-compat: some older code reads req.usuario
    req.usuario = payload;
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(403).json({ error: 'Token inválido ou expirado.', code });
  }
}

/**
 * hasRole(roles) — factory that returns middleware allowing only the listed roles.
 * Example: router.delete('/:id', verifyToken, hasRole(['administrador']), handler)
 */
function hasRole(roles = []) {
  return (req, res, next) => {
    const userRole = req.user?.role || req.user?.perfil;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso negado: permissão insuficiente.',
        required: roles,
        current: userRole,
        code: 'INSUFFICIENT_ROLE',
      });
    }
    next();
  };
}

/** Shorthand middleware — admin only */
const adminOnly = hasRole(['administrador']);

/** Shorthand — contador or above */
const contadorOrAbove = hasRole(['contador', 'administrador']);

// Legacy alias kept for backwards-compat with existing routes
const autenticar = verifyToken;
const apenasAdmin = adminOnly;

module.exports = {
  verifyToken,
  autenticar,
  hasRole,
  adminOnly,
  apenasAdmin,
  contadorOrAbove,
  JWT_SECRET,
  ROLES,
};
