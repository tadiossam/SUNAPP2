// ===============================================
// Node.js Script for Business Central OData (Windows/NTLM Auth)
// ===============================================

import readlineSync from "readline-sync";
import httpntlm from "httpntlm";

// Helper for NTLM GET requests
function ntlmGet(url, username, password, domain) {
  return new Promise((resolve, reject) => {
    httpntlm.get(
      {
        url: url,
        username: username,
        password: password,
        domain: domain,
        workstation: "",
        headers: { Accept: "application/json" },
      },
      (err, res) => {
        if (err) reject(err);
        else if (res.statusCode !== 200)
          reject(
            new Error(`HTTP ${res.statusCode}: ${res.statusMessage || "Error"}`)
          );
        else resolve(JSON.parse(res.body));
      }
    );
  });
}

(async () => {
  try {
    console.log("=== Business Central OData (Windows Auth) ===\n");

    // 1. Base URL
    const baseUrl = readlineSync.question(
      "Enter the base URL (e.g., http://192.168.0.16:7048/SUNCONBC1): "
    );

    // 2. Credentials
    const username = readlineSync.question("Enter your Windows username: ");
    const domain = readlineSync.question(
      "Enter your Windows domain (e.g., Sunshineinv): "
    );
    const password = readlineSync.question("Enter your password: ", {
      hideEchoBack: true,
    });

    // 3. Fetch Companies
    const companyUrl = `${baseUrl}/ODataV4/Company`;
    console.log("\nFetching companies...\n");

    const companies = await ntlmGet(companyUrl, username, password, domain);

    if (!companies.value || companies.value.length === 0) {
      console.log("No companies found.");
      return;
    }

    companies.value.forEach((c, i) => console.log(`${i + 1}. ${c.Name}`));

    // 4. Select Company
    const companyIndex = readlineSync.questionInt(
      "\nEnter the number of the company to select: "
    );
    const selected = companies.value[companyIndex - 1];
    if (!selected) throw new Error("Invalid selection.");

    console.log(`Selected Company: ${selected.Name}`);

    // 5. Choose data type
    const type = readlineSync.question(
      "Enter type to fetch (Items/FixedAssets): "
    );
    if (!["Items", "FixedAssets"].includes(type))
      throw new Error("Invalid type. Must be Items or FixedAssets.");

    // 6. Optional filter
    const filterValue = readlineSync.question(
      "Enter starting characters for 'No' (or press Enter for all): "
    );

    const encodedCompany = encodeURIComponent(selected.Name);
    let odataUrl = `${baseUrl}/ODataV4/Company('${encodedCompany}')/${type}`;
    if (filterValue)
      odataUrl += `?$filter=startswith(No,'${filterValue}')`;

    console.log(`\nFetching data from: ${odataUrl}\n`);

    // 7. Fetch data
    const data = await ntlmGet(odataUrl, username, password, domain);

    if (!data.value || data.value.length === 0) {
      console.log(`No ${type} records found.`);
    } else {
      console.log(`${type} records fetched successfully:\n`);
      data.value.forEach((item, idx) => {
        console.log(`${idx + 1}. ${JSON.stringify(item, null, 2)}\n`);
      });
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
