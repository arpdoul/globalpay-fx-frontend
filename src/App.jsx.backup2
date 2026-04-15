import { useState, useEffect } from "react";
import axios from "axios";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useWalletClient } from "wagmi";
import { mainnet, polygon, arbitrum, sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AppKit } from "@circle-fin/app-kit";
import { EthersAdapter } from "@circle-fin/adapter-ethers-v6";
import { BrowserProvider } from "ethers";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.arc.blockdaemon.com"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://explorer.arc.blockdaemon.com" } },
};

const config = getDefaultConfig({
  appName: "GlobalPay FX",
  projectId: "7d5817f219d3dcb5246444281dece24d",
  chains: [mainnet, polygon, arbitrum, sepolia, arcTestnet],
});

const queryClient = new QueryClient();
const API = import.meta.env.VITE_API_URL || "https://globalpay-fx-backend-production.up.railway.app/api";
const WALLETS = [
  { id: "3ccb3a3b-75a3-533d-94db-fb5525cb4bfd", label: "Wallet 1 (Main)" },
  { id: "7dbbaa61-e13d-552b-a545-ae10d779a586", label: "Wallet 2" },
  { id: "9560960b-eea7-5bab-9cc4-49d7d21d2147", label: "Wallet 3" },
];

const s = {
  app: { fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20, background: "#0f172a", minHeight: "100vh", color: "white" },
  card: { background: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 20 },
  input: { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, background: "#0f172a", color: "white", border: "1px solid #334155", boxSizing: "border-box" },
  select: { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, background: "#0f172a", color: "white", border: "1px solid #334155", boxSizing: "border-box" },
  btn: (color) => ({ width: "100%", padding: 14, background: color, color: "white", border: "none", borderRadius: 8, fontSize: 16, cursor: "pointer", fontWeight: "bold", marginBottom: 10 }),
  row: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #334155" },
  tab: (active) => ({ flex: 1, padding: 10, background: active ? "#0ea5e9" : "#1e293b", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 12 }),
  status: (type) => ({ padding: 12, background: "#0f172a", borderRadius: 8, color: type === "success" ? "#4ade80" : type === "error" ? "#f87171" : "#94a3b8", marginTop: 8, wordBreak: "break-all", fontSize: 13 }),
  label: { display: "block", marginBottom: 4, color: "#94a3b8", fontSize: 13 },
};

function MainApp() {
  const [activeTab, setActiveTab] = useState("wallets");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [balances, setBalances] = useState({});
  const [from, setFrom] = useState(WALLETS[0].id);
  const [toAddress, setToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [bridgeDir, setBridgeDir] = useState("to_arc");
  const [swapFrom, setSwapFrom] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const { data: walletClient } = useWalletClient();

  useEffect(() => { fetchBalances(); }, []);

  async function fetchBalances() {
    try {
      const results = {};
      for (const w of WALLETS) {
        const res = await axios.get(`${API}/balance/${w.id}`);
        console.log("wallet", w.id, "response:", JSON.stringify(res.data)); results[w.id] = res.data.balances?.[0]?.amount ?? "0";
      }
      setBalances(results);
    } catch (e) { console.error(e); }
  }

  async function getAdapter() {
    if (!walletClient) throw new Error("Connect your wallet first");
    const signer = await new BrowserProvider(walletClient).getSigner();
    return new EthersAdapter(signer);
  }

  function getKit() {
    const k = import.meta.env.VITE_KIT_KEY;
    if (!k) throw new Error("VITE_KIT_KEY missing");
    return new AppKit({ kitKey: k });
  }

  function setMsg(msg, type = "info") { setStatus(msg); setStatusType(type); }

  async function sendPayment() {
    setLoading(true); setMsg("Sending...");
    try {
      const res = await axios.post(`${API}/send`, { fromWalletId: from, toAddress, amount: sendAmount });
      setMsg(`✅ Sent! TX: ${res.data.txHash || JSON.stringify(res.data)}`, "success");
      fetchBalances();
    } catch (e) { setMsg(`❌ ${e.response?.data?.error || e.message}`, "error"); }
    setLoading(false);
  }

  async function handleBridge() {
    if (!bridgeAmount) return setMsg("❌ Enter amount", "error");
    setLoading(true); setMsg("🌉 Bridging... confirm in wallet");
    try {
      const adapter = await getAdapter();
      const result = await getKit().bridge({
        from: { adapter, chain: bridgeDir === "to_arc" ? "Ethereum_Sepolia" : "Arc_Testnet" },
        to: { adapter, chain: bridgeDir === "to_arc" ? "Arc_Testnet" : "Ethereum_Sepolia" },
        amount: String(bridgeAmount),
      });
      setMsg(`✅ Bridge done! TX: ${result?.transactionHash || JSON.stringify(result)}`, "success");
    } catch (e) { setMsg(`❌ ${e.message}`, "error"); }
    setLoading(false);
  }

  async function handleSwap() {
    if (!swapAmount) return setMsg("❌ Enter amount", "error");
    setLoading(true); setMsg("🔄 Swapping... confirm in wallet");
    try {
      const adapter = await getAdapter();
      const tokenOut = swapFrom === "USDC" ? "EURC" : "USDC";
      const result = await getKit().swap({
        from: { adapter, chain: "Arc_Testnet" },
        tokenIn: swapFrom, tokenOut, amountIn: String(swapAmount),
        config: { kitKey: import.meta.env.VITE_KIT_KEY },
      });
      setMsg(`✅ Swap done! TX: ${result?.transactionHash || JSON.stringify(result)}`, "success");
    } catch (e) { setMsg(`❌ ${e.message}`, "error"); }
    setLoading(false);
  }

  const noWallet = !walletClient;

  return (
    <div style={s.app}>
      <h1 style={{ textAlign: "center", color: "#38bdf8", marginBottom: 4 }}>🌍 GlobalPay FX</h1>
      <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: 16, fontSize: 13 }}>Multi-Currency Stablecoin Router</p>

      <div style={{ ...s.card, display: "flex", justifyContent: "center", padding: 14 }}>
        <ConnectButton />
      </div>

      <div style={{ display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden" }}>
        {[["wallets","💼 Wallets"],["send","🚀 Send"],["bridge","🌉 Bridge"],["swap","🔄 Swap"]].map(([id, label]) => (
          <button key={id} style={s.tab(activeTab === id)} onClick={() => { setActiveTab(id); setStatus(""); }}>{label}</button>
        ))}
      </div>

      {activeTab === "wallets" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>💼 Circle Wallets</h2>
          {WALLETS.map(w => (
            <div key={w.id} style={s.row}>
              <span>{w.label}</span>
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>{balances[w.id] !== undefined ? `${balances[w.id]} USDC` : "..."}</span>
            </div>
          ))}
          <button style={{ ...s.btn("#1d4ed8"), marginTop: 14 }} onClick={fetchBalances}>🔁 Refresh Balances</button>
        </div>
      )}

      {activeTab === "send" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>🚀 Send Payment</h2>
          <label style={s.label}>From Wallet</label>
          <select value={from} onChange={e => setFrom(e.target.value)} style={s.select}>
            {WALLETS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <label style={s.label}>To Address</label>
          <input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x..." style={s.input} />
          <label style={s.label}>Amount (USDC)</label>
          <input value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="e.g. 5" type="number" style={s.input} />
          <button onClick={sendPayment} disabled={loading} style={s.btn(loading ? "#334155" : "#0ea5e9")}>
            {loading ? "Sending..." : "🚀 Send USDC"}
          </button>
          {status && <div style={s.status(statusType)}>{status}</div>}
        </div>
      )}

      {activeTab === "bridge" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>🌉 Bridge USDC</h2>
          <label style={s.label}>Direction</label>
          <select value={bridgeDir} onChange={e => setBridgeDir(e.target.value)} style={s.select}>
            <option value="to_arc">Ethereum Sepolia → Arc Testnet</option>
            <option value="from_arc">Arc Testnet → Ethereum Sepolia</option>
          </select>
          <label style={s.label}>Amount (USDC)</label>
          <input value={bridgeAmount} onChange={e => setBridgeAmount(e.target.value)} placeholder="e.g. 1.00" type="number" style={s.input} />
          <div style={{ padding: 10, background: "#0f172a", borderRadius: 8, marginBottom: 12, fontSize: 12, color: "#94a3b8" }}>
            ℹ️ Wallet must have USDC on the source chain
          </div>
          <button onClick={handleBridge} disabled={loading || noWallet} style={s.btn(loading || noWallet ? "#334155" : "#7c3aed")}>
            {loading ? "Bridging..." : noWallet ? "Connect Wallet First" : "🌉 Bridge USDC"}
          </button>
          {status && <div style={s.status(statusType)}>{status}</div>}
        </div>
      )}

      {activeTab === "swap" && (
        <div style={s.card}>
          <h2 style={{ color: "#38bdf8", marginTop: 0 }}>🔄 Swap Tokens</h2>
          <label style={s.label}>Swap From</label>
          <select value={swapFrom} onChange={e => setSwapFrom(e.target.value)} style={s.select}>
            <option value="USDC">USDC → EURC</option>
            <option value="EURC">EURC → USDC</option>
          </select>
          <label style={s.label}>Amount ({swapFrom})</label>
          <input value={swapAmount} onChange={e => setSwapAmount(e.target.value)} placeholder="e.g. 1.00" type="number" style={s.input} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
            <span style={{ color: "#fbbf24" }}>{swapAmount || "0"} {swapFrom}</span>
            <span style={{ color: "#94a3b8" }}>→</span>
            <span style={{ color: "#4ade80" }}>≈{swapAmount || "0"} {swapFrom === "USDC" ? "EURC" : "USDC"}</span>
          </div>
          <button onClick={handleSwap} disabled={loading || noWallet} style={s.btn(loading || noWallet ? "#334155" : "#059669")}>
            {loading ? "Swapping..." : noWallet ? "Connect Wallet First" : `🔄 Swap ${swapFrom} → ${swapFrom === "USDC" ? "EURC" : "USDC"}`}
          </button>
          {status && <div style={s.status(statusType)}>{status}</div>}
        </div>
      )}

      <p style={{ textAlign: "center", color: "#334155", fontSize: 11 }}>GlobalPay FX · Arc Testnet · Circle App Kit</p>
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

