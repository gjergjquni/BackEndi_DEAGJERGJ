const SessionManager = require('./sessionManager');

class AuthMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    // Middleware për të kontrolluar nëse përdoruesi është i autentifikuar
    requireAuth(req, res, next) {
        const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
        
        if (!sessionId) {
            return res.status(401).json({ 
                message: 'Kërkohet autentifikim',
                error: 'NO_SESSION'
            });
        }

        const session = this.sessionManager.validateSession(sessionId);
        if (!session) {
            return res.status(401).json({ 
                message: 'Sesioni ka skaduar ose është i pavlefshëm',
                error: 'INVALID_SESSION'
            });
        }

        // Shto informacionin e përdoruesit në request
        req.user = {
            userId: session.userId,
            email: session.email
        };
        
        next();
    }

    // Middleware për të kontrolluar nëse përdoruesi është admin (opsional)
    requireAdmin(req, res, next) {
        this.requireAuth(req, res, () => {
            // Këtu mund të shtoni logjikë për të kontrolluar nëse përdoruesi është admin
            // Për momentin, të gjithë përdoruesit e autentifikuar kanë akses
            next();
        });
    }

    // Middleware për të kontrolluar nëse përdoruesi ka akses në të dhënat e një përdoruesi tjetër
    requireOwnership(req, res, next) {
        this.requireAuth(req, res, () => {
            const targetUserId = req.params.userId || req.body.userId;
            
            if (req.user.userId !== targetUserId) {
                return res.status(403).json({ 
                    message: 'Nuk keni leje për të aksesuar këto të dhëna',
                    error: 'ACCESS_DENIED'
                });
            }
            
            next();
        });
    }
}

module.exports = AuthMiddleware; 