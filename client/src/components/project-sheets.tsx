import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { hederaService, mockProjectSheets } from "@/lib/hedera-mock";

interface ProjectForm {
  projectName: string;
  location: string;
  area: number;
  rate: number;
  buffer: number;
  forward: number;
}

interface Calculations {
  expected: number;
  afterBuffer: number;
  listed: number;
  value: number;
}

export default function ProjectSheets() {
  const [form, setForm] = useState<ProjectForm>({
    projectName: "",
    location: "",
    area: 0,
    rate: 0,
    buffer: 0,
    forward: 0,
  });

  const [calculations, setCalculations] = useState<Calculations>({
    expected: 0,
    afterBuffer: 0,
    listed: 0,
    value: 0,
  });

  const [generatedLot, setGeneratedLot] = useState<{
    lotId: string;
    tokenId: string;
    fileId: string;
    proofLogs: Array<{topicId: string; sequenceNumber: number}>;
  } | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});

  const { toast } = useToast();

  const calculateTons = () => {
    const expected = form.area * form.rate;
    const afterBuffer = expected * (1 - form.buffer / 100);
    const listed = afterBuffer * (form.forward / 100);
    const value = listed * 10; // $10/t default

    setCalculations({
      expected,
      afterBuffer,
      listed,
      value,
    });
  };

  useEffect(() => {
    calculateTons();
  }, [form]);

  const handleInputChange = (field: keyof ProjectForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (fileType: string) => {
    // Simulate file upload
    const mockFile = await hederaService.createFile(`${fileType}-data-${Date.now()}`);
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: mockFile.fileId
    }));
    
    toast({
      title: "File Uploaded",
      description: `${fileType} uploaded to HFS: ${mockFile.fileId}`,
    });
  };

  const handleGenerateLot = async () => {
    if (!form.projectName || !form.location || form.area <= 0) {
      toast({
        title: "Validation Error", 
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate lot ID
      const lotId = `PBCL-${form.projectName.substring(0, 2).toUpperCase()}-${form.location.substring(0, 3).toUpperCase()}-${String(Date.now()).slice(-3)}`;
      
      // Create HTS token (fungible)
      const token = await hederaService.createToken(`GLY-${lotId}`, Math.floor(calculations.listed));
      
      // Create HFS file for project data
      const fileContent = JSON.stringify({
        projectName: form.projectName,
        location: form.location,
        area: form.area,
        calculations,
        uploadedFiles,
        timestamp: new Date().toISOString()
      });
      const file = await hederaService.createFile(fileContent);

      // Create HCS topic and submit initial proof logs
      const topicId = await hederaService.createTopic();
      const proofLogs = [];
      
      // Log project creation
      const createLog = await hederaService.submitMessage(topicId, JSON.stringify({
        action: "project_created",
        lotId,
        tokenId: token.tokenId,
        fileId: file.fileId,
        timestamp: new Date().toISOString()
      }));
      proofLogs.push({topicId, sequenceNumber: createLog.sequenceNumber});
      
      // Log minting
      const mintLog = await hederaService.submitMessage(topicId, JSON.stringify({
        action: "tokens_minted",
        lotId,
        tokenId: token.tokenId,
        amount: Math.floor(calculations.listed),
        timestamp: new Date().toISOString()
      }));
      proofLogs.push({topicId, sequenceNumber: mintLog.sequenceNumber});

      setGeneratedLot({
        lotId,
        tokenId: token.tokenId,
        fileId: file.fileId,
        proofLogs,
      });

      toast({
        title: "Success",
        description: `Generated lot ${lotId} with token ${token.tokenId}. Proof logs anchored on HCS.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate lot",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Project Sheets</h1>
        <p className="text-muted-foreground">Developer tools for lot generation with real-time calculations</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Project Input</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Uganda Agroforestry Phase 2"
                  value={form.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  data-testid="input-project-name"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Kampala, Uganda"
                  value={form.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  data-testid="input-location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area">Area (ha)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="100"
                    value={form.area || ''}
                    onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                    data-testid="input-area"
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Rate (t/ha/yr)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    placeholder="3.6"
                    value={form.rate || ''}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    data-testid="input-rate"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buffer">Buffer (%)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    placeholder="20"
                    value={form.buffer || ''}
                    onChange={(e) => handleInputChange('buffer', parseFloat(e.target.value) || 0)}
                    data-testid="input-buffer"
                  />
                </div>
                <div>
                  <Label htmlFor="forward">Forward (%)</Label>
                  <Input
                    id="forward"
                    type="number"
                    placeholder="25"
                    value={form.forward || ''}
                    onChange={(e) => handleInputChange('forward', parseFloat(e.target.value) || 0)}
                    data-testid="input-forward"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>File Uploads (HFS)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFileUpload('project-photo')}
                      data-testid="button-upload-photo"
                    >
                      📸 Upload Photo
                    </Button>
                    {uploadedFiles['project-photo'] && (
                      <span className="text-xs font-mono text-primary">{uploadedFiles['project-photo']}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFileUpload('land-docs')}
                      data-testid="button-upload-docs"
                    >
                      📄 Land Documents
                    </Button>
                    {uploadedFiles['land-docs'] && (
                      <span className="text-xs font-mono text-primary">{uploadedFiles['land-docs']}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleFileUpload('baseline-data')}
                      data-testid="button-upload-baseline"
                    >
                      📊 Baseline Data
                    </Button>
                    {uploadedFiles['baseline-data'] && (
                      <span className="text-xs font-mono text-primary">{uploadedFiles['baseline-data']}</span>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Real-time Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Expected Tons</span>
                <span className="font-mono" data-testid="calc-expected">{calculations.expected.toFixed(1)} t</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">After Buffer</span>
                <span className="font-mono" data-testid="calc-after-buffer">{calculations.afterBuffer.toFixed(1)} t</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Listed Tons</span>
                <span className="font-mono font-bold text-primary" data-testid="calc-listed">{calculations.listed.toFixed(1)} t</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Value @ $10/t</span>
                <span className="font-mono font-bold text-primary" data-testid="calc-value">${calculations.value.toFixed(0)}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateLot}
              className="w-full mt-6 bg-primary text-primary-foreground hover:opacity-90"
              data-testid="button-generate-lot"
            >
              Generate Lot
            </Button>
            
            {generatedLot && (
              <Card className="mt-6 bg-muted" data-testid="lot-output">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Generated Output:</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Lot ID:</strong> <span className="font-mono" data-testid="output-lot-id">{generatedLot.lotId}</span></div>
                    <div><strong>Token ID (HTS):</strong> <span className="font-mono text-primary" data-testid="output-token-id">{generatedLot.tokenId}</span></div>
                    <div><strong>File ID (HFS):</strong> <span className="font-mono text-primary" data-testid="output-file-id">{generatedLot.fileId}</span></div>
                    <div><strong>Proof Logs (HCS):</strong></div>
                    <div className="pl-4 space-y-1">
                      {generatedLot.proofLogs.map((log, index) => (
                        <div key={index} className="text-xs font-mono">
                          <span className="text-muted-foreground">{log.topicId}</span>#<span className="text-primary">{log.sequenceNumber}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-primary text-primary-foreground"
                        onClick={() => {
                          toast({
                            title: "Lot Deployed",
                            description: `${generatedLot.lotId} now appears on Marketplace`,
                          });
                        }}
                        data-testid="button-deploy-to-marketplace"
                      >
                        🚀 Deploy to Marketplace
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Project Sheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {mockProjectSheets.map((sheet) => (
                <Card key={sheet.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm">{sheet.projectName}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sheet.status === 'GENERATED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {sheet.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{sheet.location}</p>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Area/Units:</span>
                          <span className="font-mono">{sheet.area || sheet.units || sheet.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Listed Tons:</span>
                          <span className="font-mono text-primary font-semibold">{sheet.listedTons} t</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Value:</span>
                          <span className="font-mono text-primary font-semibold">${sheet.estimatedValue.toLocaleString()}</span>
                        </div>
                        {sheet.lotId && (
                          <div className="flex justify-between">
                            <span>Lot ID:</span>
                            <span className="font-mono text-xs">{sheet.lotId}</span>
                          </div>
                        )}
                        {sheet.tokenId && (
                          <div className="flex justify-between">
                            <span>Token ID:</span>
                            <span className="font-mono text-xs text-primary">{sheet.tokenId}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1 bg-primary text-primary-foreground">
                          Deploy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
