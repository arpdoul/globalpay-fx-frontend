import { useState, useEffect } from "react";
import axios from "axios";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, arbitrum } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: "GlobalPay FX",
  projectId: ".7d5817f219d3dcb5246444281dece24d",
  chains: [mainnet, polygon, arbitrum],
});

const queryClient = new QueryClient();
const API = "https://globalpay-fx-backend-production.up.railway.app.up.railway.app/api";
const WALLETS = [
  { id: "3ccb3a3b-75a3-533d-94db-fb5525cb4bfd", label: "Wallet 1 (Main)" },
  { id: "7dbbaa61-e13d-552b-a545-ae10d779a586", label: "Wallet 2" },
  { id: "9560960b-eea7-5bab-9cc4-49d7d21d2147", label: "Wallet 3" },
];

function MainApp() {
  const [balances, setBalances] = useState({});
  const [from, setFrom] = useState(WALLETS[0].id);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("circle");

  useEffect(() => { fetchAllBalances(); }, []);

  async function fetchAllBalances() {
    const results = {};
    for (const w of WALLETS) {
      try {
        const res = await axios.get(`${API}/balance/${w.id}`);
        const usdc = res.data.balances?.find(b => b.token?.symbol === "USDC");
        results[w.id] = usdc?.amount || "0";
      } catch { results[w.id] = "Error"; }
    }
    setBalances(results);
  }

  async function sendPayment() {
    if (!toAddress || !amount) return setStatus("⚠️ Fill all fields!");
    setLoading(true);
    setStatus("Sending...");
    try {
      const res = await axios.post(`${API}/send`, { fromWalletId: from, toAddress, amount });
      setStatus(`✅ Sent! TX ID: ${res.data.transaction?.id}`);
      setTimeout(fetchAllBalances, 3000);
    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  }

  const s = {
    app: { fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20, background: "#0f172a", minHeight: "100vh", color: "white" },
    card: { background: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 20 },
    input: { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, background: "#0f172a", color: "white", border: "1px solid #334155", boxSizing: "border-box" },
    btn: (color) => ({ width: "100%", padding: 14, background: color, color: "white", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", fontWeight: "bold", marginBottom: 10 }),
    row: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #334155" },
    tab: (active) => ({ flex: 1, padding: 12, background: active ? "#0ea5e9" : "#1e293b", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 14 }),
  };

  return (
    <div style={s.app}>
      <h1 style={{ textAlign: "center", color: "#38bdf8" }}>🌍 GlobalPay FX</h1>
      <p style={{ textAlign: "center", color: "#94a3b8" }}>Multi-Currency Stablecoin Payment Router</p>
      <div style={{ ...s.card, display: "flex", justifyContent: "center" }}>
        <ConnectButton />
      </div>
      <div style={{ display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden" }}>
        <button style={s.tab(activeTab === "circle")} onClick={() => setActiveTab("circle")}>💼 Circle Wallets</button>
        <button style={s.tab(activeTab === "send")} onClick={() => setActiveTab("send")}>📤 Send Payment</button>
      </div>
      {activeTab === "circle" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8" }}>💰 Wallet Balances</h2>
          {WALLETS.map(w => (
            <div key={w.id} style={s.row}>
              <span>{w.label}</span>
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>{balances[w.id] ?? "..."} USDC</span>
            </div>
          ))}
          <button onClick={fetchAllBalances} style={{ ...s.btn("#1d4ed8"), marginTop: 12 }}>🔄 Refresh</button>
        </div>
      )}
      {activeTab === "send" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8" }}>📤 Send Payment</h2>
          <label>From Wallet:</label>
          <select value={from} onChange={e => setFrom(e.target.value)} style={s.input}>
            {WALLETS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <label>To Address:</label>
          <input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x..." style={s.input} />
          <label>Amount (USDC):</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="5" type="number" style={s.input} />
          <button onClick={sendPayment} disabled={loading} style={s.btn(loading ? "#334155" : "#0ea5e9")}>
            {loading ? "Sending..." : "🚀 Send USDC"}
          </button>
          {status && <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, color: "#94a3b8" }}>{status}</div>}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MainApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
