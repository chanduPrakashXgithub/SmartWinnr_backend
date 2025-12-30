const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const { initializeSocket } = require('./socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Initialize socket handlers
initializeSocket(io);

// Make io available globally (for controllers if needed)
app.set('io', io);

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start listening
        server.listen(config.port, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║                                                    ║');
            console.log('║   🚀 CHAT APPLICATION SERVER                       ║');
            console.log('║                                                    ║');
            console.log(`║   📡 Server running on port ${config.port}                  ║`);
            console.log(`║   🌍 Environment: ${config.nodeEnv.padEnd(25)}      ║`);
            console.log(`║   🔗 API: http://localhost:${config.port}/api              ║`);
            console.log('║                                                    ║');
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
        });

        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Start the server
startServer();

module.exports = { server, io };
