import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { clerkId: "seed_user_001" },
    update: {},
    create: {
      clerkId: "seed_user_001",
      email: "demo@homeos.app",
      firstName: "Demo",
      lastName: "User",
    },
  });

  console.log(`  Created user: ${user.email}`);

  // Create a sample home
  const home = await prisma.home.create({
    data: {
      name: "123 Main Street",
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      homeType: "single_family",
      yearBuilt: 2005,
      squareFeet: 2200,
      description: "Beautiful 3-bedroom home in the heart of SF",
      users: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  console.log(`  Created home: ${home.name}`);

  // Create rooms
  const kitchen = await prisma.room.create({
    data: {
      homeId: home.id,
      name: "Kitchen",
      roomType: "kitchen",
      floor: 1,
      description: "Modern open kitchen with island",
    },
  });

  const livingRoom = await prisma.room.create({
    data: {
      homeId: home.id,
      name: "Living Room",
      roomType: "living_room",
      floor: 1,
      description: "Spacious living room with fireplace",
    },
  });

  console.log(`  Created rooms: ${kitchen.name}, ${livingRoom.name}`);

  // Create items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        homeId: home.id,
        roomId: kitchen.id,
        name: "Samsung Refrigerator",
        category: "appliance",
        brand: "Samsung",
        model: "RF28R7351SR",
        modelNumber: "RF28R7351SR/AA",
        purchaseDate: new Date("2023-06-15"),
        purchasePrice: 2499.99,
        warrantyExpiry: new Date("2025-06-15"),
        condition: "excellent",
        description: "French door refrigerator with food showcase",
      },
    }),
    prisma.item.create({
      data: {
        homeId: home.id,
        roomId: kitchen.id,
        name: "Bosch Dishwasher",
        category: "appliance",
        brand: "Bosch",
        model: "SHPM88Z75N",
        modelNumber: "SHPM88Z75N",
        purchaseDate: new Date("2023-08-20"),
        purchasePrice: 1149.99,
        warrantyExpiry: new Date("2025-08-20"),
        condition: "good",
        description: "800 Series dishwasher with CrystalDry",
      },
    }),
    prisma.item.create({
      data: {
        homeId: home.id,
        roomId: livingRoom.id,
        name: "Dyson V15 Detect",
        category: "appliance",
        brand: "Dyson",
        model: "V15 Detect",
        purchaseDate: new Date("2024-01-10"),
        purchasePrice: 749.99,
        warrantyExpiry: new Date("2026-01-10"),
        condition: "excellent",
        description: "Cordless vacuum with laser dust detection",
      },
    }),
  ]);

  console.log(`  Created ${items.length} items`);
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
