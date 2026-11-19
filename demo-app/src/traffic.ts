const BASE = process.env.DEMO_URL ?? "http://localhost:5000";

const scenarios: { weight: number; run: () => Promise<Response> }[] = [
  { weight: 40, run: () => fetch(`${BASE}/api/ok`) },
  { weight: 25, run: () => fetch(`${BASE}/api/users/${Math.floor(Math.random() * 1000)}`) },
  { weight: 8, run: () => fetch(`${BASE}/api/slow`) },
  { weight: 8, run: () => fetch(`${BASE}/api/db-delay`) },
  { weight: 6, run: () => fetch(`${BASE}/api/does-not-exist`) },
  { weight: 7, run: () => fetch(`${BASE}/api/boom`) },
  { weight: 3, run: () => fetch(`${BASE}/api/boom-type`) },
  {
    weight: 3,
    run: () =>
      fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@b.com", password: "hunter2" }),
      }),
  },
];

const total = scenarios.reduce((s, x) => s + x.weight, 0);
const pick = () => {
  let r = Math.random() * total;
  for (const s of scenarios) if ((r -= s.weight) <= 0) return s;
  return scenarios[0];
};

async function main() {
  console.log("Generating traffic... Ctrl+C to stop");
  let i = 0;
  while (true) {
    // vary load: bursts every ~60 requests
    const burst = i % 60 < 15 ? 8 : 2;
    await Promise.all(Array.from({ length: burst }, () => pick().run().catch(() => null)));
    i++;
    await new Promise((r) => setTimeout(r, 400));
  }
}
main();