//this is where a driver's location will be broadcasted to the dispatcher's map of a particular org. the location pings will be updated on postgres occasionally while this socket will give the 'live dot' on the map in real-time.
//inorder to prevent the locations of drivers from leaking, we will use rooms. each org will have its own room and only the drivers and dispatchers of that org will be able to access it.
//we wll save the data in the location pings table after every 10 seconds. 

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

//we have to verify the dispatcher/driver before any event handler fires. we have to grab the auth token, verify it and attach the real orgId/userId/role onto the socket object itself

export function initSocket(httpServer) {
    const io = new Server(httpServer, {
        pingTimeout: 30000,
        pingInterval: 10000,
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token; //grab the token the client sent when connecting
        if(!token) return next(new Error('No token provided')); //if no token, deny the connection
        try{
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; //attach the decoded token to the socket object
            next();
        }catch(err){
            console.warn(`[ws] Socket auth failed: ${err.message}`);
            next(new Error('Unauthorized')); //if token is invalid or expired, deny the connection
        }
    });

    io.on('connection', (socket) => {
        // Note: userId in the JWT payload is mapped to 'id'. We log both orgId and user's id (userId).
        console.log(`User Connected: ${socket.id} (org ${socket.user.orgId}, userId ${socket.user.id}, role ${socket.user.role})`);
        
        const lastPingTime = {}; //to keep track of the last time a driver's location was pinged
        
        //room assignment: when a dispatcher or driver opens the platform, they join their organization's room to broadcast/receive location updates.
        socket.on('join-org', () => {
            const roomName = `org-${socket.user.orgId}`;
            socket.join(roomName);
            console.log(`User ${socket.user.id} (${socket.user.role}) joined room ${roomName}`);
        });

        //handle incoming driver's live location stream
        socket.on('driver-location', async(data) => {
            const {driverId, latitude, longitude} = data;
            const orgId = socket.user.orgId;
            if(!latitude || !longitude) return;

            // Validate that the driver belongs to the user's org to prevent cross-tenant location leakage
            let verifiedDriverId = driverId;
            if (verifiedDriverId) {
                try {
                    const check = await pool.query(
                        "SELECT id FROM drivers WHERE id = $1 AND org_id = $2",
                        [verifiedDriverId, orgId]
                    );
                    if (check.rows.length === 0) {
                        console.warn(`[ws] Driver ${verifiedDriverId} does not belong to org ${orgId}`);
                        return;
                    }
                } catch(err) {
                    console.error("Driver verification error:", err);
                    return;
                }
            } else {
                // If no driverId provided, try to look up the driver record associated with this user
                try {
                    const lookup = await pool.query(
                        "SELECT id FROM drivers WHERE user_id = $1 AND org_id = $2",
                        [socket.user.id, orgId]
                    );
                    if (lookup.rows.length === 0) return;
                    verifiedDriverId = lookup.rows[0].id;
                } catch(err) {
                    console.error("Driver lookup error:", err);
                    return;
                }
            }

            //give dipatchers the real time 'live dot' moving. toOrg sends it to everyone in that org and .emit() sends the payload
            socket.to(`org-${orgId}`).emit('live-location-update', {
                driverId: verifiedDriverId,
                latitude,
                longitude,
                updatedAt: new Date(),
            });

            try{
                //save to postgres for history and analytics (but lightly, not on every single ping). wait 10-15 seconds
                if(!lastPingTime[verifiedDriverId] || Date.now() - lastPingTime[verifiedDriverId] > 15000){
                    await pool.query(
                        `INSERT INTO location_pings (driver_id, lat, lng, recorded_at) VALUES ($1, $2, $3, $4)`,
                        [verifiedDriverId, latitude, longitude, new Date()]
                    ); //need to map the values with the correct column names
                    lastPingTime[verifiedDriverId] = Date.now();
                    console.log(`Location pinged by driver ${verifiedDriverId}: ${latitude}, ${longitude}`);
                }
            }catch(err){
                console.error('Failed to save background location update', err);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`User Disconnected: ${socket.id} (reason: ${reason})`);
        });
    });

    return io;
}