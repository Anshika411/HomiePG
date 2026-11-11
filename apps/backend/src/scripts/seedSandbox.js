require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // must be service key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: SUPABASE_URL or SUPABASE_KEY (service role key) is missing in backend env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateUser(user) {
  const authRole = user.role === "owner" ? "pg_owner" : user.role;
  
  try {
    const { data: listResult } = await supabase.auth.admin.listUsers();
    if (listResult && listResult.users) {
      const existing = listResult.users.find(u => u.email === user.email || u.phone === `+91${user.phone}`);
      if (existing) {
        console.log(`User ${user.email || user.phone} found in Auth list. ID: ${existing.id}`);
        return existing.id;
      }
    }
  } catch (err) {
    console.warn(`List users warning: ${err.message}`);
  }

  // Attempt creation
  const derivedPassword = crypto.createHmac("sha256", ENCRYPTION_KEY).update(user.phone).digest("hex");
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: user.email,
    phone: `+91${user.phone}`,
    password: derivedPassword,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { role: authRole, name: user.name, mobile_number: user.phone }
  });

  if (createError) {
    console.error(`Failed to create ${user.email}:`, createError.message || JSON.stringify(createError));
    return null;
  }

  console.log(`Created user ${user.email}. ID: ${newUser.user.id}`);
  return newUser.user.id;
}

async function seed() {
  console.log("🚀 Starting HomiePG Sandbox Database Seeding...");

  // 1. Create Mock Users in Supabase Auth
  const mockUsers = [
    { email: "admin@homiepg.com", phone: "9999999999", password: "password123", role: "super_admin", name: "Super Manager" },
    { email: "manager@homiepg.com", phone: "8888888888", password: "password123", role: "platform_manager", name: "Vikram Malhotra" },
    { email: "owner@homiepg.com", phone: "9876543210", password: "password123", role: "owner", name: "Amit Sharma" },
    { email: "owner_zolo@homiepg.com", phone: "9876543220", password: "password123", role: "owner", name: "Zolo Stays Operator" },
    { email: "owner_stanza@homiepg.com", phone: "9876543230", password: "password123", role: "owner", name: "Stanza Living Operator" },
    { email: "owner_nestaway@homiepg.com", phone: "9876543240", password: "password123", role: "owner", name: "Nestaway Operator" },
    { email: "propman@homiepg.com", phone: "7777777777", password: "password123", role: "property_manager", name: "Suresh Pillai" },
    { email: "tenant@homiepg.com", phone: "9876543211", password: "password123", role: "tenant", name: "Rajesh Kumar" },
    { email: "tenant_female@homiepg.com", phone: "9876543212", password: "password123", role: "tenant", name: "Priya Sharma" }
  ];

  const createdProfiles = {};

  for (const user of mockUsers) {
    console.log(`Checking/Creating user: ${user.email} (${user.role})...`);
    const userId = await getOrCreateUser(user);

    if (!userId) {
      console.error(`Could not initialize user ${user.email}`);
      continue;
    }

    const dbRole = user.role === "owner" ? "pg_owner" : user.role;
    const genderVal = user.email === "tenant_female@homiepg.com" ? "Female" : "Male";

    // Explicitly update profile details in profiles table
    let { data: profile, error: pError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        email: user.email,
        name: user.name,
        role: dbRole,
        status: "active",
        gender: genderVal,
        mobile: user.phone
      })
      .select()
      .maybeSingle();

    if (pError) {
      console.warn(`Upsert with gender failed, retrying without gender column: ${pError.message}`);
      const retry = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: user.email,
          name: user.name,
          role: dbRole,
          status: "active",
          mobile: user.phone
        })
        .select()
        .single();
      profile = retry.data;
      pError = retry.error;
    }

    if (pError) {
      console.error(`Failed to upsert profile for ${user.email}:`, pError.message);
    } else {
      if (!createdProfiles[user.role] || user.email === "tenant@homiepg.com") {
        createdProfiles[user.role] = profile;
        createdProfiles[dbRole] = profile;
      }
      createdProfiles[user.email] = profile;
    }
  }

  // Create Admins records for internal users
  for (const user of mockUsers) {
    if (user.role === "super_admin" || user.role === "platform_manager") {
      const profile = createdProfiles[user.email];
      if (profile) {
        const dept = user.role === "super_admin" ? "Administration" : "Operations";
        const perms = user.role === "super_admin" 
          ? ["manage_admins", "verify_listings", "view_reports"]
          : ["verify_listings", "audit_kyc", "assign_tasks"];
          
        const { error: aError } = await supabase
          .from("admins")
          .upsert({
            profile_id: profile.id,
            department: dept,
            permissions: perms,
            region_scope: ["Bangalore", "Gurgaon", "Noida"]
          });
          
        if (aError) {
          console.error(`Failed to seed admin details for ${user.email}:`, aError.message);
        } else {
          console.log(`Seeded admin details for ${user.email} (${dept}).`);
        }
      }
    }
  }

  const ownerProfile = createdProfiles["owner"];
  const tenantProfile = createdProfiles["tenant"];

  if (!ownerProfile || !tenantProfile) {
    console.error("❌ Error: Owner or Tenant profile could not be initialized.");
    return;
  }

  // Clean up existing records in reverse order of relationships to prevent duplicate key errors
  console.log("Cleaning up existing database records for seeding...");
  await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tenant_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("rent_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  
  // Set beds tenant_id to null first to avoid circular reference on delete
  await supabase.from("beds").update({ tenant_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
  
  await supabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("beds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("rooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("floors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("building_amenities").delete().neq("building_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("buildings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("pg_owners").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 2. Insert PG Owner record
  console.log("Inserting PG Owner record...");
  const { data: pgOwner, error: ownError } = await supabase
    .from("pg_owners")
    .upsert({
      profile_id: ownerProfile.id,
      company_name: "Amit PG Properties",
      verification_status: "pending",
      subscription_plan: "free"
    })
    .select()
    .single();

  if (ownError) {
    console.error("Owner record insert error:", ownError.message);
    return;
  }
  console.log(`PG Owner created: ID ${pgOwner.id}`);

  // Retrieve additional owners profiles
  const zoloProfile = createdProfiles["owner_zolo@homiepg.com"];
  const stanzaProfile = createdProfiles["owner_stanza@homiepg.com"];
  const nestawayProfile = createdProfiles["owner_nestaway@homiepg.com"];

  console.log("Inserting additional PG Owners...");
  const { data: pgOwnerZolo } = await supabase
    .from("pg_owners")
    .upsert({
      profile_id: zoloProfile.id,
      company_name: "Zolo Stays",
      verification_status: "verified",
      subscription_plan: "premium"
    })
    .select()
    .single();

  const { data: pgOwnerStanza } = await supabase
    .from("pg_owners")
    .upsert({
      profile_id: stanzaProfile.id,
      company_name: "Stanza Living",
      verification_status: "verified",
      subscription_plan: "premium"
    })
    .select()
    .single();

  const { data: pgOwnerNestaway } = await supabase
    .from("pg_owners")
    .upsert({
      profile_id: nestawayProfile.id,
      company_name: "Nestaway",
      verification_status: "verified",
      subscription_plan: "premium"
    })
    .select()
    .single();

  // 3. Create Buildings
  console.log("Inserting PG Buildings for all 8 cities...");

  const seedBuildings = [
    // Bangalore
    {
      owner_id: pgOwnerStanza.id,
      building_name: "Stanza Living Dublin House",
      address: "Electronic City Phase 1",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560100",
      gender_type: "Co-Living",
      description: { description: "Premium co-living by Stanza Living.", essentials: [] },
      security_deposit: 15000,
      monthly_rent_starting: 9500,
      latitude: 12.8452,
      longitude: 77.6602
    },
    {
      owner_id: pgOwnerZolo.id,
      building_name: "Zolo Stay Royal Crest",
      address: "Koramangala 4th Block",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      gender_type: "Men",
      description: { description: "Boys PG by Zolo Stays.", essentials: [] },
      security_deposit: 10000,
      monthly_rent_starting: 8200,
      latitude: 12.9315,
      longitude: 77.6299
    },
    // Delhi
    {
      owner_id: pgOwner.id,
      building_name: "Saraswati Girls PG Residence",
      address: "Mukherjee Nagar",
      city: "Delhi",
      state: "Delhi NCR",
      pincode: "110009",
      gender_type: "Women",
      description: { description: "Comfortable girls PG in Mukherjee Nagar.", essentials: [] },
      security_deposit: 8000,
      monthly_rent_starting: 7500,
      latitude: 28.6946,
      longitude: 77.2163
    },
    {
      owner_id: pgOwnerStanza.id,
      building_name: "Stanza Living Rome House",
      address: "Patel Nagar",
      city: "Delhi",
      state: "Delhi NCR",
      pincode: "110008",
      gender_type: "Co-Living",
      description: { description: "Premium co-living space near metro.", essentials: [] },
      security_deposit: 20000,
      monthly_rent_starting: 11500,
      latitude: 28.6453,
      longitude: 77.1587
    },
    // Mumbai
    {
      owner_id: pgOwnerNestaway.id,
      building_name: "Nestaway Cozy Living",
      address: "Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400069",
      gender_type: "Co-Living",
      description: { description: "Spacious flat-style rooms by Nestaway.", essentials: [] },
      security_deposit: 25000,
      monthly_rent_starting: 14000,
      latitude: 19.1136,
      longitude: 72.8697
    },
    {
      owner_id: pgOwnerZolo.id,
      building_name: "Zolo Stay Elite Powai",
      address: "Powai near Hiranandani",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      gender_type: "Men",
      description: { description: "Boys premium PG by Zolo Stays.", essentials: [] },
      security_deposit: 20000,
      monthly_rent_starting: 12500,
      latitude: 19.1176,
      longitude: 72.9060
    },
    // Hyderabad
    {
      owner_id: pgOwner.id,
      building_name: "Elite Coliving Spaces",
      address: "Gachibowli near DLF",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500032",
      gender_type: "Co-Living",
      description: { description: "Modern co-living space with premium amenities.", essentials: [] },
      security_deposit: 15000,
      monthly_rent_starting: 11000,
      latitude: 17.4483,
      longitude: 78.3488
    },
    {
      owner_id: pgOwner.id,
      building_name: "Sunrise Girls PG Stay",
      address: "Madhapur Near Metro",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      gender_type: "Women",
      description: { description: "Secure girls hostel near Hitec city.", essentials: [] },
      security_deposit: 10000,
      monthly_rent_starting: 8000,
      latitude: 17.4485,
      longitude: 78.3741
    },
    // Pune
    {
      owner_id: pgOwner.id,
      building_name: "Sai Baba PG For Boys",
      address: "Viman Nagar",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411014",
      gender_type: "Men",
      description: { description: "Boys PG in Viman Nagar.", essentials: [] },
      security_deposit: 7000,
      monthly_rent_starting: 6800,
      latitude: 18.5679,
      longitude: 73.9143
    },
    {
      owner_id: pgOwnerStanza.id,
      building_name: "Stanza Living Tokyo House",
      address: "Hinjewadi Phase 1",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411057",
      gender_type: "Co-Living",
      description: { description: "Stanza co-living space for IT professionals.", essentials: [] },
      security_deposit: 15000,
      monthly_rent_starting: 9800,
      latitude: 18.5913,
      longitude: 73.7389
    },
    // Chennai
    {
      owner_id: pgOwnerNestaway.id,
      building_name: "Chennai Oasis Co-Living",
      address: "OMR Karapakkam",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600097",
      gender_type: "Co-Living",
      description: { description: "Premium OMR co-living suites.", essentials: [] },
      security_deposit: 15000,
      monthly_rent_starting: 8900,
      latitude: 12.9157,
      longitude: 80.2314
    },
    {
      owner_id: pgOwner.id,
      building_name: "Marina Hostel for Girls",
      address: "Mylapore",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600004",
      gender_type: "Women",
      description: { description: "Girls PG close to Marina beach.", essentials: [] },
      security_deposit: 8000,
      monthly_rent_starting: 6500,
      latitude: 13.0330,
      longitude: 80.2677
    },
    // Gurgaon
    {
      owner_id: pgOwner.id,
      building_name: "Homie Stays Gurgaon",
      address: "Sector 45 Near Huda City Center",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122003",
      gender_type: "Co-Living",
      description: { description: "Premium co-living space with modern amenities.", essentials: [] },
      security_deposit: 5000,
      monthly_rent_starting: 8500,
      latitude: 28.4572,
      longitude: 77.0640
    },
    {
      owner_id: pgOwnerZolo.id,
      building_name: "Zolo Royal Crest Gurgaon",
      address: "Sector 21",
      city: "Gurgaon",
      state: "Haryana",
      pincode: "122016",
      gender_type: "Men",
      description: { description: "Boys premium PG by Zolo Stays.", essentials: [] },
      security_deposit: 10000,
      monthly_rent_starting: 8200,
      latitude: 28.4962,
      longitude: 77.0726
    },
    // Noida
    {
      owner_id: pgOwnerNestaway.id,
      building_name: "Noida Premium Suites",
      address: "Sector 62 near Fortis",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      gender_type: "Co-Living",
      description: { description: "Luxury suites near Noida Sector 62.", essentials: [] },
      security_deposit: 15000,
      monthly_rent_starting: 9200,
      latitude: 28.6255,
      longitude: 77.3710
    },
    {
      owner_id: pgOwnerNestaway.id,
      building_name: "Metro Nest Girls PG",
      address: "Sector 15 near Metro",
      city: "Noida",
      state: "Uttar Pradesh",
      pincode: "201301",
      gender_type: "Women",
      description: { description: "Comfortable girls PG in Noida Sector 15.", essentials: [] },
      security_deposit: 8000,
      monthly_rent_starting: 7200,
      latitude: 28.5785,
      longitude: 77.3115
    }
  ];

  let primaryBuilding = null;
  let primaryRoom = null;
  let primaryBed = null;

  for (const bData of seedBuildings) {
    const { data: dbBld, error: dbBldErr } = await supabase
      .from("buildings")
      .upsert({
        owner_id: bData.owner_id,
        building_name: bData.building_name,
        address: bData.address,
        city: bData.city,
        state: bData.state,
        pincode: bData.pincode,
        gender_type: bData.gender_type,
        description: JSON.stringify(bData.description),
        security_deposit: bData.security_deposit,
        monthly_rent_starting: bData.monthly_rent_starting,
        latitude: bData.latitude,
        longitude: bData.longitude
      })
      .select()
      .single();

    if (dbBldErr) {
      console.error(`Error seeding building ${bData.building_name}:`, dbBldErr.message);
      continue;
    }
    console.log(`Seeded building: ${dbBld.building_name} (${dbBld.city})`);

    // Seed Floor
    const { data: dbFloor, error: dbFloorErr } = await supabase
      .from("floors")
      .upsert({
        building_id: dbBld.id,
        floor_number: 1,
        floor_name: "First Floor"
      })
      .select()
      .single();

    if (dbFloorErr) {
      console.error("Floor insert error:", dbFloorErr.message);
      continue;
    }

    // Seed Room
    const { data: dbRoom, error: dbRoomErr } = await supabase
      .from("rooms")
      .upsert({
        floor_id: dbFloor.id,
        room_number: "101",
        room_type: "2-Sharing",
        capacity: 2,
        rent: bData.monthly_rent_starting
      })
      .select()
      .single();

    if (dbRoomErr) {
      console.error("Room insert error:", dbRoomErr.message);
      continue;
    }

    // Seed Beds
    const { data: dbBeds, error: dbBedsErr } = await supabase
      .from("beds")
      .upsert([
        { room_id: dbRoom.id, bed_number: "A", status: "Available" },
        { room_id: dbRoom.id, bed_number: "B", status: "Available" }
      ])
      .select();

    if (dbBedsErr) {
      console.error("Beds insert error:", dbBedsErr.message);
      continue;
    }

    if (bData.building_name === "Homie Stays Gurgaon") {
      primaryBuilding = dbBld;
      primaryRoom = dbRoom;
      primaryBed = dbBeds[0];
    }
  }

  // 7. Insert Tenant record
  console.log("Inserting Tenant record...");
  const { data: tenant, error: tenError } = await supabase
    .from("tenants")
    .upsert({
      profile_id: tenantProfile.id,
      owner_id: pgOwner.id,
      building_id: primaryBuilding.id,
      room_id: primaryRoom.id,
      bed_id: primaryBed.id,
      joining_date: new Date().toISOString().split("T")[0],
      deposit: 5000,
      monthly_rent: 8500,
      status: "active"
    })
    .select()
    .single();

  if (tenError) {
    console.error("Tenant record insert error:", tenError.message);
    return;
  }
  console.log(`Tenant record created: ID ${tenant.id}`);

  // 8. Create Booking request
  console.log("Inserting Tenant Booking request...");
  const { data: booking, error: bkError } = await supabase
    .from("bookings")
    .upsert({
      tenant_profile_id: tenantProfile.id,
      building_id: primaryBuilding.id,
      room_id: primaryRoom.id,
      bed_id: primaryBed.id,
      move_in_date: new Date().toISOString().split("T")[0],
      advance_amount: 5000,
      booking_status: "Pending"
    })
    .select()
    .single();

  if (bkError) {
    console.error("Booking insert error:", bkError.message);
  } else {
    console.log(`Booking created for tenant (ID: ${booking.id})`);
  }

  // 9. Create Rent Payment
  console.log("Inserting rent invoice...");
  const { error: invError } = await supabase
    .from("rent_payments")
    .upsert({
      tenant_id: tenant.id,
      amount: 8500,
      month: "2026-06",
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Pending"
    });

  if (invError) {
    console.error("Rent Payment insert error:", invError.message);
  } else {
    console.log("Rent payment invoice created successfully.");
  }

  console.log("✨ Seeding completed successfully!");
}

seed().catch(err => {
  console.error("Fatal seeding error:", err);
});
