const cluster = require("node:cluster");
const os = require("node:os");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`[Load Balancer] Primary ${process.pid} is running.`);
  console.log(`[Load Balancer] Forking ${numCPUs} workers to handle traffic...`);
  
  // Fork the first worker and give it time to run database migrations
  // This helps prevent race conditions during concurrent startup on PostgreSQL
  cluster.fork({ IS_FIRST_WORKER: "1" });
  
  setTimeout(() => {
    for (let i = 1; i < numCPUs; i++) {
      cluster.fork({ IS_FIRST_WORKER: "0" });
    }
  }, 3000);

  cluster.on("exit", (worker, code, signal) => {
    console.log(`[Load Balancer] Worker ${worker.process.pid} died. Restarting...`);
    // Restart any died worker as a secondary worker to avoid DB migration races
    cluster.fork({ IS_FIRST_WORKER: "0" });
  });
} else {
  // Worker process
  require("./app.js");
}
