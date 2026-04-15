import { useState } from "react";
import axios from "axios";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, arbitrum, sepolia } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();
const config = getDefaultConfig({
  appName: "GlobalFX",
  projectId: "2b9394c7b3b9b7a5c6d8e9f0a1b2c3d4",
  chains: [mainnet, polygon, arbitrum, sepolia],
});

const CURRENCIES = [
  {code:"USD",flag:"🇺🇸"},{code:"EUR",flag:"🇪🇺"},{code:"GBP",flag:"🇬🇧"},
  {code:"NGN",flag:"🇳🇬"},{code:"JPY",flag:"🇯🇵"},{code:"CAD",flag:"🇨🇦"},
  {code:"AUD",flag:"🇦🇺"},{code:"CHF",flag:"🇨🇭"},{code:"CNY",flag:"🇨🇳"},
  {code:"INR",flag:"🇮🇳"},{code:"ZAR",flag:"🇿🇦"},{code:"GHS",flag:"🇬🇭"},
  {code:"KES",flag:"🇰🇪"},{code:"EGP",flag:"🇪🇬"},{code:"BRL",flag:"🇧🇷"},
  {code:"MXN",flag:"🇲🇽"},{code:"SGD",flag:"🇸🇬"},{code:"AED",flag:"🇦🇪"},
  {code:"SAR",flag:"🇸🇦"},{code:"TRY",flag:"🇹🇷"},
];

const styles = {
  page: {
    minHeight:"100vh",
    background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    display:"flex",alignItems:"center",justifyContent:"center",
    fontFamily:"'Segoe UI',sans-serif",padding:16,boxSizing:"border-box",
  },
  card: {
    background:"rgba(255,255,255,0.07)",backdropFilter:"blur(20px)",
    borderRadius:24,padding:32,width:"100%",maxWidth:440,
    border:"1px solid rgba(255,255,255,0.15)",boxShadow:"0 25px 50px rgba(0,0,0,0.4)",
  },
  header: {
    display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,
  },
  title: {
    color:"#fff",fontSize:26,fontWeight:800,margin:0,letterSpacing:"-0.5px",
  },
  label: {color:"rgba(255,255,255,0.6)",fontSize:12,marginBottom:6,display:"block",fontWeight:600,letterSpacing:1},
  input: {
    width:"100%",padding:"14px 16px",fontSize:18,borderRadius:12,
    border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",
    color:"#fff",boxSizing:"border-box",outline:"none",marginBottom:16,
  },
  row: {display:"flex",gap:12,alignItems:"center",marginBottom:20},
  select: {
    flex:1,padding:"12px 14px",fontSize:15,borderRadius:12,
    border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",
    color:"#fff",outline:"none",cursor:"pointer",
  },
  arrow: {color:"#fff",fontSize:22,flexShrink:0},
  btn: {
    width:"100%",padding:16,fontSize:17,fontWeight:700,cursor:"pointer",
    background:"linear-gradient(135deg,#667eea,#764ba2)",
    color:"#fff",border:"none",borderRadius:14,letterSpacing:0.5,
    boxShadow:"0 8px 24px rgba(102,126,234,0.4)",transition:"opacity 0.2s",
  },
  result: {
    marginTop:20,padding:20,
    background:"linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))",
    borderRadius:14,textAlign:"center",border:"1px solid rgba(102,126,234,0.3)",
  },
  resultText: {color:"#fff",fontSize:22,fontWeight:800,margin:0},
  resultSub: {color:"rgba(255,255,255,0.5)",fontSize:13,marginTop:6},
};

function App() {
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(null);

  const convert = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const r = res.data.rates[to];
      setRate(r.toFixed(4));
      setResult((amount * r).toFixed(2));
    } catch (e) {
      setResult("Error");
    }
    setLoading(false);
  };

  const fromFlag = CURRENCIES.find(c=>c.code===from)?.flag;
  const toFlag = CURRENCIES.find(c=>c.code===to)?.flag;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div style={styles.page}>
            <div style={styles.card}>
              <div style={styles.header}>
                <h1 style={styles.title}>🌍 GlobalFX</h1>
                <ConnectButton showBalance={false} chainStatus="none" />
              </div>

              <label style={styles.label}>AMOUNT</label>
              <input style={styles.input} type="number" placeholder="0.00"
                value={amount} onChange={e=>setAmount(e.target.value)} />

              <label style={styles.label}>CONVERT</label>
              <div style={styles.row}>
                <select style={styles.select} value={from} onChange={e=>setFrom(e.target.value)}>
                  {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <span style={styles.arrow}>⇄</span>
                <select style={styles.select} value={to} onChange={e=>setTo(e.target.value)}>
                  {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
              </div>

              <button style={styles.btn} onClick={convert} disabled={loading}>
                {loading ? "⏳ Converting..." : "Convert Now"}
              </button>

              {result && (
                <div style={styles.result}>
                  <p style={styles.resultText}>{fromFlag} {amount} {from} = {toFlag} {result} {to}</p>
                  <p style={styles.resultSub}>1 {from} = {rate} {to}</p>
                </div>
              )}

              <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,textAlign:"center",marginTop:24,marginBottom:0}}>
                Powered by GlobalFX • Live Exchange Rates
              </p>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
