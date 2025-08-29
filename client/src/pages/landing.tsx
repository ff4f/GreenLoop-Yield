import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  TrendingDown, 
  MapPin, 
  ShieldX, 
  Map, 
  ShieldCheck, 
  Camera, 
  FileText,
  ShoppingCart,
  Package,
  FilePlus,
  Activity,
  Award,
  Globe2,
  Building2,
  Layers,
  Trees,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Leaf className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">GreenLoop Yield</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('problem')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-problem"
              >
                Problem
              </button>
              <button 
                onClick={() => scrollToSection('solution')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-solution"
              >
                Solution
              </button>
              <button 
                onClick={() => scrollToSection('market')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-market"
              >
                Market
              </button>
              <Button 
                onClick={() => navigate('/app')}
                className="bg-primary text-primary-foreground hover:opacity-90"
                data-testid="nav-launch-app"
              >
                Launch App
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="fade-in stagger-1">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
                  Unlock Africa's <span className="text-primary">$6B Carbon Market</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Parcel-backed carbon credits with photo, satellite & ledger proofs. Forward deals (AMC) with escrow. Every click = evidence.
                </p>
              </div>
              
              <div className="fade-in stagger-2 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/app')}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  data-testid="button-explore-marketplace"
                >
                  Explore Marketplace
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => scrollToSection('how-it-works')}
                  className="border-border text-foreground hover:bg-muted"
                  data-testid="button-how-it-works"
                >
                  See How It Works
                </Button>
              </div>

              <div className="fade-in stagger-3 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                <Card className="text-center" data-testid="stat-africa">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">US$6B</div>
                    <div className="text-sm text-muted-foreground">Africa 2030</div>
                    <div className="text-xs text-muted-foreground">300M credits/yr</div>
                  </CardContent>
                </Card>
                <Card className="text-center" data-testid="stat-vcm">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">US$723M</div>
                    <div className="text-sm text-muted-foreground">VCM 2023</div>
                    <div className="text-xs text-muted-foreground">avg US$6.53/t</div>
                  </CardContent>
                </Card>
                <Card className="text-center" data-testid="stat-gly">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">5–15M t/yr</div>
                    <div className="text-sm text-muted-foreground">SOM target GLY</div>
                    <div className="text-xs text-muted-foreground">3 years</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="fade-in stagger-4">
              <img 
                src="https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="African landscape with renewable energy projects" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">The $723M Trust Crisis</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The voluntary carbon market faces an integrity crisis that's blocking billions in climate finance
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Financial crisis and market volatility" 
                className="rounded-xl shadow-lg w-full h-auto mb-8"
                data-testid="problem-image"
              />
            </div>
            
            <div className="space-y-8">
              <Card data-testid="problem-market-correction">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                    <h3 className="text-xl font-semibold text-foreground">Market Correction</h3>
                  </div>
                  <p className="text-muted-foreground">
                    2023 transaction value only US$723M, average price US$6.53/tCO₂e → buyers holding back due to integrity crisis
                  </p>
                </CardContent>
              </Card>
              
              <Card data-testid="problem-africa-supply">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPin className="w-6 h-6 text-destructive" />
                    <h3 className="text-xl font-semibold text-foreground">Africa Under-Supplied</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Target 300M credits/year by 2030 (~US$6B) exists, but supply is stuck due to upfront capital & scattered MRV evidence
                  </p>
                </CardContent>
              </Card>
              
              <Card data-testid="problem-reputation-risk">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <ShieldX className="w-6 h-6 text-destructive" />
                    <h3 className="text-xl font-semibold text-foreground">Reputation Risk</h3>
                  </div>
                  <p className="text-muted-foreground">
                    4,000+ companies committed to Net Zero need quality credits (safe claims), but fear reputation damage from "zombie credits"
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">GLY Solution: Proof-First Integrity</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transforming carbon credits through parcel-backed verification and blockchain-anchored proof chains
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Card data-testid="solution-parcel">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Map className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Parcel → tCO₂e Conservative</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Hectares become tons with buffer & forward rates (conservative estimates with geographic precision)
                  </p>
                </CardContent>
              </Card>
              
              <Card data-testid="solution-escrow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Forward/AMC + Escrow</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Pre-order deals with escrow protection → developers get capital faster, buyers get delivery guarantees
                  </p>
                </CardContent>
              </Card>
              
              <Card data-testid="solution-proof-feed">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Camera className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Proof-of-Impact Feed</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Photo geotag, NDVI satellite, QC checks → hash to HCS (immutable proof timeline)
                  </p>
                </CardContent>
              </Card>
              
              <Card data-testid="solution-claims">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Claims Helper</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Generate Claim Draft (PDF/JSON), ready for audit & CSR (ICVCM/VCMI-style compliance)
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <img 
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Forest conservation and mangrove restoration project" 
                className="rounded-xl shadow-lg w-full h-auto"
                data-testid="solution-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section id="how-it-works" className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Product Features</h2>
            <p className="text-xl text-muted-foreground">
              Real features delivering verifiable outcomes with blockchain-backed evidence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card data-testid="feature-marketplace">
              <CardContent className="p-6">
                <ShoppingCart className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Marketplace</h3>
                <p className="text-muted-foreground mb-4">
                  Lot 100–1,000 tCO₂e (parcel-backed), transparent pricing, click-to-verify proof chains
                </p>
                <Badge className="proof-badge">Proof: Click → Evidence</Badge>
              </CardContent>
            </Card>
            
            <Card data-testid="feature-orders">
              <CardContent className="p-6">
                <Package className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Orders</h3>
                <p className="text-muted-foreground mb-4">
                  Escrow, contracts, delivery, settlement (all transactions hash-anchored)
                </p>
                <Badge className="proof-badge">Hash: All Tx Recorded</Badge>
              </CardContent>
            </Card>
            
            <Card data-testid="feature-project-sheets">
              <CardContent className="p-6">
                <FilePlus className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Project Sheets</h3>
                <p className="text-muted-foreground mb-4">
                  Input area/rate/buffer/forward → auto-calculate tons & value with real-time pricing
                </p>
                <Badge className="proof-badge">Calc: Real-time Updates</Badge>
              </CardContent>
            </Card>
            
            <Card data-testid="feature-proof-feed">
              <CardContent className="p-6">
                <Activity className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Proof Feed</h3>
                <p className="text-muted-foreground mb-4">
                  Timeline evidence → hash & link Mirror/Hashscan (immutable audit trail)
                </p>
                <Badge className="proof-badge">Timeline: Immutable</Badge>
              </CardContent>
            </Card>
            
            <Card data-testid="feature-claims-helper">
              <CardContent className="p-6">
                <Award className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Claims Helper</h3>
                <p className="text-muted-foreground mb-4">
                  8-step workflow → fileId (HFS) + anchor (HCS) + NFT badge (HTS)
                </p>
                <Badge className="proof-badge">Output: fileId + NFT</Badge>
              </CardContent>
            </Card>
            
            <Card data-testid="feature-global-reach">
              <CardContent className="p-6">
                <Globe2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Global Reach</h3>
                <p className="text-muted-foreground mb-4">
                  Africa-focused supply, global buyer access, registry-agnostic verification
                </p>
                <Badge className="proof-badge">Scale: Continental</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Market Size */}
      <section id="market" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Market Opportunity</h2>
            <p className="text-xl text-muted-foreground">
              Massive addressable market with clear path to significant capture
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="text-center" data-testid="market-tam">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">$50B+</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">TAM VCM 2030</h3>
                <p className="text-muted-foreground">
                  Total Addressable Market for Voluntary Carbon Market by 2030
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-primary" data-testid="market-sam">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">$6B</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">SAM Africa 2030</h3>
                <p className="text-muted-foreground">
                  300M credits × $20/t high-integrity premium in African market
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center" data-testid="market-som">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-4">$50-150M</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">SOM GLY (3yr)</h3>
                <p className="text-muted-foreground">
                  5–15M t/yr @ $10/t average serviceable obtainable market
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Target Customers */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Target Customers</h2>
            <p className="text-xl text-muted-foreground">
              Three key segments driving demand for high-integrity carbon credits
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card data-testid="customer-corporate">
              <CardContent className="p-6">
                <Building2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Corporate Buyers</h3>
                <p className="text-muted-foreground mb-4">
                  Net-Zero committed companies (FMCG, telco, logistics, fintech) requiring 100k–1M t/yr with safe claim documentation
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Need:</strong> Safe claims, transparent pricing, 1-click verification
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="customer-aggregators">
              <CardContent className="p-6">
                <Layers className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Aggregators/Retailers</h3>
                <p className="text-muted-foreground mb-4">
                  Carbon credit exchanges and brokers needing credible supply with comprehensive proof packages for institutional clients
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Need:</strong> Credible supply, proof packages, institutional trust
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="customer-developers">
              <CardContent className="p-6">
                <Trees className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Project Developers</h3>
                <p className="text-muted-foreground mb-4">
                  African project developers (mangrove, cookstove, agroforestry, methane) needing capital access and global market exposure
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Need:</strong> Faster capital, split payouts, global buyer access
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">Value Proposition</h2>
            <p className="text-xl text-muted-foreground">
              Quantified benefits for each stakeholder segment
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Solar panels and wind turbines in African landscape showing renewable energy projects" 
                className="rounded-xl shadow-lg w-full h-auto"
                data-testid="value-prop-image"
              />
            </div>
            
            <div className="space-y-6">
              <Card data-testid="value-buyer">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                    <ShieldCheck className="w-5 h-5 text-primary mr-2" />
                    Buyer Value
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Safe claims (proof + claim draft ready for audit)</li>
                    <li>• Transparent pricing with market-rate discovery</li>
                    <li>• 1-click verification via blockchain anchors</li>
                    <li>• Reputation protection through audit trails</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card data-testid="value-developer">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 text-primary mr-2" />
                    Developer Value
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Faster capital access through AMC/escrow model</li>
                    <li>• Automated payout splits (dev/platform/registry)</li>
                    <li>• Global buyer exposure via marketplace</li>
                    <li>• Simplified MRV with automated proof capture</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card data-testid="value-market">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                    <Globe2 className="w-5 h-5 text-primary mr-2" />
                    Market Value
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Trust restoration → transaction volume recovery</li>
                    <li>• African supply acceleration through capital access</li>
                    <li>• Reduced verification costs via automation</li>
                    <li>• Enhanced liquidity through standardization</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Ask Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">Partnership & Investment Ask</h2>
          <p className="text-xl opacity-90 mb-12">
            Join us in unlocking Africa's carbon potential with proof-first integrity
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/10 backdrop-blur-sm text-center" data-testid="ask-buyer">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">≥50,000 t</div>
                <div className="text-sm opacity-80">Buyer Anchor</div>
                <div className="text-xs opacity-60">Forward deals mix</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm text-center" data-testid="ask-developer">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">≥3 Projects</div>
                <div className="text-sm opacity-80">Developer Tier-1</div>
                <div className="text-xs opacity-60">≥1Mt cumulative</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm text-center" data-testid="ask-operations">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">$500k</div>
                <div className="text-sm opacity-80">12mo Operations</div>
                <div className="text-xs opacity-60">MRV + compliance</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm text-center" data-testid="ask-partners">
              <CardContent className="p-6">
                <div className="text-2xl font-bold mb-2">Partners</div>
                <div className="text-sm opacity-80">Registry/Verifier</div>
                <div className="text-xs opacity-60">Global exchanges</div>
              </CardContent>
            </Card>
          </div>
          
          <Button 
            onClick={() => navigate('/app')}
            size="lg"
            className="bg-white text-primary hover:opacity-90"
            data-testid="button-explore-platform"
          >
            Explore Live Platform <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Trust Bar Footer */}
      <footer className="bg-muted py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
            <span className="font-mono">Every click = evidence: HTS / HCS / HFS / Mirror Node</span>
            <div className="mt-2">
              <span className="inline-flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Hedera 100% Native</span>
                <span className="mx-2">|</span>
                <CheckCircle className="w-4 h-4" />
                <span>HashConnect Powered</span>
                <span className="mx-2">|</span>
                <Globe2 className="w-4 h-4" />
                <span>Mirror Node Verified</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
