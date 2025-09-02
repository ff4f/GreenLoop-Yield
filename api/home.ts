// SSR Home Page for GreenLoop Yield
// Server-side rendered landing page with 8 sections

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenLoop Yield - Unlock Africa's $6B Carbon Market</title>
  <meta name="description" content="Parcel-backed carbon credits with photo, satellite & ledger proofs. Forward deals (AMC) with escrow. Every click = evidence.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .section { padding: 80px 0; }
    .section:nth-child(even) { background: #f8f9fa; }
    .hero { background: linear-gradient(135deg, #1e3a8a 0%, #059669 100%); color: white; min-height: 100vh; display: flex; align-items: center; }
    .grid { display: grid; gap: 40px; align-items: center; }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .card-dark { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    .nav { position: fixed; top: 0; width: 100%; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); z-index: 1000; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
    .nav-content { display: flex; justify-content: space-between; align-items: center; }
    .logo { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: bold; color: #059669; }
    .nav-links { display: flex; gap: 30px; align-items: center; }
    .nav-link { color: #6b7280; text-decoration: none; transition: color 0.3s; }
    .nav-link:hover { color: #059669; }
    .btn { background: #059669; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; transition: opacity 0.3s; cursor: pointer; }
    .btn:hover { opacity: 0.9; }
    .btn-outline { background: transparent; border: 2px solid #059669; color: #059669; }
    .btn-white { background: white; color: #059669; }
    h1 { font-size: 3.5rem; font-weight: bold; margin-bottom: 20px; }
    h2 { font-size: 2.5rem; font-weight: bold; margin-bottom: 20px; text-align: center; }
    h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 15px; }
    .text-lg { font-size: 1.25rem; }
    .text-center { text-align: center; }
    .mb-4 { margin-bottom: 20px; }
    .mb-8 { margin-bottom: 40px; }
    .text-primary { color: #059669; }
    .text-muted { color: #6b7280; }
    .rounded-xl { border-radius: 12px; }
    .shadow-lg { box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
    .w-full { width: 100%; }
    .h-auto { height: auto; }
    .icon { width: 32px; height: 32px; margin-bottom: 15px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
    .stat-card { text-align: center; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; }
    .stat-number { font-size: 2rem; font-weight: bold; color: #10b981; }
    .stat-label { font-size: 0.9rem; opacity: 0.8; }
    .footer { background: #1f2937; color: white; padding: 20px 0; text-align: center; }
    .trust-bar { font-family: monospace; font-size: 0.9rem; opacity: 0.8; }
    .image-caption { font-size: 0.9rem; color: #6b7280; text-align: center; margin-top: 10px; font-style: italic; }
    @media (max-width: 768px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      h1 { font-size: 2.5rem; }
      h2 { font-size: 2rem; }
      .nav-links { display: none; }
      .stats { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="nav">
    <div class="container">
      <div class="nav-content">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
          </svg>
          GreenLoop Yield
        </div>
        <div class="nav-links">
          <a href="#problem" class="nav-link">Problem</a>
          <a href="#solution" class="nav-link">Solution</a>
          <a href="#market" class="nav-link">Market</a>
          <a href="/app" class="btn">Launch App</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Section 1: Hero -->
  <section class="hero section">
    <div class="container">
      <div class="grid grid-2">
        <div>
          <h1>Unlock Africa's <span class="text-primary">$6B Carbon Market</span></h1>
          <p class="text-lg mb-8">Parcel-backed carbon credits with photo, satellite & ledger proofs. Forward deals (AMC) with escrow. Every click = evidence.</p>
          <div style="display: flex; gap: 20px; margin-bottom: 40px;">
            <a href="/app" class="btn">Explore Marketplace</a>
            <a href="#how-it-works" class="btn btn-outline">See How It Works</a>
          </div>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">US$6B</div>
              <div class="stat-label">Africa 2030</div>
              <div style="font-size: 0.8rem; opacity: 0.6;">300M credits/yr</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">US$723M</div>
              <div class="stat-label">VCM 2023</div>
              <div style="font-size: 0.8rem; opacity: 0.6;">avg US$6.53/t</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">5–15M t/yr</div>
              <div class="stat-label">SOM target GLY</div>
              <div style="font-size: 0.8rem; opacity: 0.6;">3 years</div>
            </div>
          </div>
        </div>
        <div>
          <img src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
               alt="African landscape with renewable energy projects showcasing solar panels and wind turbines across savanna terrain" 
               class="rounded-xl shadow-lg w-full h-auto">
          <div class="image-caption">African renewable energy infrastructure driving carbon credit generation</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 2: Problem -->
  <section id="problem" class="section">
    <div class="container">
      <h2>The $723M Trust Crisis</h2>
      <p class="text-lg text-center text-muted mb-8">The voluntary carbon market faces an integrity crisis that's blocking billions in climate finance</p>
      
      <div class="grid grid-2">
        <div>
          <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
               alt="Financial crisis visualization showing market volatility and declining trust in carbon markets" 
               class="rounded-xl shadow-lg w-full h-auto mb-4">
          <div class="image-caption">Market volatility reflects integrity concerns in voluntary carbon markets</div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 30px;">
          <div class="card">
            <h3>📉 Market Correction</h3>
            <p class="text-muted">2023 transaction value only US$723M, average price US$6.53/tCO₂e → buyers holding back due to integrity crisis</p>
          </div>
          
          <div class="card">
            <h3>📍 Africa Under-Supplied</h3>
            <p class="text-muted">Target 300M credits/year by 2030 (~US$6B) exists, but supply is stuck due to upfront capital & scattered MRV evidence</p>
          </div>
          
          <div class="card">
            <h3>🛡️ Reputation Risk</h3>
            <p class="text-muted">4,000+ companies committed to Net Zero need quality credits (safe claims), but fear reputation damage from "zombie credits"</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Solution -->
  <section id="solution" class="section">
    <div class="container">
      <h2>GLY Solution: Proof-First Integrity</h2>
      <p class="text-lg text-center text-muted mb-8">Transforming carbon credits through parcel-backed verification and blockchain-anchored proof chains</p>
      
      <div class="grid grid-2">
        <div style="display: flex; flex-direction: column; gap: 30px;">
          <div class="card">
            <h3>🗺️ Parcel → tCO₂e Conservative</h3>
            <p class="text-muted">Hectares become tons with buffer & forward rates (conservative estimates with geographic precision)</p>
          </div>
          
          <div class="card">
            <h3>🛡️ Forward/AMC + Escrow</h3>
            <p class="text-muted">Pre-order deals with escrow protection → developers get capital faster, buyers get delivery guarantees</p>
          </div>
          
          <div class="card">
            <h3>📸 Proof-of-Impact Feed</h3>
            <p class="text-muted">Photo geotag, NDVI satellite, QC checks → hash to HCS (immutable proof timeline)</p>
          </div>
          
          <div class="card">
            <h3>📄 Claims Helper</h3>
            <p class="text-muted">Generate Claim Draft (PDF/JSON), ready for audit & CSR (ICVCM/VCMI-style compliance)</p>
          </div>
        </div>
        
        <div>
          <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
               alt="Forest conservation and mangrove restoration project showing healthy ecosystem with clear water and dense vegetation" 
               class="rounded-xl shadow-lg w-full h-auto mb-4">
          <div class="image-caption">Mangrove restoration projects providing verifiable carbon sequestration</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 4: Product Features -->
  <section id="how-it-works" class="section">
    <div class="container">
      <h2>Product Features</h2>
      <p class="text-lg text-center text-muted mb-8">Real features delivering verifiable outcomes with blockchain-backed evidence</p>
      
      <div class="grid grid-3">
        <div class="card">
          <div class="icon">🛒</div>
          <h3>Marketplace</h3>
          <p class="text-muted mb-4">Lot 100–1,000 tCO₂e (parcel-backed), transparent pricing, click-to-verify proof chains</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Proof: Click → Evidence</div>
        </div>
        
        <div class="card">
          <div class="icon">📦</div>
          <h3>Orders</h3>
          <p class="text-muted mb-4">Escrow, contracts, delivery, settlement (all transactions hash-anchored)</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Hash: All Tx Recorded</div>
        </div>
        
        <div class="card">
          <div class="icon">📋</div>
          <h3>Project Sheets</h3>
          <p class="text-muted mb-4">Input area/rate/buffer/forward → auto-calculate tons & value with real-time pricing</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Calc: Real-time Updates</div>
        </div>
        
        <div class="card">
          <div class="icon">📊</div>
          <h3>Proof Feed</h3>
          <p class="text-muted mb-4">Timeline evidence → hash & link Mirror/Hashscan (immutable audit trail)</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Timeline: Immutable</div>
        </div>
        
        <div class="card">
          <div class="icon">🏆</div>
          <h3>Claims Helper</h3>
          <p class="text-muted mb-4">8-step workflow → fileId (HFS) + anchor (HCS) + NFT badge (HTS)</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Output: fileId + NFT</div>
        </div>
        
        <div class="card">
          <div class="icon">🌍</div>
          <h3>Global Reach</h3>
          <p class="text-muted mb-4">Africa-focused supply, global buyer access, registry-agnostic verification</p>
          <div style="background: #10b981; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block;">Scale: Continental</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
             alt="Digital platform interface showing blockchain technology and data visualization for carbon credit tracking" 
             class="rounded-xl shadow-lg" style="width: 100%; max-width: 800px; height: auto;">
        <div class="image-caption">Blockchain-powered platform ensuring transparent and verifiable carbon credit transactions</div>
      </div>
    </div>
  </section>

  <!-- Section 5: Market Opportunity -->
  <section id="market" class="section">
    <div class="container">
      <h2>Market Opportunity</h2>
      <p class="text-lg text-center text-muted mb-8">Massive addressable market with clear path to significant capture</p>
      
      <div class="grid grid-3">
        <div class="card text-center">
          <div style="font-size: 3rem; font-weight: bold; color: #10b981; margin-bottom: 20px;">$50B+</div>
          <h3>TAM VCM 2030</h3>
          <p class="text-muted">Total Addressable Market for Voluntary Carbon Market by 2030</p>
        </div>
        
        <div class="card text-center" style="border: 2px solid #10b981;">
          <div style="font-size: 3rem; font-weight: bold; color: #10b981; margin-bottom: 20px;">$6B</div>
          <h3>SAM Africa 2030</h3>
          <p class="text-muted">300M credits × $20/t high-integrity premium in African market</p>
        </div>
        
        <div class="card text-center">
          <div style="font-size: 3rem; font-weight: bold; color: #10b981; margin-bottom: 20px;">$50-150M</div>
          <h3>SOM GLY (3yr)</h3>
          <p class="text-muted">5–15M t/yr @ $10/t average serviceable obtainable market</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <img src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
             alt="Global market visualization showing interconnected financial networks and growth opportunities across continents" 
             class="rounded-xl shadow-lg" style="width: 100%; max-width: 800px; height: auto;">
        <div class="image-caption">Global carbon market expansion opportunities across emerging economies</div>
      </div>
    </div>
  </section>

  <!-- Section 6: Target Customers -->
  <section class="section">
    <div class="container">
      <h2>Target Customers</h2>
      <p class="text-lg text-center text-muted mb-8">Three key segments driving demand for high-integrity carbon credits</p>
      
      <div class="grid grid-3">
        <div class="card">
          <div class="icon">🏢</div>
          <h3>Corporate Buyers</h3>
          <p class="text-muted mb-4">Net-Zero committed companies (FMCG, telco, logistics, fintech) requiring 100k–1M t/yr with safe claim documentation</p>
          <div style="font-size: 0.9rem; color: #6b7280;"><strong>Need:</strong> Safe claims, transparent pricing, 1-click verification</div>
        </div>
        
        <div class="card">
          <div class="icon">📊</div>
          <h3>Aggregators/Retailers</h3>
          <p class="text-muted mb-4">Carbon credit exchanges and brokers needing credible supply with comprehensive proof packages for institutional clients</p>
          <div style="font-size: 0.9rem; color: #6b7280;"><strong>Need:</strong> Credible supply, proof packages, institutional trust</div>
        </div>
        
        <div class="card">
          <div class="icon">🌳</div>
          <h3>Project Developers</h3>
          <p class="text-muted mb-4">African project developers (mangrove, cookstove, agroforestry, methane) needing capital access and global market exposure</p>
          <div style="font-size: 0.9rem; color: #6b7280;"><strong>Need:</strong> Faster capital, split payouts, global buyer access</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 40px;">
        <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400" 
             alt="Diverse business professionals collaborating on sustainability initiatives in modern office environment" 
             class="rounded-xl shadow-lg" style="width: 100%; max-width: 800px; height: auto;">
        <div class="image-caption">Corporate sustainability teams driving demand for verified carbon credits</div>
      </div>
    </div>
  </section>

  <!-- Section 7: Value Proposition -->
  <section class="section">
    <div class="container">
      <h2>Value Proposition</h2>
      <p class="text-lg text-center text-muted mb-8">Quantified benefits for each stakeholder segment</p>
      
      <div class="grid grid-2">
        <div>
          <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
               alt="Solar panels and wind turbines in African landscape showing renewable energy projects generating clean power" 
               class="rounded-xl shadow-lg w-full h-auto mb-4">
          <div class="image-caption">Renewable energy infrastructure creating measurable environmental impact</div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 25px;">
          <div class="card">
            <h3>🛡️ Buyer Value</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>• Safe claims (proof + claim draft ready for audit)</li>
              <li>• Transparent pricing with market-rate discovery</li>
              <li>• 1-click verification via blockchain anchors</li>
              <li>• Reputation protection through audit trails</li>
            </ul>
          </div>
          
          <div class="card">
            <h3>📈 Developer Value</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>• Faster capital access through AMC/escrow model</li>
              <li>• Automated payout splits (dev/platform/registry)</li>
              <li>• Global buyer exposure via marketplace</li>
              <li>• Simplified MRV with automated proof capture</li>
            </ul>
          </div>
          
          <div class="card">
            <h3>🌍 Market Value</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>• Trust restoration → transaction volume recovery</li>
              <li>• African supply acceleration through capital access</li>
              <li>• Reduced verification costs via automation</li>
              <li>• Enhanced liquidity through standardization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 8: Partnership Ask -->
  <section class="section" style="background: #1e3a8a; color: white;">
    <div class="container text-center">
      <h2 style="color: white;">Partnership & Investment Ask</h2>
      <p class="text-lg mb-8" style="opacity: 0.9;">Join us in unlocking Africa's carbon potential with proof-first integrity</p>
      
      <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
        <div class="card card-dark text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">≥50,000 t</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">Buyer Anchor</div>
          <div style="font-size: 0.8rem; opacity: 0.6;">Forward deals mix</div>
        </div>
        <div class="card card-dark text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">≥3 Projects</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">Developer Tier-1</div>
          <div style="font-size: 0.8rem; opacity: 0.6;">≥1Mt cumulative</div>
        </div>
        <div class="card card-dark text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">$500k</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">12mo Operations</div>
          <div style="font-size: 0.8rem; opacity: 0.6;">MRV + compliance</div>
        </div>
        <div class="card card-dark text-center">
          <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">Partners</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">Registry/Verifier</div>
          <div style="font-size: 0.8rem; opacity: 0.6;">Global exchanges</div>
        </div>
      </div>
      
      <a href="/app" class="btn btn-white">Explore Live Platform →</a>
      
      <div style="margin-top: 40px;">
        <img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300" 
             alt="Partnership handshake with global network connections representing international collaboration on climate solutions" 
             class="rounded-xl shadow-lg" style="width: 100%; max-width: 800px; height: auto;">
        <div class="image-caption" style="color: rgba(255,255,255,0.7);">Global partnerships driving climate finance innovation</div>
      </div>
    </div>
  </section>

  <!-- Trust Bar Footer -->
  <footer class="footer">
    <div class="container">
      <div class="trust-bar">Every click = evidence: HTS / HCS / HFS / Mirror Node</div>
      <div style="margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
        <span style="display: flex; align-items: center; gap: 5px;">🛡️ Hedera 100% Native</span>
        <span>|</span>
        <span style="display: flex; align-items: center; gap: 5px;">✅ HashConnect Powered</span>
        <span>|</span>
        <span style="display: flex; align-items: center; gap: 5px;">🌍 Mirror Node Verified</span>
      </div>
    </div>
  </footer>

  <script>
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}