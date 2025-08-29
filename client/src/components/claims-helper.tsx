import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";

const steps = [
  "Select Lots & Year",
  "Buyer Details", 
  "Validate",
  "Generate Claim PDF",
  "Export Claim JSON",
  "Anchor to Ledger",
  "Mint Claim Badge",
  "Share & Verify"
];

interface ClaimData {
  selectedLots: string[];
  claimYear: number;
  buyerName: string;
  jurisdiction: string;
  csrLink: string;
  totalTons: number;
  pdfFileId?: string;
  jsonFileId?: string;
  anchorTopicId?: string;
  anchorSequence?: number;
  badgeTokenId?: string;
}

export default function ClaimsHelper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [claimData, setClaimData] = useState<ClaimData>({
    selectedLots: ["PBCL-MG-IDN-001", "PBCL-CC-KEN-002"],
    claimYear: 2025,
    buyerName: "",
    jurisdiction: "",
    csrLink: "",
    totalTons: 840,
  });
  const [isVerified, setIsVerified] = useState(false);

  const { toast } = useToast();

  const nextStep = async () => {
    if (currentStep < 8) {
      if (currentStep === 2) {
        // Step 3: Validate
        toast({
          title: "Validation Complete",
          description: "✅ Validated — lots settled & retired. Ready to generate claim.",
        });
      } else if (currentStep === 3) {
        // Step 4: Generate PDF
        try {
          const file = await hederaService.createFile(`Claim PDF for ${claimData.buyerName}`);
          setClaimData(prev => ({ ...prev, pdfFileId: file.fileId }));
          toast({
            title: "PDF Generated",
            description: `📄 Claim PDF stored on HFS • fileId ${file.fileId}`,
          });
        } catch (error) {
          toast({
            title: "PDF Generation Failed",
            description: "Failed to generate PDF. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else if (currentStep === 4) {
        // Step 5: Export JSON
        try {
          const file = await hederaService.createFile(`Claim JSON for ${claimData.buyerName}`);
          setClaimData(prev => ({ ...prev, jsonFileId: file.fileId }));
          toast({
            title: "JSON Exported", 
            description: `📄 Claim JSON exported • fileId ${file.fileId}`,
          });
        } catch (error) {
          toast({
            title: "JSON Export Failed",
            description: "Failed to export JSON. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else if (currentStep === 5) {
        // Step 6: Anchor to Ledger
        try {
          const topicId = "0.0.900456";
          const result = await hederaService.submitMessage(topicId, "CLAIM_ANCHORED");
          setClaimData(prev => ({ 
            ...prev, 
            anchorTopicId: topicId,
            anchorSequence: result.sequenceNumber 
          }));
          toast({
            title: "Anchored to HCS",
            description: `⛓️ Anchored to HCS • topic ${topicId} • seq #${result.sequenceNumber}`,
          });
        } catch (error) {
          toast({
            title: "Anchoring Failed",
            description: "Failed to anchor to ledger. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else if (currentStep === 6) {
        // Step 7: Mint Badge
        try {
          const nft = await hederaService.createNFT({
            name: "GLY Claim Badge",
            description: `Carbon credit claim badge for ${claimData.buyerName}`,
            totalTons: claimData.totalTons,
            year: claimData.claimYear,
          });
          setClaimData(prev => ({ ...prev, badgeTokenId: nft.tokenId }));
          toast({
            title: "NFT Badge Minted",
            description: `🏷️ NFT Claim Badge minted • ${nft.tokenId}`,
          });
        } catch (error) {
          toast({
            title: "Minting Failed",
            description: "Failed to mint NFT badge. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }
      
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const verifyClaim = async () => {
    toast({
      title: "Verifying Claim",
      description: "Performing verification checks...",
    });

    // Mock verification delay
    setTimeout(() => {
      setIsVerified(true);
      toast({
        title: "Verification Complete",
        description: "Verification complete • All checks passed ✅",
      });
    }, 2000);
  };

  const copyProofPack = () => {
    const proofPack = {
      claim_id: "GLY-CLM-2025-0001",
      buyer: claimData.buyerName || "EcoBrand Corp",
      year: claimData.claimYear,
      lots: [
        { lot_id: "PBCL-MG-IDN-001", tons: 240 },
        { lot_id: "PBCL-CC-KEN-002", tons: 600 },
      ],
      total_tons: claimData.totalTons,
      files: { 
        pdf: claimData.pdfFileId || "0.0.700567", 
        json: claimData.jsonFileId || "0.0.700568" 
      },
      anchors: { 
        topic_id: claimData.anchorTopicId || "0.0.900456", 
        seq: claimData.anchorSequence || 1287 
      },
      tx: { escrow: "0x111aaa", delivery: "0x222bbb", payout: "0x333ccc" },
      tokens: { 
        ft_ton: "0.0.600111", 
        badge_nft: claimData.badgeTokenId || "0.0.600222#1" 
      },
    };

    navigator.clipboard.writeText(JSON.stringify(proofPack, null, 2));
    toast({
      title: "Proof Pack Copied",
      description: "Proof Pack copied to clipboard",
    });
  };

  const downloadZip = () => {
    toast({
      title: "ZIP Download",
      description: "ZIP download started • Contains PDF + JSON + metadata",
    });
  };

  const startNewClaim = () => {
    setCurrentStep(1);
    setClaimData({
      selectedLots: ["PBCL-MG-IDN-001", "PBCL-CC-KEN-002"],
      claimYear: 2025,
      buyerName: "",
      jurisdiction: "",
      csrLink: "",
      totalTons: 840,
    });
    setIsVerified(false);
    toast({
      title: "New Claim Started",
      description: "New claim workflow started",
    });
  };

  const openHashscan = (id: string) => {
    const url = hederaService.getHashscanUrl(id);
    toast({
      title: "Opening Hashscan",
      description: `Opening Hashscan for ${id}`,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div data-testid="step-1">
            <h4 className="text-lg font-semibold text-foreground mb-4">Select Lots & Year</h4>
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3">
                <Checkbox checked readOnly />
                <span className="text-foreground">PBCL-MG-IDN-001 (240 t)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox checked readOnly />
                <span className="text-foreground">PBCL-CC-KEN-002 (600 t)</span>
              </div>
            </div>
            <div className="mb-4">
              <Label htmlFor="claim-year">Claim Year</Label>
              <Input
                id="claim-year"
                type="number"
                value={claimData.claimYear}
                onChange={(e) => setClaimData(prev => ({ ...prev, claimYear: parseInt(e.target.value) }))}
                data-testid="input-claim-year"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg mb-4">
              <span className="font-semibold text-foreground" data-testid="total-tons">Total Tons: {claimData.totalTons} t</span>
            </div>
          </div>
        );

      case 2:
        return (
          <div data-testid="step-2">
            <h4 className="text-lg font-semibold text-foreground mb-4">Buyer Details</h4>
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="buyer-name">Buyer Legal Name</Label>
                <Input
                  id="buyer-name"
                  placeholder="EcoBrand Corp"
                  value={claimData.buyerName}
                  onChange={(e) => setClaimData(prev => ({ ...prev, buyerName: e.target.value }))}
                  data-testid="input-buyer-name"
                />
              </div>
              <div>
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  placeholder="Delaware, USA"
                  value={claimData.jurisdiction}
                  onChange={(e) => setClaimData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  data-testid="input-jurisdiction"
                />
              </div>
              <div>
                <Label htmlFor="csr-link">CSR Link (optional)</Label>
                <Input
                  id="csr-link"
                  type="url"
                  placeholder="https://ecobrand.com/sustainability"
                  value={claimData.csrLink}
                  onChange={(e) => setClaimData(prev => ({ ...prev, csrLink: e.target.value }))}
                  data-testid="input-csr-link"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div data-testid="step-3">
            <h4 className="text-lg font-semibold text-foreground mb-4">Validate</h4>
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-foreground">Lots status: SETTLED</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-foreground">FT "ton" retired: {claimData.totalTons} t</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
              <span className="text-green-700 dark:text-green-300 font-medium">
                ✅ Validated — lots settled & retired. Ready to generate claim.
              </span>
            </div>
          </div>
        );

      case 4:
        return (
          <div data-testid="step-4">
            <h4 className="text-lg font-semibold text-foreground mb-4">Generate Claim PDF</h4>
            <div className="mb-4">
              <p className="text-muted-foreground mb-4">
                Generating comprehensive claim PDF with cover, summary, lot details, and transaction hashes...
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Claim PDF Generated</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground mb-2">
                  <strong>HFS fileId:</strong>{" "}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openHashscan(claimData.pdfFileId || "0.0.700567")}
                    className="p-0 h-auto text-primary"
                    data-testid="pdf-file-id"
                  >
                    {claimData.pdfFileId || "0.0.700567"} <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
                <Button size="sm" variant="secondary" data-testid="button-download-pdf">
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div data-testid="step-5">
            <h4 className="text-lg font-semibold text-foreground mb-4">Export Claim JSON</h4>
            <div className="mb-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Claim JSON Exported</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  <strong>HFS fileId:</strong>{" "}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openHashscan(claimData.jsonFileId || "0.0.700568")}
                    className="p-0 h-auto text-primary"
                    data-testid="json-file-id"
                  >
                    {claimData.jsonFileId || "0.0.700568"} <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div data-testid="step-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Anchor to Ledger (HCS)</h4>
            <div className="mb-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Anchored to HCS</span>
                </div>
                <div className="space-y-1 text-sm font-mono text-muted-foreground">
                  <div>
                    <strong>Topic ID:</strong>{" "}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => openHashscan(claimData.anchorTopicId || "0.0.900456")}
                      className="p-0 h-auto text-primary"
                      data-testid="anchor-topic-id"
                    >
                      {claimData.anchorTopicId || "0.0.900456"} <ExternalLink className="ml-1 w-3 h-3" />
                    </Button>
                  </div>
                  <div><strong>Message Seq:</strong> <span data-testid="anchor-sequence">#{claimData.anchorSequence || 1287}</span></div>
                  <div>
                    <strong>Anchor Tx:</strong>{" "}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => openHashscan("0x444ddd")}
                      className="p-0 h-auto text-primary"
                      data-testid="anchor-tx"
                    >
                      0x444ddd <ExternalLink className="ml-1 w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div data-testid="step-7">
            <h4 className="text-lg font-semibold text-foreground mb-4">Mint Claim Badge (Optional)</h4>
            <div className="mb-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">NFT Claim Badge Minted</span>
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  <strong>Token ID:</strong>{" "}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openHashscan(claimData.badgeTokenId || "0.0.600222#1")}
                    className="p-0 h-auto text-primary"
                    data-testid="badge-token-id"
                  >
                    {claimData.badgeTokenId || "0.0.600222#1"} <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div data-testid="step-8">
            <h4 className="text-lg font-semibold text-foreground mb-4">Share & Verify</h4>
            <div className="space-y-4 mb-4">
              <div>
                <Label htmlFor="proof-pack">Proof Pack (Copyable)</Label>
                <Textarea
                  id="proof-pack"
                  readOnly
                  className="h-32 font-mono text-xs"
                  value={JSON.stringify({
                    claim_id: "GLY-CLM-2025-0001",
                    buyer: claimData.buyerName || "EcoBrand Corp",
                    year: claimData.claimYear,
                    lots: [
                      { lot_id: "PBCL-MG-IDN-001", tons: 240 },
                      { lot_id: "PBCL-CC-KEN-002", tons: 600 },
                    ],
                    total_tons: claimData.totalTons,
                    files: { 
                      pdf: claimData.pdfFileId || "0.0.700567", 
                      json: claimData.jsonFileId || "0.0.700568" 
                    },
                    anchors: { 
                      topic_id: claimData.anchorTopicId || "0.0.900456", 
                      seq: claimData.anchorSequence || 1287 
                    },
                    tx: { escrow: "0x111aaa", delivery: "0x222bbb", payout: "0x333ccc" },
                    tokens: { 
                      ft_ton: "0.0.600111", 
                      badge_nft: claimData.badgeTokenId || "0.0.600222#1" 
                    },
                  }, null, 2)}
                  data-testid="proof-pack-textarea"
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="secondary"
                  onClick={copyProofPack}
                  data-testid="button-copy-proof-pack"
                >
                  Copy Proof Pack
                </Button>
                <Button 
                  variant="secondary"
                  onClick={downloadZip}
                  data-testid="button-download-zip"
                >
                  Download ZIP
                </Button>
              </div>
              <div>
                <Button 
                  onClick={verifyClaim}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  data-testid="button-verify-claim"
                >
                  Verify Claim
                </Button>
              </div>
              {isVerified && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg" data-testid="verification-result">
                  <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2">Verification Complete ✅</h5>
                  <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
                    <li>✅ Hash verification: PDF/JSON integrity confirmed</li>
                    <li>✅ HCS anchor: Topic message verified</li>
                    <li>✅ HFS files: Active and accessible</li>
                    <li>✅ NFT ownership: Confirmed in buyer wallet</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Claims Helper</h1>
        <p className="text-muted-foreground">8-step claim generation workflow with blockchain anchoring</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Step <span data-testid="current-step">{currentStep}</span> of 8
              </h3>
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                    data-testid={`step-indicator-${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <Progress value={(currentStep / 8) * 100} className="mb-6" data-testid="progress-bar" />
          </div>
          
          {renderStepContent()}
          
          <div className="flex space-x-3 mt-6">
            {currentStep > 1 && (
              <Button 
                variant="secondary"
                onClick={prevStep}
                data-testid="button-prev-step"
              >
                Back
              </Button>
            )}
            {currentStep < 8 ? (
              <Button 
                onClick={nextStep}
                className="bg-primary text-primary-foreground hover:opacity-90"
                data-testid="button-next-step"
              >
                {currentStep === 1 ? "Continue to Buyer Details" :
                 currentStep === 2 ? "Continue to Validate" :
                 currentStep === 3 ? "Generate Claim PDF" :
                 currentStep === 4 ? "Export JSON" :
                 currentStep === 5 ? "Anchor to Ledger" :
                 currentStep === 6 ? "Mint Claim Badge" :
                 "Share & Verify"}
              </Button>
            ) : (
              <Button 
                onClick={startNewClaim}
                className="bg-primary text-primary-foreground hover:opacity-90"
                data-testid="button-start-new-claim"
              >
                Start New Claim
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
