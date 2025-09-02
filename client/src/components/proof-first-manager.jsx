import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from './ui/textarea';
import { 
  Shield, 
  FileText, 
  MessageSquare, 
  Hash, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Clock,
  Database,
  Zap,
  Eye,
  Download,
  Info
} from 'lucide-react';
import hederaService from '../services/hedera-service';

const ProofFirstManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('operations');
  const [proofHistory, setProofHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Form states for different operations
  const [tokenForm, setTokenForm] = useState({
    name: 'GreenLoop Carbon Credit',
    symbol: 'GLCC',
    decimals: 2,
    initialSupply: 1000000,
    treasuryAccountId: '0.0.123456'
  });
  
  const [fileForm, setFileForm] = useState({
    contents: 'Carbon credit verification data',
    memo: 'Verification proof for lot #123'
  });
  
  const [topicForm, setTopicForm] = useState({
    memo: 'GreenLoop Carbon Trading Topic',
    message: 'Initial carbon lot listing'
  });

  // Load proof history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('greenloop-proof-history');
    if (savedHistory) {
      setProofHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save proof history to localStorage
  const saveProofHistory = (newProof) => {
    const updatedHistory = [newProof, ...proofHistory].slice(0, 50); // Keep last 50 proofs
    setProofHistory(updatedHistory);
    localStorage.setItem('greenloop-proof-history', JSON.stringify(updatedHistory));
  };

  const executeOperation = async (operationType, operationData) => {
    setIsLoading(true);
    setError(null);
    setOperationResult(null);
    
    try {
      let result;
      
      switch (operationType) {
        case 'create-token':
          result = await hederaService.createCarbonToken(
            operationData.name,
            operationData.symbol,
            operationData.decimals,
            operationData.initialSupply,
            operationData.treasuryAccountId
          );
          break;
          
        case 'create-file':
          result = await hederaService.createFile(operationData.contents, operationData.memo);
          break;
          
        case 'create-topic':
          result = await hederaService.createTopic(operationData.memo);
          break;
          
        case 'submit-message':
          result = await hederaService.submitTopicMessage('0.0.789012', operationData.message);
          break;
          
        default:
          throw new Error('Unknown operation type');
      }
      
      // Create proof record
      const proof = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        operationType,
        operationData,
        result,
        txHash: result.txHash,
        fileId: result.fileId,
        topicId: result.topicId,
        tokenId: result.tokenId,
        status: result.success ? 'success' : 'failed',
        explorerUrl: hederaService.getExplorerUrl('transaction', result.txHash || result.transactionId)
      };
      
      setOperationResult(proof);
      saveProofHistory(proof);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getOperationIcon = (operationType) => {
    switch (operationType) {
      case 'create-token': return <Zap className="h-4 w-4" />;
      case 'create-file': return <FileText className="h-4 w-4" />;
      case 'create-topic': return <MessageSquare className="h-4 w-4" />;
      case 'submit-message': return <MessageSquare className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getOperationColor = (operationType) => {
    switch (operationType) {
      case 'create-token': return 'bg-yellow-100 text-yellow-800';
      case 'create-file': return 'bg-blue-100 text-blue-800';
      case 'create-topic': return 'bg-green-100 text-green-800';
      case 'submit-message': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ProofCard = ({ proof }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getOperationIcon(proof.operationType)}
            <span className="capitalize">{proof.operationType.replace('-', ' ')}</span>
            <Badge variant={proof.status === 'success' ? 'default' : 'destructive'}>
              {proof.status}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {formatTimestamp(proof.timestamp)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Hash */}
        {proof.txHash && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Transaction Hash:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {proof.txHash.substring(0, 20)}...{proof.txHash.substring(proof.txHash.length - 10)}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(proof.txHash)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {proof.explorerUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.open(proof.explorerUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* File ID */}
        {proof.fileId && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium">File ID:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {proof.fileId}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(proof.fileId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Topic ID */}
        {proof.topicId && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              <span className="font-medium">Topic ID:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {proof.topicId}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(proof.topicId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Token ID */}
        {proof.tokenId && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Token ID:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {proof.tokenId}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(proof.tokenId)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Operation Data */}
        <details className="cursor-pointer">
          <summary className="font-medium text-sm text-gray-600 hover:text-gray-800">
            View Operation Details
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(proof.operationData, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Proof-First Operations</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">Execute Operations</TabsTrigger>
          <TabsTrigger value="history">Proof History</TabsTrigger>
          <TabsTrigger value="verify">Verify Proofs</TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Token Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Create Token (HTS)
                </CardTitle>
                <CardDescription>
                  Create a new Hedera Token Service token with proof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tokenName">Token Name</Label>
                    <Input
                      id="tokenName"
                      value={tokenForm.name}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tokenSymbol">Symbol</Label>
                    <Input
                      id="tokenSymbol"
                      value={tokenForm.symbol}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, symbol: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="decimals">Decimals</Label>
                    <Input
                      id="decimals"
                      type="number"
                      value={tokenForm.decimals}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, decimals: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="initialSupply">Initial Supply</Label>
                    <Input
                      id="initialSupply"
                      type="number"
                      value={tokenForm.initialSupply}
                      onChange={(e) => setTokenForm(prev => ({ ...prev, initialSupply: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => executeOperation('create-token', tokenForm)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Token'}
                </Button>
              </CardContent>
            </Card>

            {/* File Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Create File (HFS)
                </CardTitle>
                <CardDescription>
                  Create a new Hedera File Service file with proof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fileContents">File Contents</Label>
                  <Textarea
                    id="fileContents"
                    value={fileForm.contents}
                    onChange={(e) => setFileForm(prev => ({ ...prev, contents: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="fileMemo">Memo</Label>
                  <Input
                    id="fileMemo"
                    value={fileForm.memo}
                    onChange={(e) => setFileForm(prev => ({ ...prev, memo: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={() => executeOperation('create-file', fileForm)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create File'}
                </Button>
              </CardContent>
            </Card>

            {/* Topic Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create Topic (HCS)
                </CardTitle>
                <CardDescription>
                  Create a new Hedera Consensus Service topic with proof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topicMemo">Topic Memo</Label>
                  <Input
                    id="topicMemo"
                    value={topicForm.memo}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, memo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="initialMessage">Initial Message</Label>
                  <Textarea
                    id="initialMessage"
                    value={topicForm.message}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={() => executeOperation('create-topic', topicForm)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Topic'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Operation Result */}
          {operationResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Operation Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProofCard proof={operationResult} />
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Proof History</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {proofHistory.length} proofs
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const dataStr = JSON.stringify(proofHistory, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'greenloop-proof-history.json';
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {proofHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No proof history yet</p>
                <p className="text-sm text-gray-400">Execute operations to generate proofs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proofHistory.map(proof => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Verify Tab */}
        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Verify Proof
              </CardTitle>
              <CardDescription>
                Verify the authenticity of transaction hashes, file IDs, and topic IDs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="verifyInput">Enter Transaction Hash, File ID, or Topic ID</Label>
                <Input
                  id="verifyInput"
                  placeholder="0x... or 0.0.123456"
                />
              </div>
              <Button className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Verify on Hedera Network
              </Button>
              
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  This feature connects to Hedera Mirror Node to verify the existence and details of blockchain records.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProofFirstManager;