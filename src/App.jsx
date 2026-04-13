import { useState, useEffect } from "react";
import axios from "axios";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";

import { WagmiProvider, useWalletClient } from "wagmi";
import { mainnet, polygon, arbitrum } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
const arcTestnet = { id: 5042002, name: "Arc Testnet", nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 }, rpcUrls: { default: { http: ["https://rpc.arc.blockdaemon.com"] } }, blockExplorers: { default: { name: "Arc Testnet Explorer", url: "https://explorer.arc.blockdaemon.com" } } };

const config = getDefaultConfig({
  appName: "GlobalPay FX",
  projectId: ".7d5817f219d3dcb5246444281dece24d",
  chains: [mainnet, polygon, arbitrum, arcTestnet],
});

const queryClient = new QueryClient();
const API = "https://globalpay-fx-backend-production.up.railway.app/api";
const WALLETS = [
  { id: "3ccb3a3b-75a3-533d-94db-fb5525cb4bfd", label: "Wallet 1 (Main)" },
  { id: "7dbbaa61-e13d-552b-a545-ae10d779a586", label: "Wallet 2" },
  { id: "9560960b-eea7-5bab-9cc4-49d7d21d2147", label: "Wallet 3" },
];

// Prediction Market Config
const PM_CONTRACT = "0xEFe27B9772AA59846844afd385Bf8c2601F05a4d";
const PM_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[{"internalType":"string","name":"question","type":"string"},{"internalType":"uint256","name":"duration","type":"uint256"}],"name":"createMarket","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"claimWinnings","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"getMarket","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"marketCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"bool","name":"prediction","type":"bool"}],"name":"placeBet","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"bool","name":"result","type":"bool"}],"name":"resolveMarket","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"claimWinnings","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

function PredictionsTab() {
  const { data: walletClient } = useWalletClient();
  const [markets, setMarkets] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [betAmounts, setBetAmounts] = useState({});

  async function getContract() {
    if (!walletClient) { setStatus("Connect wallet first"); return null; }
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    return new ethers.Contract(PM_CONTRACT, PM_ABI, signer);
  }

  async function loadMarkets() {
    try {
      setStatus("Loading markets...");
      const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
      const c = new ethers.Contract(PM_CONTRACT, PM_ABI, provider);
      const count = Number(await c.marketCount());
      const loaded = [];
      for (let i = 0; i < count; i++) {
        const m = await c.getMarket(i);
        loaded.push({ id: i, question: m[0], endTime: Number(m[1]), totalYes: ethers.formatEther(m[2]), totalNo: ethers.formatEther(m[3]), resolved: m[4], outcome: m[5] });
      }
      setMarkets(loaded);
      setStatus(count + " market(s) loaded");
    } catch(e) { setStatus("Error: " + e.message); }
  }

  useEffect(() => { loadMarkets(); }, []);

  async function placeBet(id, prediction) {
    const amt = betAmounts[id];
    if (!amt || Number(amt) <= 0) { setStatus("Enter bet amount"); return; }
    setLoading(true);
    try {
      const c = await getContract();
      if (!c) { setLoading(false); return; }
      const tx = await c.placeBet(id, prediction, { value: ethers.parseEther(amt) });
      setStatus("Confirming...");
      await tx.wait();
      setStatus("Bet placed! ✅");
      loadMarkets();
    } catch(e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  async function claim(id) {
    setLoading(true);
    try {
      const c = await getContract();
      if (!c) { setLoading(false); return; }
      const tx = await c.claimWinnings(id);
      await tx.wait();
      setStatus("Winnings claimed! 🎉");
    } catch(e) { setStatus("Error: " + e.message); }
    setLoading(false);
  }

  const pct = (yes, no) => {
    const y = parseFloat(yes), n = parseFloat(no), t = y + n;
    if (t === 0) return { yes: 50, no: 50 };
    return { yes: Math.round((y/t)*100), no: Math.round((n/t)*100) };
  };

  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#fff", margin: 0, fontSize: 18 }}>🎯 Predictions</h2>
        <button onClick={loadMarkets} style={{ background: "#1d4ed8", color: "white", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>🔄 Refresh</button>
      </div>
      {status && <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", padding: "10px 14px", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "#94a3b8" }}>{status}</div>}
      {markets.length === 0 && <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>No markets available yet.</div>}
      {markets.map(m => {
        const p = pct(m.totalYes, m.totalNo);
        const total = (parseFloat(m.totalYes) + parseFloat(m.totalNo)).toFixed(4);
        const timeLeft = new Date(m.endTime * 1000) > new Date()
          ? Math.ceil((m.endTime * 1000 - Date.now()) / 86400000) + "d left"
          : "Ended";
        return (
          <div key={m.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>#{m.id} · {timeLeft}</span>
              {m.resolved && <span style={{ background: m.outcome ? "#064e3b" : "#450a0a", color: m.outcome ? "#34d399" : "#f87171", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{m.outcome ? "YES Won" : "NO Won"}</span>}
            </div>
            <p style={{ color: "#e2e8f0", fontWeight: "600", margin: "0 0 12px", fontSize: 15, lineHeight: 1.4 }}>{m.question}</p>
            {/* Progress bar */}
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 8 }}>
              <div style={{ width: p.yes + "%", background: "#22c55e" }} />
              <div style={{ width: p.no + "%", background: "#ef4444" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#22c55e", fontSize: 13 }}>YES {p.yes}% · {m.totalYes} ETH</span>
              <span style={{ color: "#ef4444", fontSize: 13 }}>{p.no}% NO · {m.totalNo} ETH</span>
            </div>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>Pool: {total} ETH</div>
            {m.resolved ? (
              <button onClick={() => claim(m.id)} disabled={loading} style={{ width: "100%", background: "#0ea5e9", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: "600", cursor: "pointer" }}>
                💰 Claim Winnings
              </button>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount in ETH"
                  value={betAmounts[m.id] || ""}
                  onChange={e => setBetAmounts({ ...betAmounts, [m.id]: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, marginBottom: 8, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => placeBet(m.id, true)} disabled={loading} style={{ flex: 1, background: "#16a34a", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: "600", cursor: "pointer" }}>
                    ↑ Bet YES
                  </button>
                  <button onClick={() => placeBet(m.id, false)} disabled={loading} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: "600", cursor: "pointer" }}>
                    ↓ Bet NO
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MainApp() {
  const [balances, setBalances] = useState({});
  const [from, setFrom] = useState(WALLETS[0].id);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    fetchBalances();
  }, []);

  async function fetchBalances() {
    try {
      const res = await axios.get(`${API}/balances`);
      setBalances(res.data);
    } catch(e) { console.error(e); }
  }

  async function sendPayment() {
    setLoading(true);
    setStatus("");
    try {
      const res = await axios.post(`${API}/send`, { from, toAddress, amount: parseFloat(amount) });
      setStatus("✅ " + res.data.message);
      fetchBalances();
    } catch(e) { setStatus("❌ " + (e.response?.data?.error || e.message)); }
    setLoading(false);
  }

  const tabs = [
    { id: "home", icon: "⌂", label: "Home" },
    { id: "explore", icon: "◎", label: "Explore" },
    { id: "predictions", icon: "◈", label: "Predictions" },
    { id: "activity", icon: "◷", label: "Activity" },
    { id: "send", icon: "↗", label: "Send" },
  ];

  return (
    <div style={{ background: "#060d1a", minHeight: "100vh", color: "white", fontFamily: "system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b" }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Account 1</div>
          <div style={{ fontSize: 22, fontWeight: "700", color: "white" }}>GlobalPay FX</div>
        </div>
        <ConnectButton />
      </div>

      {/* Balance Card */}
      {activeTab === "home" && (
        <div style={{ padding: "24px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Total Balance</div>
            <div style={{ fontSize: 36, fontWeight: "700" }}>
              ${Object.values(balances).reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: "#22c55e", marginTop: 4 }}>+$0 (+0.00%)</div>
          </div>
          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 28 }}>
            {[["$", "Buy"], ["⇅", "Swap"], ["↗", "Send"], ["↙", "Receive"]].map(([icon, label]) => (
              <div key={label} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => label === "Send" && setActiveTab("send")}>
                <div style={{ width: 52, height: 52, background: "#1e293b", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Wallets */}
          <div style={{ background: "#0f172a", borderRadius: 14, padding: 16, border: "1px solid #1e293b" }}>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Wallets</div>
            {WALLETS.map(w => (
              <div key={w.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ color: "#94a3b8", fontSize: 14 }}>{w.label}</span>
                <span style={{ color: "white", fontWeight: "600" }}>${parseFloat(balances[w.id] || 0).toFixed(2)}</span>
              </div>
            ))}
            <button onClick={fetchBalances} style={{ marginTop: 12, background: "#1d4ed8", color: "white", border: "none", padding: "10px", borderRadius: 8, width: "100%", cursor: "pointer", fontSize: 14 }}>🔄 Refresh Balances</button>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === "predictions" && (
        <div style={{ padding: "20px 16px" }}>
          <PredictionsTab />
        </div>
      )}

      {/* Send Tab */}
      {activeTab === "send" && (
        <div style={{ padding: "20px 16px" }}>
          <h2 style={{ color: "#38bdf8", marginBottom: 20 }}>🚀 Send Payment</h2>
          <div style={{ background: "#0f172a", borderRadius: 14, padding: 16, border: "1px solid #1e293b" }}>
            <label style={{ color: "#64748b", fontSize: 13 }}>From Wallet</label>
            <select value={from} onChange={e => setFrom(e.target.value)} style={s.input}>
              {WALLETS.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
            <label style={{ color: "#64748b", fontSize: 13 }}>To Address</label>
            <input value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x..." style={s.input} />
            <label style={{ color: "#64748b", fontSize: 13 }}>Amount (USDC)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="5" type="number" style={s.input} />
            <button onClick={sendPayment} disabled={loading} style={{ ...s.btn(loading ? "#334155" : "#0ea5e9"), width: "100%", marginTop: 8 }}>
              {loading ? "Sending..." : "🚀 Send USDC"}
            </button>
            {status && <div style={{ padding: 12, background: "#0f172a", borderRadius: 8, color: "#94a3b8", marginTop: 12, fontSize: 13 }}>{status}</div>}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div style={{ padding: "20px 16px", textAlign: "center", color: "#475569", paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◷</div>
          <div>No recent activity</div>
        </div>
      )}

      {/* Explore Tab */}
      {activeTab === "explore" && (
        <div style={{ padding: "20px 16px", textAlign: "center", color: "#475569", paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <div>Explore coming soon</div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#0a1628", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-around", padding: "10px 0 20px" }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setActiveTab(t.id)} style={{ textAlign: "center", cursor: "pointer", padding: "4px 12px" }}>
            <div style={{ fontSize: t.id === "predictions" ? 22 : 20, color: activeTab === t.id ? "#3b82f6" : "#475569" }}>{t.icon}</div>
            <div style={{ fontSize: 10, color: activeTab === t.id ? "#3b82f6" : "#475569", marginTop: 3 }}>{t.label}</div>
            {t.id === "predictions" && activeTab !== "predictions" && (
              <div style={{ width: 6, height: 6, background: "#3b82f6", borderRadius: "50%", margin: "2px auto 0" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  input: { width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", padding: "10px 12px", borderRadius: 8, fontSize: 14, marginBottom: 12, marginTop: 4, boxSizing: "border-box", display: "block" },
  btn: (bg) => ({ background: bg, color: "white", border: "none", padding: "12px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "600" }),
};

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
