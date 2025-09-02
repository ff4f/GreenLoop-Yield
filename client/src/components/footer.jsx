import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Twitter, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-eco-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <span className="font-semibold text-lg">GreenLoop Yield</span>
              <Badge variant="testnet" className="ml-2">
                Demo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Proof-first climate finance platform powered by Hedera Hashgraph. 
              Transparent, verifiable, and immutable carbon credit tracking.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="network" className="text-xs">
                Hedera Testnet
              </Badge>
              <Badge variant="status-processing" className="text-xs">
                HCS • HTS • HFS
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#problem" className="text-muted-foreground hover:text-foreground transition-colors">
                  Problem
                </a>
              </li>
              <li>
                <a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">
                  Solution
                </a>
              </li>
              <li>
                <a href="#market" className="text-muted-foreground hover:text-foreground transition-colors">
                  Market
                </a>
              </li>
              <li>
                <a href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Hedera Links */}
          <div>
            <h4 className="font-semibold mb-4">Hedera</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://testnet.hashscan.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Hashscan Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://portal.hedera.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Hedera Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.hedera.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-1">
              <strong>⚠️ Hackathon Demo:</strong> This is a prototype built for Hedera Hackathon. 
              Not for production use.
            </p>
            <p>
              © 2024 GreenLoop Yield. Built with ❤️ for sustainable finance.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Github className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;