import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useToast } from "@/hooks/use-toast";
import { hederaService } from "@/lib/hedera-mock";
import { MOCK_IDS } from "@shared/schema.js";
import { ExternalLink, Upload, FileText, AlertCircle } from "lucide-react";
import { SUCCESS_MESSAGES, GUARDS, TOOLTIPS } from "@/constants/microcopy";
import { WalletGuard } from "@/components/guards/wallet-guard";
import { useProofStore } from "@/contexts/proof-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FormNewProject = ({ onProjectCreated }) => {
  const [form, setForm] = useState({
    projectName: "",
    location: "",
    type: "",
    area: 0,
    rate: 0,
    buffer: 0,
    forward: 0,
    pricePerTon: 10
  });

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const errors = [];
    if (!form.projectName.trim()) errors.push("Project name is required");
    if (!form.location.trim()) errors.push("Location is required");
    if (!form.type) errors.push("Project type is required");
    if (form.area < 1) errors.push("Area must be >= 1 hectare");
    if (form.rate <= 0 || form.rate > 15) errors.push("Rate must be > 0 and <= 15");
    if (form.buffer < 10 || form.buffer > 30) errors.push("Buffer must be 10-30%");
    if (form.forward < 0 || form.forward > 50) errors.push("Forward must be 0-50%");
    if (form.pricePerTon < 5 || form.pricePerTon > 30) errors.push("Price must be $5-30 per ton");
    if (Object.keys(uploadedFiles).length === 0) errors.push("At least 1 file upload is required");
    return errors;
  };

  const { addEvidence } = useProofStore();

  const isFormValid = validateForm().length === 0;

  const handleInputChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (fileType) => {
    try {
      const fileId = await hederaService.uploadFile(`${fileType}-data.pdf`);
      setUploadedFiles(prev => ({
        ...prev,
        [fileType]: fileId
      }));
      
      toast({
        title: SUCCESS_MESSAGES.ACTIONS.FILE_UPLOADED,
        description: `${fileType} file uploaded successfully`,
      });
      
      // Add evidence to proof store
      addEvidence({
        kind: 'file',
        id: fileId,
        metadata: {
          type: fileType,
          filename: `${fileType}-data.pdf`,
          action: 'upload'
        }
      });
    } catch (error) {
      console.error('File upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openHashscan = (type, id) => {
    let url;
    switch (type) {
      case 'file':
        url = `https://hashscan.io/mainnet/file/${id}`;
        break;
      case 'topic':
        url = `https://hashscan.io/mainnet/topic/${id}`;
        break;
      case 'token':
        url = `https://hashscan.io/mainnet/token/${id}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };

  const handleGenerateLot = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const expected = form.area * form.rate;
      const afterBuffer = expected * (1 - form.buffer / 100);
      const listed = afterBuffer * (form.forward / 100);
      const value = listed * form.pricePerTon;

      const lotData = {
        projectName: form.projectName,
        location: form.location,
        type: form.type,
        area: form.area,
        rate: form.rate,
        buffer: form.buffer,
        forward: form.forward,
        pricePerTon: form.pricePerTon,
        expectedTons: expected,
        listedTons: listed,
        value: value,
        uploadedFiles
      };

      const result = await hederaService.generateLot(lotData);

      // Add comprehensive evidence to proof store with transaction hashes
      addEvidence({
        kind: 'token',
        id: result.tokenId,
        metadata: {
          action: 'create',
          projectName: form.projectName,
          listedTons: listed,
          lotId: result.lotId,
          transactionHash: result.transactionHashes.tokenCreation,
          timestamp: result.timestamp
        }
      });
      
      addEvidence({
        kind: 'file',
        id: result.fileId,
        metadata: {
          action: 'upload',
          type: 'project_sheet',
          projectName: form.projectName,
          lotId: result.lotId,
          transactionHash: result.transactionHashes.fileMint,
          timestamp: result.timestamp
        }
      });
      
      addEvidence({
        kind: 'topic',
        id: result.topicId,
        metadata: {
          action: 'lot_listed',
          projectName: form.projectName,
          tokenId: result.tokenId,
          lotId: result.lotId,
          sequenceNumber: result.sequenceNumber,
          transactionHash: result.transactionHashes.topicSubmit,
          timestamp: result.timestamp
        }
      });
      
      addEvidence({
        kind: 'transaction',
        id: result.transactionHashes.tokenCreation,
        metadata: {
          action: 'token_mint',
          projectName: form.projectName,
          tokenId: result.tokenId,
          lotId: result.lotId,
          amount: Math.floor(listed),
          timestamp: result.timestamp
        }
      });

      toast({
        title: SUCCESS_MESSAGES.ACTIONS.LOT_GENERATED,
        description: `Lot ID: ${result.lotId} | Token: ${result.tokenId} | Listed: ${listed.toFixed(1)} tCO2e`,
      });

      if (onProjectCreated) {
        onProjectCreated(result);
      }

      // Reset form
      setForm({
        projectName: "",
        location: "",
        type: "",
        area: 0,
        rate: 0,
        buffer: 0,
        forward: 0,
        pricePerTon: 10
      });
      setUploadedFiles({});

    } catch (error) {
      toast({
        title: "❌ Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Project Input</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          {/* Project Name */}
          <div>
            <Label htmlFor="projectName" className="text-xs font-medium text-muted-foreground">
              Project Name *
            </Label>
            <Input
              id="projectName"
              value={form.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="Enter project name"
              className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-xs font-medium text-muted-foreground">
              Location *
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location"
              className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40"
            />
          </div>

          {/* Project Type */}
          <div>
            <Label htmlFor="type" className="text-xs font-medium text-muted-foreground">
              Project Type *
            </Label>
            <Select value={form.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className="h-9 text-sm rounded-xl border-white/10 bg-white/5">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mangrove">🌿 Mangrove Restoration</SelectItem>
                <SelectItem value="forest">🌲 Forest Conservation</SelectItem>
                <SelectItem value="agroforestry">🌾 Agroforestry</SelectItem>
                <SelectItem value="wetland">🦆 Wetland Restoration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Numeric Fields in Paired Rows */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="area" className="text-xs font-medium text-muted-foreground">
                Area (ha) *
              </Label>
              <Input
                id="area"
                type="number"
                value={form.area}
                onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 tabular-nums"
              />
              <div className="text-xs text-muted-foreground mt-1">Project area in hectares</div>
            </div>
            <div>
              <Label htmlFor="rate" className="text-xs font-medium text-muted-foreground">
                Rate (tCO2e/ha/yr) *
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.1"
                value={form.rate}
                onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 tabular-nums"
              />
              <div className="text-xs text-muted-foreground mt-1">Carbon sequestration rate</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="buffer" className="text-xs font-medium text-muted-foreground">
                  Buffer (%) *
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{TOOLTIPS.BUFFER_PERCENTAGE}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="buffer"
                type="number"
                value={form.buffer}
                onChange={(e) => handleInputChange('buffer', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={`h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 tabular-nums ${form.buffer < 10 || form.buffer > 30 ? "border-red-500" : ""}`}
              />
              <div className="text-xs text-muted-foreground mt-1">Risk buffer percentage</div>
              {(form.buffer < 10 || form.buffer > 30) && form.buffer > 0 && (
                <p className="text-sm text-red-500 mt-1">{GUARDS.BUFFER_VALIDATION.description}</p>
              )}
            </div>
            <div>
              <Label htmlFor="forward" className="text-xs font-medium text-muted-foreground">
                Forward (%) *
              </Label>
              <Input
                id="forward"
                type="number"
                value={form.forward}
                onChange={(e) => handleInputChange('forward', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 tabular-nums"
              />
              <div className="text-xs text-muted-foreground mt-1">Forward sale percentage</div>
            </div>
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="pricePerTon" className="text-xs font-medium text-muted-foreground">
              Price per tCO2e ($) *
            </Label>
            <Input
              id="pricePerTon"
              type="number"
              value={form.pricePerTon}
              onChange={(e) => handleInputChange('pricePerTon', parseFloat(e.target.value) || 0)}
              placeholder="10"
              className="h-9 text-sm rounded-xl border-white/10 bg-white/5 focus:ring-emerald-400/40 tabular-nums"
            />
            <div className="text-xs text-muted-foreground mt-1">Price per ton of CO2 equivalent</div>
          </div>

          {/* File Uploads */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Required Documents</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Survey', 'Baseline', 'Monitoring', 'Verification'].map((fileType) => (
                <Button
                  key={fileType}
                  type="button"
                  variant="outline"
                  onClick={() => handleFileUpload(fileType)}
                  className={`h-9 text-xs rounded-xl border-white/10 ${
                    uploadedFiles[fileType] 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Upload className="w-3 h-3 mr-2" />
                  {uploadedFiles[fileType] ? '✓ ' : ''}{fileType}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <WalletGuard action="generate lot" showCard={false}>
            <Button
              type="button"
              onClick={handleGenerateLot}
              disabled={!isFormValid || isSubmitting}
              className="w-full h-10 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating...' : 'Generate Carbon Credit Lot'}
            </Button>
          </WalletGuard>

          {/* Validation Errors */}
          {!isFormValid && (
            <div className="text-xs text-red-400 space-y-1">
              {validateForm().map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default FormNewProject;