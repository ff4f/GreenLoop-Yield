import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";
import { MOCK_IDS } from "@shared/schema.js";
import { SUCCESS_MESSAGES, GUARDS } from "@/constants/microcopy";
import { useProofStore } from "@/contexts/proof-store";
import { useWallet } from "@/hooks/use-wallet";
import { Upload, Plus } from "lucide-react";
import { SEED_PROOFS } from '@shared/seed-data.js';
import ProofTimeline from "./proof-timeline";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";


export default function ProofFeed() {
  const [isAddProofOpen, setIsAddProofOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [proofForm, setProofForm] = useState({
    lotId: '',
    proofType: '',
    title: '',
    description: '',
    file: null,
    url: ''
  });
  const { toast } = useToast();
  const { addEvidence } = useProofStore();
  const { isConnected, connect } = useWallet();
  const [showBanner, setShowBanner] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  const validateStep = (step) => {
    const errors = {};
    if (step === 1 && !proofForm.lotId) errors.lotId = "Lot ID is required";
    if (step === 2 && !proofForm.proofType) errors.proofType = "Proof type is required";
    if (step === 3 && !proofForm.file && !proofForm.url) errors.attachment = "File or URL is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAddProof = async () => {
    // Prevent multiple submissions
    if (isUploading) return;
    
    if (validateStep(4)) {
      if (!proofForm.lotId || !proofForm.proofType || !proofForm.title || !proofForm.file) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields and select a file.",
          variant: "destructive"
        });
        return;
      }

      setIsUploading(true);
      try {
        // Step 1: Create file on HFS with timeout
        const fileResult = await Promise.race([
          hederaService.createFile(proofForm.file.name),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File creation timeout')), 10000)
          )
        ]);
        
        // Step 2: Submit topic message (PROOF_UPLOADED)
        const topicMessage = {
          action: 'PROOF_UPLOADED',
          lotId: proofForm.lotId,
          proofType: proofForm.proofType,
          title: proofForm.title,
          description: proofForm.description,
          fileId: fileResult.fileId,
          timestamp: new Date().toISOString()
        };
        
        const topicResult = await Promise.race([
          hederaService.submitMessage(
            MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
            JSON.stringify(topicMessage)
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Topic submission timeout')), 10000)
          )
        ]);
        
        // Step 3: Add evidence to proof store
        addEvidence({
          kind: "file",
          id: fileResult.fileId,
          label: `Proof File: ${proofForm.title}`,
          meta: {
            lotId: proofForm.lotId,
            proofType: proofForm.proofType,
            title: proofForm.title,
            description: proofForm.description,
            timestamp: new Date().toISOString()
          },
          source: 'Proof Upload'
        });
        
        addEvidence({
          kind: "topic",
          id: topicResult.sequenceNumber,
          label: `Topic Message: PROOF_UPLOADED`,
          meta: {
            lotId: proofForm.lotId,
            topicId: MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
            sequenceNumber: topicResult.sequenceNumber,
            action: 'PROOF_UPLOADED',
            timestamp: new Date().toISOString()
          },
          source: 'Proof Upload'
        });
        
        toast({
          title: SUCCESS_MESSAGES.ACTIONS.PROOF_UPLOADED || "Proof uploaded successfully!",
          description: (
            <div className="space-y-1">
              <p>Evidence added to timeline.</p>
              <div className="flex items-center gap-2 text-sm">
                <span>File ID:</span>
                <a 
                  href={`https://hashscan.io/testnet/file/${fileResult.fileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {fileResult.fileId}
                </a>
              </div>
            </div>
          ),
        });
        
        // Reset form and close dialog
        setProofForm({
          lotId: '',
          proofType: '',
          title: '',
          description: '',
          file: null,
          url: ''
        });
        setCurrentStep(1);
        setFormErrors({});
        setIsAddProofOpen(false);
        
      } catch (error) {
        console.error('Proof upload failed:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload proof. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofForm(prev => ({ ...prev, file }));
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Proof Feed</h1>
          <p className="text-muted-foreground text-sm">Complete audit trail with photo geotags, satellite NDVI data, and quality control verification</p>
        </div>
        
        <Sheet open={isAddProofOpen} onOpenChange={setIsAddProofOpen} aria-labelledby="add-proof-title">
          <SheetTrigger asChild>
            <Button 
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm"
              disabled={!isConnected}
              aria-label="Add new proof"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Proof
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="max-w-[520px] bg-background border-white/10" role="dialog" aria-describedby="add-proof-description">
            <SheetHeader>
              <SheetTitle id="add-proof-title" className="text-lg font-semibold">Add New Proof</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-4">
              <Progress value={(currentStep / 4) * 100} className="w-full" aria-label={`Progress: step ${currentStep} of 4`} />
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-destructive/15 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm" role="alert">
                  Please fix the errors before proceeding.
                </div>
              )}
              {currentStep === 1 && (
                <div>
                  <Label htmlFor="lotId">Lot ID / Topic *</Label>
                  <Input id="lotId" value={proofForm.lotId} onChange={(e) => setProofForm(prev => ({ ...prev, lotId: e.target.value }))} aria-required="true" />
                  {formErrors.lotId && <p className="text-destructive text-sm" role="alert">{formErrors.lotId}</p>}
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <Label htmlFor="proofType">Proof Type *</Label>
                  <Select value={proofForm.proofType} onValueChange={(value) => setProofForm(prev => ({ ...prev, proofType: value }))}
                    aria-required="true" aria-label="Select proof type">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select proof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Photo Geotag</SelectItem>
                      <SelectItem value="NDVI">NDVI Satellite</SelectItem>
                      <SelectItem value="QC">Quality Control</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.proofType && <p className="text-destructive text-sm" role="alert">{formErrors.proofType}</p>}
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Upload File</Label>
                    <Input id="file" type="file" onChange={handleFileChange} aria-label="Upload file" />
                  </div>
                  <div>
                    <Label htmlFor="url">Or Paste URL/Memo</Label>
                    <Input id="url" value={proofForm.url} onChange={(e) => setProofForm(prev => ({ ...prev, url: e.target.value }))} aria-label="Paste URL or memo" />
                  </div>
                  {formErrors.attachment && <p className="text-destructive text-sm" role="alert">{formErrors.attachment}</p>}
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={proofForm.title} onChange={(e) => setProofForm(prev => ({ ...prev, title: e.target.value }))} aria-required="true" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={proofForm.description} onChange={(e) => setProofForm(prev => ({ ...prev, description: e.target.value }))} aria-label="Proof description" />
                  </div>
                  {/* Display review summary */}
                </div>
              )}
            </div>
            <SheetFooter className="flex justify-between p-4 border-t border-white/10">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious} disabled={isUploading} aria-label="Go to previous step">
                  Previous
                </Button>
              )}
              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={isUploading} aria-label="Go to next step">
                  Next
                </Button>
              ) : (
                <Button onClick={handleAddProof} disabled={isUploading || !isConnected} aria-label="Publish proof">
                  {isUploading ? "Publishing..." : "Publish"}
                </Button>
              )}
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        {!isConnected && showBanner && (
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between" role="alert">
            <p className="text-sm text-muted-foreground">Connect your Hedera wallet to publish proofs.</p>
            <div className="flex items-center gap-2">
              <Button 
                onClick={connect}
                size="sm"
                className="h-8"
                aria-label="Connect wallet"
              >
                Connect Wallet
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setShowBanner(false)}
                aria-label="Dismiss banner"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>

      {SEED_PROOFS.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No Proofs Submitted Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Start building your audit trail by submitting photo geotags, satellite NDVI data, and quality control documentation for your carbon credit projects.
            </p>
            {isConnected ? (
              <Button 
                size="sm"
                onClick={() => setIsAddProofOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Submit First Proof
              </Button>
            ) : (
              <div className="space-y-4">
                <Button 
                  size="sm"
                  onClick={connect}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm"
                >
                  Connect Wallet to Submit Proofs
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>💡 Connect your Hedera wallet to start submitting verification proofs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ProofTimeline proofs={SEED_PROOFS} />
      )}
    </>
  );
}
