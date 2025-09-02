import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Upload, FileText, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";
import { MOCK_IDS } from "@shared/schema.js";

const ClaimsWizard = ({ lots = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    selectedLot: '',
    proofType: '',
    proofFiles: [],
    description: '',
    coordinates: { lat: '', lng: '' },
    captureDate: '',
    // Step 3-8 data
    validationStatus: 'pending',
    pdfFileId: '',
    jsonFileId: '',
    anchorTopicId: '',
    anchorSequenceNumber: '',
    anchorTxHash: '',
    nftTokenId: '',
    nftSerialNumber: '',
    enableNFT: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  const steps = [
    { id: 1, title: 'Select Lot', description: 'Choose carbon credit lot' },
    { id: 2, title: 'Upload Proof', description: 'Attach verification documents' },
    { id: 3, title: 'Validation', description: 'System validation & VALIDATED badge', badge: 'VALIDATED' },
    { id: 4, title: 'PDF Report', description: 'Generate verification PDF' },
    { id: 5, title: 'JSON Metadata', description: 'Create structured metadata' },
    { id: 6, title: 'HCS Anchor', description: 'Immutable blockchain anchoring' },
    { id: 7, title: 'NFT Badge', description: 'Mint verification NFT (optional)' },
    { id: 8, title: 'Proof Pack', description: 'Download complete package' }
  ];

  const proofTypes = [
    { value: 'photo', label: 'Field Photography', icon: '📸' },
    { value: 'NDVI', label: 'NDVI Satellite Data', icon: '🛰️' },
    { value: 'QC', label: 'Quality Control Report', icon: '✅' },
    { value: 'document', label: 'Supporting Document', icon: '📄' }
  ];

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.selectedLot) errors.selectedLot = 'Please select a lot';
    }
    
    if (step === 2) {
      if (!formData.proofType) errors.proofType = 'Please select proof type';
      if (formData.proofFiles.length === 0) errors.proofFiles = 'Please upload at least one file';
      if (!formData.description.trim()) errors.description = 'Please provide a description';
      if (formData.proofType === 'NDVI' || formData.proofType === 'photo') {
        if (!formData.coordinates.lat) errors.lat = 'Latitude required';
        if (!formData.coordinates.lng) errors.lng = 'Longitude required';
      }
      if (!formData.captureDate) errors.captureDate = 'Capture date required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performValidation = async () => {
    setIsSubmitting(true);
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setFormData(prev => ({ ...prev, validationStatus: 'validated' }));
      toast({
        title: "Validation Complete",
        description: "Your proof has been validated and marked with VALIDATED badge.",
      });
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Unable to validate proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    setIsSubmitting(true);
    try {
      const pdfResult = await hederaService.createFile('verification-report.pdf');
      setFormData(prev => ({ ...prev, pdfFileId: pdfResult.fileId }));
      toast({
        title: "PDF Generated",
        description: (
          <div className="flex items-center gap-2">
            <span>Verification report created:</span>
            <a 
              href={`https://hashscan.io/testnet/file/${pdfResult.fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {pdfResult.fileId}
            </a>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateJSON = async () => {
    setIsSubmitting(true);
    try {
      const jsonResult = await hederaService.createFile('metadata.json');
      setFormData(prev => ({ ...prev, jsonFileId: jsonResult.fileId }));
      toast({
        title: "JSON Metadata Created",
        description: (
          <div className="flex items-center gap-2">
            <span>Structured metadata file:</span>
            <a 
              href={`https://hashscan.io/testnet/file/${jsonResult.fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {jsonResult.fileId}
            </a>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "JSON Generation Failed",
        description: "Unable to generate metadata file.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const performAnchor = async () => {
    setIsSubmitting(true);
    try {
      const anchorData = {
        lotId: formData.selectedLot,
        proofType: formData.proofType,
        validationStatus: formData.validationStatus,
        pdfFileId: formData.pdfFileId,
        jsonFileId: formData.jsonFileId,
        timestamp: new Date().toISOString()
      };
      
      const topicResult = await hederaService.submitMessage(
        MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
        JSON.stringify(anchorData)
      );
      
      setFormData(prev => ({ 
        ...prev, 
        anchorTopicId: MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS,
        anchorSequenceNumber: topicResult.sequenceNumber,
        anchorTxHash: topicResult.transactionHash
      }));
      
      toast({
        title: "Blockchain Anchor Complete",
        description: (
          <div className="space-y-1">
            <p>Proof anchored immutably on Hedera.</p>
            <div className="flex items-center gap-2 text-sm">
              <span>Topic:</span>
              <a 
                href={`https://hashscan.io/testnet/topic/${MOCK_IDS.HCS_TOPICS.PROJECT_PROOFS}/message/${topicResult.sequenceNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                #{topicResult.sequenceNumber}
              </a>
            </div>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "Anchor Failed",
        description: "Unable to anchor proof on blockchain.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mintNFT = async () => {
    setIsSubmitting(true);
    try {
      // Use the mock service to create NFT
      const nftResult = await hederaService.createFile('nft-metadata.json');
      const serialNumber = Math.floor(Math.random() * 1000) + 1;
      
      setFormData(prev => ({ 
        ...prev, 
        nftTokenId: MOCK_IDS.HTS_TOKENS.NFT_BADGE,
        nftSerialNumber: serialNumber
      }));
      
      toast({
        title: "NFT Badge Minted",
        description: (
          <div className="flex items-center gap-2">
            <span>Verification badge:</span>
            <a 
              href={`https://hashscan.io/testnet/token/${MOCK_IDS.HTS_TOKENS.NFT_BADGE}/nft/${serialNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              NFT #{serialNumber}
            </a>
          </div>
        ),
      });
    } catch (error) {
      toast({
        title: "NFT Minting Failed",
        description: "Unable to mint verification badge.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadProofPack = async () => {
    setIsSubmitting(true);
    try {
      // Create proof pack manifest
      const proofPackData = {
        lotId: formData.selectedLot,
        proofType: formData.proofType,
        validationStatus: formData.validationStatus,
        artifacts: {
          pdfFileId: formData.pdfFileId,
          jsonFileId: formData.jsonFileId,
          anchorTopicId: formData.anchorTopicId,
          anchorSequenceNumber: formData.anchorSequenceNumber,
          anchorTxHash: formData.anchorTxHash,
          nftTokenId: formData.nftTokenId,
          nftSerialNumber: formData.nftSerialNumber
        },
        links: {
          pdfReport: `https://hashscan.io/testnet/file/${formData.pdfFileId}`,
          jsonMetadata: `https://hashscan.io/testnet/file/${formData.jsonFileId}`,
          blockchainAnchor: `https://hashscan.io/testnet/topic/${formData.anchorTopicId}/message/${formData.anchorSequenceNumber}`,
          nftBadge: formData.nftSerialNumber ? `https://hashscan.io/testnet/token/${formData.nftTokenId}/nft/${formData.nftSerialNumber}` : null
        },
        generatedAt: new Date().toISOString()
      };
      
      // Create proof pack file on HFS
      const proofPackResult = await hederaService.createFile('proof-pack-manifest.json');
      
      toast({
        title: "Proof Pack Ready",
        description: (
          <div className="space-y-2">
            <p>Complete verification package prepared.</p>
            <div className="flex items-center gap-2 text-sm">
              <span>Manifest:</span>
              <a 
                href={`https://hashscan.io/testnet/file/${proofPackResult.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {proofPackResult.fileId}
              </a>
            </div>
          </div>
        ),
      });
      
      // Simulate download by creating a downloadable JSON file
      const dataStr = JSON.stringify(proofPackData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proof-pack-${formData.selectedLot}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to prepare proof pack for download.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // Handle automatic progression for steps 3-8
      if (currentStep === 2) {
        // Step 3: Validation
        setCurrentStep(3);
        await performValidation();
      } else if (currentStep === 3) {
        // Step 4: PDF Generation
        setCurrentStep(4);
        await generatePDF();
      } else if (currentStep === 4) {
        // Step 5: JSON Metadata
        setCurrentStep(5);
        await generateJSON();
      } else if (currentStep === 5) {
        // Step 6: HCS Anchor
        setCurrentStep(6);
        await performAnchor();
      } else if (currentStep === 6) {
        // Step 7: NFT Badge (optional)
        setCurrentStep(7);
        if (formData.enableNFT) {
          await mintNFT();
        }
      } else if (currentStep === 7) {
        // Step 8: Proof Pack
        setCurrentStep(8);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, 8));
      }
    }
  };

  const handlePrevious = () => {
    // Only allow going back to steps 1-2, others are automated
    if (currentStep <= 2) {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    } else {
      setCurrentStep(2);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      proofFiles: [...prev.proofFiles, ...files]
    }));
    setValidationErrors(prev => ({ ...prev, proofFiles: null }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      // Mock file upload to HFS
      const fileUploadPromises = formData.proofFiles.map(async (file) => {
        return await hederaService.uploadFile(file, {
          type: 'proof_document',
          lotId: formData.selectedLot,
          proofType: formData.proofType
        });
      });
      
      const uploadedFiles = await Promise.all(fileUploadPromises);
      
      // Mock HCS topic submission
      const proofData = {
        lotId: formData.selectedLot,
        proofType: formData.proofType,
        description: formData.description,
        coordinates: formData.coordinates,
        captureDate: formData.captureDate,
        files: uploadedFiles,
        timestamp: new Date().toISOString(),
        submitter: '0.0.123456'
      };
      
      const topicSubmission = await hederaService.submitToTopic(
        MOCK_IDS.TOPIC_IDS.PROOF_FEED,
        proofData
      );
      
      // Mock NFT badge minting
      const nftMint = await hederaService.mintNFT({
        tokenId: MOCK_IDS.TOKEN_IDS.VERIFICATION_BADGES,
        metadata: {
          lotId: formData.selectedLot,
          proofType: formData.proofType,
          verificationLevel: 'verified',
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Claim Submitted Successfully",
        description: (
          <div className="space-y-2">
            <p>Your verification claim has been anchored on Hedera.</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span>Topic Message:</span>
                <a 
                  href={`https://hashscan.io/testnet/topic/${MOCK_IDS.TOPIC_IDS.PROOF_FEED}/message/${topicSubmission.sequenceNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  #{topicSubmission.sequenceNumber}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span>Verification Badge:</span>
                <a 
                  href={`https://hashscan.io/testnet/token/${MOCK_IDS.TOKEN_IDS.VERIFICATION_BADGES}/nft/${nftMint.serialNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  NFT #{nftMint.serialNumber}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ),
      });
      
      // Reset form
      setFormData({
        selectedLot: '',
        proofType: '',
        proofFiles: [],
        description: '',
        coordinates: { lat: '', lng: '' },
        captureDate: ''
      });
      setCurrentStep(1);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Unable to submit claim. Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLotData = lots.find(lot => lot.id === formData.selectedLot);

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors $ {
              step.id < currentStep ? 'bg-green-50 border-green-200' :
              step.id === currentStep ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className="text-xs font-medium mb-1">Step {step.id}</div>
            <div className="text-sm font-semibold">{step.title}</div>
            <div className="text-xs text-muted-foreground">{step.description}</div>
            {step.badge && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {step.badge}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          {currentStep === 1 && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="lot-select" className="text-sm font-medium">Select Carbon Credit Lot</Label>
                <Select 
                  value={formData.selectedLot}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selectedLot: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.projectName} - {lot.location} ({lot.totalTons} tons)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.selectedLot && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.selectedLot}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="proof-type" className="text-sm font-medium">Proof Type</Label>
                <Select 
                  value={formData.proofType} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, proofType: value }));
                    setValidationErrors(prev => ({ ...prev, proofType: null }));
                  }}
                >
                  <SelectTrigger className={`mt-1 h-9 bg-white/5 border-white/10 ${validationErrors.proofType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select type of proof" />
                  </SelectTrigger>
                  <SelectContent>
                    {proofTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.proofType && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.proofType}</p>
                )}
              </div>

              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium">Upload Files</Label>
                <div className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center ${validationErrors.proofFiles ? 'border-red-500' : 'border-white/20'} hover:border-white/40 transition-colors`}>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF, DOC up to 10MB each</p>
                  </label>
                </div>
                {validationErrors.proofFiles && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.proofFiles}</p>
                )}
                
                {formData.proofFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.proofFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 px-2 text-xs rounded-lg hover:bg-red-500/20 text-red-400"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, description: null }));
                  }}
                  placeholder="Describe the proof and verification details..."
                  className={`mt-1 bg-white/5 border-white/10 resize-none ${validationErrors.description ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {validationErrors.description && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
                )}
              </div>

              {(formData.proofType === 'NDVI' || formData.proofType === 'photo') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="latitude" className="text-sm font-medium">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.coordinates.lat}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          coordinates: { ...prev.coordinates, lat: e.target.value }
                        }));
                        setValidationErrors(prev => ({ ...prev, lat: null }));
                      }}
                      placeholder="-6.2088"
                      className={`mt-1 h-9 bg-white/5 border-white/10 ${validationErrors.lat ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.lat && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.lat}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="longitude" className="text-sm font-medium">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.coordinates.lng}
                      onChange={(e) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          coordinates: { ...prev.coordinates, lng: e.target.value }
                        }));
                        setValidationErrors(prev => ({ ...prev, lng: null }));
                      }}
                      placeholder="106.8456"
                      className={`mt-1 h-9 bg-white/5 border-white/10 ${validationErrors.lng ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.lng && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.lng}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="capture-date" className="text-sm font-medium">Capture Date</Label>
                <Input
                  id="capture-date"
                  type="date"
                  value={formData.captureDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, captureDate: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, captureDate: null }));
                  }}
                  className={`mt-1 h-9 bg-white/5 border-white/10 ${validationErrors.captureDate ? 'border-red-500' : ''}`}
                />
                {validationErrors.captureDate && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.captureDate}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-4">
                  {formData.validationStatus === 'validated' ? (
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  ) : (
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {formData.validationStatus === 'validated' ? 'Validation Complete' : 'Validating Proof...'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {formData.validationStatus === 'validated' 
                    ? 'Your proof has been successfully validated and marked with VALIDATED badge.'
                    : 'System is validating your uploaded proof documents and metadata...'}
                </p>
                {formData.validationStatus === 'validated' && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    ✓ VALIDATED
                  </Badge>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">PDF Verification Report</h3>
                {formData.pdfFileId ? (
                  <div className="flex items-center justify-between bg-emerald-50/10 border border-emerald-200/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium">verification-report.pdf</span>
                    </div>
                    <a 
                      href={`https://hashscan.io/testnet/file/${formData.pdfFileId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      View on HashScan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Generating PDF report...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">JSON Metadata File</h3>
                {formData.jsonFileId ? (
                  <div className="flex items-center justify-between bg-emerald-50/10 border border-emerald-200/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium">metadata.json</span>
                    </div>
                    <a 
                      href={`https://hashscan.io/testnet/file/${formData.jsonFileId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      View on HashScan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Creating structured metadata...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">Blockchain Anchoring</h3>
                {formData.anchorTxHash ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-emerald-50/10 border border-emerald-200/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium">Immutable Anchor Complete</span>
                      </div>
                      <a 
                        href={`https://hashscan.io/testnet/topic/${formData.anchorTopicId}/message/${formData.anchorSequenceNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        Topic #{formData.anchorSequenceNumber}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Transaction Hash: {formData.anchorTxHash}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Anchoring proof on Hedera Consensus Service...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">NFT Verification Badge</h3>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableNFT}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableNFT: e.target.checked }))}
                      className="rounded border-white/20 bg-white/5"
                    />
                    <span className="text-sm">Mint NFT verification badge (optional)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Creates a permanent, transferable verification credential as an NFT.
                  </p>
                </div>

                {formData.enableNFT && formData.nftSerialNumber ? (
                  <div className="flex items-center justify-between bg-emerald-50/10 border border-emerald-200/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">NFT</Badge>
                      <span className="text-sm font-medium">Verification Badge #{formData.nftSerialNumber}</span>
                    </div>
                    <a 
                      href={`https://hashscan.io/testnet/token/${formData.nftTokenId}/nft/${formData.nftSerialNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      View NFT
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : formData.enableNFT ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Minting NFT verification badge...</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">NFT minting skipped</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">Proof Pack Download</h3>
                
                <div className="space-y-3">
                  <div className="bg-emerald-50/10 border border-emerald-200/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">Complete Verification Package</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>✓ Original proof files</span>
                        <span className="text-muted-foreground">{formData.proofFiles.length} files</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ PDF verification report</span>
                        <a href={`https://hashscan.io/testnet/file/${formData.pdfFileId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {formData.pdfFileId}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ JSON metadata</span>
                        <a href={`https://hashscan.io/testnet/file/${formData.jsonFileId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {formData.jsonFileId}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>✓ Blockchain anchor</span>
                        <a href={`https://hashscan.io/testnet/topic/${formData.anchorTopicId}/message/${formData.anchorSequenceNumber}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          #{formData.anchorSequenceNumber}
                        </a>
                      </div>
                      {formData.nftSerialNumber && (
                        <div className="flex items-center justify-between">
                          <span>✓ NFT verification badge</span>
                          <a href={`https://hashscan.io/testnet/token/${formData.nftTokenId}/nft/${formData.nftSerialNumber}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            NFT #{formData.nftSerialNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={downloadProofPack}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Preparing Download...</span>
                      </div>
                    ) : (
                      'Download Complete Proof Pack'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(currentStep === 1 || currentStep === 2) && currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold mb-3">Review Your Submission</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground">Selected Lot:</span>
                      <span className="ml-1 font-medium">{selectedLotData?.title}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Proof Type:</span>
                      <span className="ml-1 font-medium">{proofTypes.find(t => t.value === formData.proofType)?.label}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Files:</span>
                      <span className="ml-1 font-medium">{formData.proofFiles.length} file(s)</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capture Date:</span>
                      <span className="ml-1 font-medium">{formData.captureDate}</span>
                    </div>
                  </div>
                  
                  {(formData.coordinates.lat && formData.coordinates.lng) && (
                    <div>
                      <span className="text-muted-foreground">Coordinates:</span>
                      <span className="ml-1 font-medium">{formData.coordinates.lat}, {formData.coordinates.lng}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1 text-sm">{formData.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50/10 border border-blue-200/20 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-blue-400 mb-1">Blockchain Integration</p>
                    <p className="text-muted-foreground">
                      Your proof will be anchored on Hedera Consensus Service for immutable verification, 
                      and an NFT badge will be minted as permanent verification credential.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50"
        >
          {currentStep > 2 ? 'Back to Upload' : 'Previous'}
        </Button>
        
        <div className="flex space-x-2">
          {currentStep <= 2 ? (
            <Button
              onClick={handleNext}
              className="h-9 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
            >
              {currentStep === 2 ? 'Start Validation' : 'Next'}
            </Button>
          ) : currentStep < 8 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting || (currentStep === 3 && formData.validationStatus !== 'validated') || (currentStep === 4 && !formData.pdfFileId) || (currentStep === 5 && !formData.jsonFileId) || (currentStep === 6 && !formData.anchorTxHash)}
              className="h-9 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Continue'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Reset form
                setFormData({
                  selectedLot: '',
                  proofType: '',
                  proofFiles: [],
                  description: '',
                  coordinates: { lat: '', lng: '' },
                  captureDate: '',
                  validationStatus: 'pending',
                  pdfFileId: '',
                  jsonFileId: '',
                  anchorTopicId: '',
                  anchorSequenceNumber: '',
                  anchorTxHash: '',
                  nftTokenId: '',
                  nftSerialNumber: '',
                  enableNFT: false
                });
                setCurrentStep(1);
                toast({
                  title: "New Claim Started",
                  description: "Ready to submit another verification claim.",
                });
              }}
              className="h-9 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Start New Claim
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimsWizard;