import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Own client here: the seed runs outside Next.js.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Demo accounts only. Passwords are listed in the README.
const users = [
  { name: "System Admin", email: "admin@primewave.lk", password: "Admin@123", role: "ADMIN", department: "IT", phone: "0711111111" },
  { name: "Nimal Perera", email: "nimal@primewave.lk", password: "Member@123", role: "MEMBER", department: "Marketing", phone: "0712222222" },
  { name: "Ayesha Fernando", email: "ayesha@primewave.lk", password: "Member@123", role: "MEMBER", department: "Finance", phone: "0713333333" },
  { name: "Kasun Silva", email: "kasun@primewave.lk", password: "Member@123", role: "MEMBER", department: "Engineering", phone: "0714444444" },
] as const;

const resources = [
  { name: "Meeting Room A", type: "ROOM", location: "2nd Floor", capacity: 8, description: "Small room with a TV screen." },
  { name: "Board Room", type: "ROOM", location: "3rd Floor", capacity: 16, description: "Large table, video call setup." },
  { name: "Training Hall", type: "ROOM", location: "Ground Floor", capacity: 40, description: "For trainings and all-hands." },
  { name: "Projector 1", type: "EQUIPMENT", location: "IT Store", capacity: null, description: "Portable HD projector." },
  { name: "Projector 2", type: "EQUIPMENT", location: "IT Store", capacity: null, description: "Portable HD projector." },
  { name: "Company Van", type: "VEHICLE", location: "Car Park", capacity: 8, description: "8-seat van for site visits." },
] as const;

async function main() {
  for (const { password, ...user } of users) {
    const hash = await bcrypt.hash(password, 10);
    // upsert = safe to run many times, no duplicates.
    await db.user.upsert({ where: { email: user.email }, update: {}, create: { ...user, password: hash } });
  }

  for (const resource of resources) {
    await db.resource.upsert({ where: { name: resource.name }, update: {}, create: resource });
  }

  console.log(`Seed done: ${users.length} users, ${resources.length} resources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());