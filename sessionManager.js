const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> { userId, email, createdAt }
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 orë në milisekonda
    }

    // Krijo një sesion të ri për përdoruesin
    createSession(userId, email) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const session = {
            userId,
            email,
            createdAt: Date.now()
        };
        
        this.sessions.set(sessionId, session);
        return sessionId;
    }

    // Kontrollo nëse sesioni është i vlefshëm
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }

        // Kontrollo nëse sesioni ka skaduar
        if (Date.now() - session.createdAt > this.sessionTimeout) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session;
    }

    // Fshi sesionin
    destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }

    // Pastro sesionet e skaduara
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt > this.sessionTimeout) {
                this.sessions.delete(sessionId);
            }
        }
    }
}

module.exports = SessionManager; 