export async function simulateTransaction({
  body,
  user,
  project,
  accessKey,
}: {
  body: any;
  user: string;
  project: string;
  accessKey: string;
}) {
  try {
    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${user}/project/${project}/simulate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Key": accessKey as string,
        },
        body: JSON.stringify({
          /* Simulation Configuration */
          save: true, // if true simulation is saved and shows up in the dashboard
          save_if_fails: true, // if true, reverting simulations show up in the dashboard
          simulation_type: "quick", // full or quick (full is default)

          network_id: body?.networkId || "1", // network to simulate on

          /* Standard EVM Transaction object */
          from: body?.from || "", // governor address
          to: body?.target || "",
          input: body?.calldata || "0x",
          gas: 8000000,
          gas_price: 0,
          value: body?.value || 0,
        }),
      }
    );

    return { response: await response.json() };
  } catch (e: any) {
    return {
      error: e?.response?.data?.error?.message || e?.message || e,
    };
  }
}
