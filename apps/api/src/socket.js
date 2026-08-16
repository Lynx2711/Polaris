// WebSocket Real-time Live Tracking Server (Socket.io)
// Functionality:
// 1. Authenticates incoming WebSocket handshakes via JWT middleware.
// 2. Isolates real-time traffic using organization room channels (`org-${orgId}`) to prevent cross-tenant data leaks.
// 3. Receives live driver GPS pings and broadcasts immediate position updates ("live dot") to dispatchers.
// 4. Throttles and persists location pings to PostgreSQL database every 15 seconds for historical route playback and analytics.

import { Server } from "socket.io"; // Socket.io server engine
import jwt from "jsonwebtoken";     // JSON Web Token verifier
import { pool } from "../db.js";    // PostgreSQL database connection pool

/**
 * Initializes and configures Socket.io server attached to HTTP server instance.
 * @param {Object} httpServer - Node.js HTTP server instance
 * @returns {Server} - Configured Socket.io server instance
 */
export function initSocket(httpServer) {
    // Instantiate Socket.io server with CORS and ping heartbeat configuration
    const io = new Server(httpServer, {
        pingTimeout: 30000,   // Wait 30 seconds for pong response before dropping client
        pingInterval: 10000,  // Send heartbeat ping every 10 seconds
        cors: {
            origin: "*",      // Allow connections from any frontend origin in dev
            methods: ["GET", "POST"]
        }
    });

    // -------------------------------------------------------------
    // Socket Middleware: JWT Handshake Authentication
    // -------------------------------------------------------------
    io.use(async (socket, next) => {
        // Extract authentication token supplied during connection handshake
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('No token provided')); // Reject connection if token missing

        try {
            // Cryptographically verify token using server JWT secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Attach decoded payload claims (id, orgId, role) directly to the socket connection object
            socket.user = decoded;
            next(); // Allow connection to proceed
        } catch (err) {
            console.warn(`[ws] Socket auth failed: ${err.message}`);
            next(new Error('Unauthorized')); // Reject connection if token signature invalid or expired
        }
    });

    // -------------------------------------------------------------
    // Connection Event Handlers
    // -------------------------------------------------------------
    io.on('connection', (socket) => {
        // Log client socket connection metadata
        console.log(`User Connected: ${socket.id} (org ${socket.user.orgId}, userId ${socket.user.id}, role ${socket.user.role})`);
        
        // Local in-memory timestamp map to throttle database writes per driver: { [driverId]: timestamp }
        const lastPingTime = {};
        
        // Event: Client joins organization channel room
        socket.on('join-org', () => {
            const roomName = `org-${socket.user.orgId}`;
            socket.join(roomName); // Join Socket.io room channel dedicated to user's organization ID
            console.log(`User ${socket.user.id} (${socket.user.role}) joined room ${roomName}`);
        });

        // Event: Driver transmits live GPS coordinates
        socket.on('driver-location', async (data) => {
            const { driverId, latitude, longitude } = data;
            const orgId = socket.user.orgId; // Retrieve authenticated organization ID
            
            // Validate incoming coordinates exist
            if (!latitude || !longitude) return;

            // Security check: verify driver belongs to user's organization to prevent cross-tenant data leakage
            let verifiedDriverId = driverId;
            if (verifiedDriverId) {
                try {
                    const check = await pool.query(
                        "SELECT id FROM drivers WHERE id = $1 AND org_id = $2",
                        [verifiedDriverId, orgId]
                    );
                    if (check.rows.length === 0) {
                        console.warn(`[ws] Driver ${verifiedDriverId} does not belong to org ${orgId}`);
                        return; // Ignore location broadcast if tenant mismatch
                    }
                } catch (err) {
                    console.error("Driver verification error:", err);
                    return;
                }
            } else {
                // If driverId omitted in payload, look up driver ID linked to current user account
                try {
                    const lookup = await pool.query(
                        "SELECT id FROM drivers WHERE user_id = $1 AND org_id = $2",
                        [socket.user.id, orgId]
                    );
                    if (lookup.rows.length === 0) return;
                    verifiedDriverId = lookup.rows[0].id;
                } catch (err) {
                    console.error("Driver lookup error:", err);
                    return;
                }
            }

            // Real-time broadcast: transmit "live dot" position update to all dispatchers in the org room channel
            socket.to(`org-${orgId}`).emit('live-location-update', {
                driverId: verifiedDriverId,
                latitude,
                longitude,
                updatedAt: new Date(),
            });

            // Database persistence: throttle inserts to location_pings table (at most once every 15 seconds)
            try {
                if (!lastPingTime[verifiedDriverId] || Date.now() - lastPingTime[verifiedDriverId] > 15000) {
                    await pool.query(
                        `INSERT INTO location_pings (driver_id, lat, lng, recorded_at) VALUES ($1, $2, $3, $4)`,
                        [verifiedDriverId, latitude, longitude, new Date()]
                    );
                    lastPingTime[verifiedDriverId] = Date.now(); // Update last database insert timestamp
                    console.log(`Location pinged by driver ${verifiedDriverId}: ${latitude}, ${longitude}`);
                }
            } catch (err) {
                console.error('Failed to save background location update', err);
            }
        });

        // Event: Client socket disconnects
        socket.on('disconnect', (reason) => {
            console.log(`User Disconnected: ${socket.id} (reason: ${reason})`);
        });
    });

    return io; // Return Socket.io server instance
}