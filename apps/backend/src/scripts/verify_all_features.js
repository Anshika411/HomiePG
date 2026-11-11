require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const http = require("http");

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "bypass-tunnel-reminder": "true"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: "POST",
      headers
    }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(rawData) });
        } catch {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function put(url, data, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "bypass-tunnel-reminder": "true"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: "PUT",
      headers
    }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(rawData) });
        } catch {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "bypass-tunnel-reminder": "true"
      }
    }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(rawData) });
        } catch {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function verify() {
  console.log("🚀 Starting End-to-End API Features Verification...");
  
  // 1. Sign in as Owner
  console.log("Signing in as owner...");
  const signin = await post("http://localhost:5005/api/auth/signin", {
    email: "owner@homiepg.com",
    password: "password123"
  });

  if (signin.status !== 200) {
    console.error("❌ Signin failed:", signin.body || signin.raw);
    process.exit(1);
  }

  const token = signin.body.token;
  console.log("✅ Signed in! Token acquired.");

  // 2. Fetch owner buildings to get building ID
  console.log("\nFetching owner buildings...");
  const buildings = await get("http://localhost:5005/api/buildings", token);
  if (buildings.status !== 200 || buildings.body.length === 0) {
    console.error("❌ Failed to fetch buildings");
    process.exit(1);
  }
  const buildingId = buildings.body[0].id;
  console.log(`✅ Building found: ${buildings.body[0].building_name} (${buildingId})`);

  // 3. Test Room Suggestions API (returns bedId)
  console.log(`\nTesting Room Suggestions for Building ${buildingId}...`);
  const suggestions = await get(`http://localhost:5005/api/buildings/${buildingId}/room-suggestions?gender=Male&budget=10000`, token);
  if (suggestions.status === 200) {
    console.log("✅ Room Suggestions API succeeded:", JSON.stringify(suggestions.body));
    if (suggestions.body.suggestions && suggestions.body.suggestions.length > 0) {
      const first = suggestions.body.suggestions[0];
      if (first.hasOwnProperty("bedId")) {
        console.log(`🎉 SUCCESS: suggestion contains bedId: ${first.bedId}`);
      } else {
        console.error("❌ FAILED: suggestion does not contain bedId key!");
      }
    } else {
      console.log("ℹ️ No vacant matching rooms to assert bedId key. (Expected if database has no vacant ready beds).");
    }
  } else {
    console.error("❌ Room Suggestions API failed:", suggestions.body || suggestions.raw);
  }

  // 4. Fetch Owner Residents and verify rating notes upsert
  console.log("\nFetching residents list...");
  const residentsResponse = await get("http://localhost:5005/api/tenants/owner-residents", token);
  let residentsList = residentsResponse.body || [];

  if (residentsResponse.status === 200 && residentsList.length === 0) {
    console.log("No active residents found. Attempting to activate a left tenant for test setup...");
    const { supabase } = require("../config/supabase");
    const { data: leftTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("status", "left")
      .limit(1)
      .single();

    if (leftTenant) {
      await supabase
        .from("tenants")
        .update({ status: "active", expected_leave_date: null, actual_leave_date: null })
        .eq("id", leftTenant.id);
      
      console.log("Tenant reactivated! Re-fetching residents list...");
      const refetch = await get("http://localhost:5005/api/tenants/owner-residents", token);
      residentsList = refetch.body || [];
    }
  }

  if (residentsResponse.status === 200) {
    console.log(`✅ Residents list retrieved. Found: ${residentsList.length} residents`);
    if (residentsList.length > 0) {
      const resProfileId = residentsList[0].profileId;
      console.log(`Testing submit rating with review notes for Profile ${resProfileId}...`);
      
      const rateRes = await post(`http://localhost:5005/api/tenants/${resProfileId}/rating`, {
        rating: 4,
        behaviour: "excellent",
        pays_on_time: true,
        no_complaints: true,
        notes: "Very clean and cooperative resident."
      }, token);

      if (rateRes.status === 200) {
        console.log("✅ Rating and notes submitted successfully!");
        
        // Re-fetch residents to verify notes are returned
        console.log("Re-fetching residents list to verify notes mapping...");
        const refetch = await get("http://localhost:5005/api/tenants/owner-residents", token);
        const updatedRes = refetch.body.find(r => r.profileId === resProfileId);
        if (updatedRes && updatedRes.notes === "Very clean and cooperative resident.") {
          console.log("🎉 SUCCESS: Resident review notes correctly mapped in API response!");
        } else {
          console.error("❌ FAILED: Review notes not returned or mapped incorrectly in response!", updatedRes);
        }

        // Test KYC Document Verification API
        const tenantId = residentsList[0].id;
        const { supabase } = require("../config/supabase");
        // Insert a dummy KYC document for testing
        const { data: dummyDoc, error: docErr } = await supabase
          .from("tenant_documents")
          .insert({
            tenant_id: tenantId,
            document_type: "Aadhaar",
            document_number: "1234-5678-9012",
            file_url: "https://example.com/aadhaar.pdf",
            verified: false
          })
          .select()
          .single();

        if (!docErr && dummyDoc) {
          console.log(`\nTesting KYC verify-kyc for Document ID ${dummyDoc.id}...`);
          const kycVerifyRes = await post(`http://localhost:5005/api/tenants/verify-kyc/${dummyDoc.id}`, {
            action: "approve"
          }, token);

          if (kycVerifyRes.status === 200) {
            console.log("🎉 SUCCESS: KYC Document verified successfully via API:", JSON.stringify(kycVerifyRes.body));
          } else {
            console.error("❌ KYC Document verification failed:", kycVerifyRes.body || kycVerifyRes.raw);
          }
        } else {
          console.error("❌ Failed to insert dummy KYC document:", docErr);
        }

        // Test Checkout API
        console.log(`\nTesting checkout for tenant ID ${tenantId}...`);
        const checkoutRes = await post(`http://localhost:5005/api/tenants/${tenantId}/checkout`, {
          actual_leave_date: new Date().toISOString().split("T")[0],
          bed_status: "Maintenance"
        }, token);

        if (checkoutRes.status === 200) {
          console.log("🎉 SUCCESS: Tenant checkout processed successfully:", JSON.stringify(checkoutRes.body));
        } else {
          console.error("❌ Tenant checkout failed:", checkoutRes.body || checkoutRes.raw);
        }
      } else {
        console.error("❌ Rating submission failed:", rateRes.body || rateRes.raw);
      }
    }
  } else {
    console.error("❌ Failed to fetch residents:", residents.body || residents.raw);
  }

  // 5. Test Staff Salary Expense logging
  console.log("\nTesting Record Staff Salary Expense logging...");
  const expense = await post("http://localhost:5005/api/expenses", {
    building_id: buildingId,
    category: "Salary",
    amount: 12000,
    description: "Salary Payout for Cleaner (Test verification)"
  }, token);

  if (expense.status === 201) {
    console.log("🎉 SUCCESS: Salary expense recorded successfully:", JSON.stringify(expense.body));
  } else {
    console.error("❌ Salary expense recording failed:", expense.body || expense.raw);
  }

  // 6. Test Amenities API mapping
  console.log("\nTesting Amenities API mapping...");
  const globalAmenities = await get("http://localhost:5005/api/buildings/amenities", token);
  if (globalAmenities.status === 200 && globalAmenities.body.length > 0) {
    const amenityId = globalAmenities.body[0].id;
    console.log(`Mapping amenity ${globalAmenities.body[0].name} (${amenityId}) to building ${buildingId}...`);
    
    const saveAmenities = await post(`http://localhost:5005/api/buildings/${buildingId}/amenities`, {
      amenity_ids: [amenityId]
    }, token);

    if (saveAmenities.status === 200) {
      console.log("✅ Amenities mapped successfully! Fetching building detail to verify...");
      const buildingDetail = await get(`http://localhost:5005/api/buildings/${buildingId}`, token);
      if (buildingDetail.status === 200 && buildingDetail.body.building?.amenities) {
        const hasAmenity = buildingDetail.body.building.amenities.some(a => a.id === amenityId);
        if (hasAmenity) {
          console.log("🎉 SUCCESS: Building amenities correctly saved and returned in details payload!");
        } else {
          console.error("❌ FAILED: Amenities list mismatch in building detail response!");
        }
      } else {
        console.error("❌ FAILED: Could not fetch building details payload or amenities are missing!", buildingDetail.body);
      }
    } else {
      console.error("❌ Amenities POST save failed:", saveAmenities.body || saveAmenities.raw);
    }
  } else {
    console.error("❌ Failed to fetch global amenities list:", globalAmenities.body || globalAmenities.raw);
  }

  console.log("\n🎉 End-to-End API verification completed!");
}

verify();
