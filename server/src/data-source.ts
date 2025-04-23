import { DataSource } from "typeorm";
import { Order } from "./entities/Order";
import { RECertificate } from "./entities/RECertificate";
import { Trade } from "./entities/Trade";
import { CarbonCredit } from "./entities/CarbonCredit";

// Log database configuration
console.log('Database Configuration:', {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "green_iex",
});

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "green_iex",
  synchronize: true,
  logging: false,
  entities: [Order, RECertificate, Trade, CarbonCredit],
  migrations: [],
  subscribers: [],
  ssl: false,
  extra: {
    trustServerCertificate: true,
    options: "-c client_min_messages=error"
  },
  connectTimeoutMS: 5000
});
