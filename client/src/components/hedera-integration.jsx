import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  FileText, 
  MessageSquare, 
  Network, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Loader2,
  Send,
  Plus,
  ArrowRightLeft
} from 'lucide-react';
import hederaService from '../services/hedera-service';

const HederaIntegration = () => {
  const { toast } = useToast();
  const [networkStatus, setNetworkStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [formData, setFormData] = useState({
    // HTS forms
    tokenName: 'GreenLoop Carbon Credit',
    tokenSymbol: 'GLCC',
    tokenDecimals: 2,
    initialSupply: 1000,
    mintAmount: 100,
    transferAmount: 50,
    fromAccount: '',
    toAccount: '',
    selectedTokenId: '',
    
    // HFS forms
    fileContent: '',
    fileMemo: 'Carbon credit verification document',
    appendContent: '',
    selectedFileId: '',
    
    // HCS forms
    topicMemo: 'Carbon credit transactions topic',
    topicMessage: '',
    selectedTopicId: ''
  });

  useEffect(() => {
    const status = hederaService.getNetworkStatus();
    setNetworkStatus(status);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const executeAction = async (action, params) => {
    setLoading(true);
    try {
      let result;
      switch (action) {
        case 'createToken':
          result = await hederaService.createCarbonToken(
            params.name,
            params.symbol,
            params.decimals,
            params.initialSupply
          );
          break;
        case 'mintTokens':
          result = await hederaService.mintCarbonTokens(
            params.tokenId,
            params.amount
          );
          break;
        case 'transferTokens':
          result = await hederaService.transferCarbonTokens(
            params.tokenId,
            params.fromAccount,
            params.toAccount,
            params.amount
          );
          break;
        case 'createFile':
          result = await hederaService.createFile(
            params.content,
            params.memo
          );
          break;
        case 'appendFile':
          result = await hederaService.appendToFile(
            params.fileId,
            params.content
          );
          break;
        case 'createTopic':
          result = await hederaService.createTopic(params.memo);
          break;
        case 'submitMessage':
          result = await hederaService.submitTopicMessage(
            params.topicId,
            params.message
          );
          break;
        default:
          throw new Error('Unknown action');
      }
      
      setResults(prev => ({ ...prev, [action]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [action]: { success: false, error: error.message } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const NetworkStatusCard = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Hedera Network Status
        </CardTitle>
        <CardDescription>
          Current connection status and network information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">Network</Label>
            <Badge variant="outline">{networkStatus?.network || 'Unknown'}</Badge>
          </div>
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">Status</Label>
            <div className="flex items-center gap-2">
              {networkStatus?.isInitialized ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {networkStatus?.isInitialized ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">Operator ID</Label>
            <span className="text-sm font-mono">
              {networkStatus?.operatorId || 'Not set'}
            </span>
          </div>
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">Client</Label>
            <span className="text-sm">{networkStatus?.client || 'N/A'}</span>
          </div>
        </div>
        {!networkStatus?.isInitialized && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">            <p className="text-sm text-yellow-800">              Hedera credentials not configured. Running in mock mode for development.            </p>          </div>
        )}
      </CardContent>
    </Card>
  );

  const ResultDisplay = ({ result, type }) => {
    if (!result) return null;
    
    if (result.success) {      toast({        title: "Success",        description: `Operation completed successfully. ${result.tokenId ? `Token ID: ${result.tokenId}` : ''} ${result.fileId ? `File ID: ${result.fileId}` : ''} ${result.topicId ? `Topic ID: ${result.topicId}` : ''} ${result.transactionId ? `Transaction: ${hederaService.formatTransactionId(result.transactionId)}` : ''}`.trim(),        variant: "default"      });    } else {      toast({        title: "Error",        description: result.error,        variant: "destructive"      });    }    return null;
  };

  return (
    <div className="space-y-6">
      <NetworkStatusCard />
      
      <Tabs defaultValue="hts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hts" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            HTS (Tokens)
          </TabsTrigger>
          <TabsTrigger value="hfs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            HFS (Files)
          </TabsTrigger>
          <TabsTrigger value="hcs" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            HCS (Consensus)
          </TabsTrigger>
        </TabsList>

        {/* HTS Tab */}
        <TabsContent value="hts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Carbon Credit Token
              </CardTitle>
              <CardDescription>
                Create a new fungible token for carbon credits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    value={formData.tokenName}
                    onChange={(e) => handleInputChange('tokenName', e.target.value)}
                    placeholder="e.g., GreenLoop Carbon Credit"
                  />
                </div>
                <div>
                  <Label htmlFor="tokenSymbol">Token Symbol</Label>
                  <Input
                    id="tokenSymbol"
                    value={formData.tokenSymbol}
                    onChange={(e) => handleInputChange('tokenSymbol', e.target.value)}
                    placeholder="e.g., GLCC"
                  />
                </div>
                <div>
                  <Label htmlFor="tokenDecimals">Decimals</Label>
                  <Input
                    id="tokenDecimals"
                    type="number"
                    value={formData.tokenDecimals}
                    onChange={(e) => handleInputChange('tokenDecimals', parseInt(e.target.value))}
                    min="0"
                    max="18"
                  />
                </div>
                <div>
                  <Label htmlFor="initialSupply">Initial Supply</Label>
                  <Input
                    id="initialSupply"
                    type="number"
                    value={formData.initialSupply}
                    onChange={(e) => handleInputChange('initialSupply', parseInt(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
              <Button
                onClick={() => executeAction('createToken', {
                  name: formData.tokenName,
                  symbol: formData.tokenSymbol,
                  decimals: formData.tokenDecimals,
                  initialSupply: formData.initialSupply
                })}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Token
              </Button>
              <ResultDisplay result={results.createToken} type="token" />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Mint Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mintTokenId">Token ID</Label>
                  <Input
                    id="mintTokenId"
                    value={formData.selectedTokenId}
                    onChange={(e) => handleInputChange('selectedTokenId', e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="mintAmount">Amount</Label>
                  <Input
                    id="mintAmount"
                    type="number"
                    value={formData.mintAmount}
                    onChange={(e) => handleInputChange('mintAmount', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <Button
                  onClick={() => executeAction('mintTokens', {
                    tokenId: formData.selectedTokenId,
                    amount: formData.mintAmount
                  })}
                  disabled={loading || !formData.selectedTokenId}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Mint Tokens
                </Button>
                <ResultDisplay result={results.mintTokens} type="mint" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Transfer Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transferTokenId">Token ID</Label>
                  <Input
                    id="transferTokenId"
                    value={formData.selectedTokenId}
                    onChange={(e) => handleInputChange('selectedTokenId', e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="fromAccount">From Account</Label>
                  <Input
                    id="fromAccount"
                    value={formData.fromAccount}
                    onChange={(e) => handleInputChange('fromAccount', e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="toAccount">To Account</Label>
                  <Input
                    id="toAccount"
                    value={formData.toAccount}
                    onChange={(e) => handleInputChange('toAccount', e.target.value)}
                    placeholder="0.0.654321"
                  />
                </div>
                <div>
                  <Label htmlFor="transferAmount">Amount</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    value={formData.transferAmount}
                    onChange={(e) => handleInputChange('transferAmount', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <Button
                  onClick={() => executeAction('transferTokens', {
                    tokenId: formData.selectedTokenId,
                    fromAccount: formData.fromAccount,
                    toAccount: formData.toAccount,
                    amount: formData.transferAmount
                  })}
                  disabled={loading || !formData.selectedTokenId || !formData.fromAccount || !formData.toAccount}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
                  Transfer Tokens
                </Button>
                <ResultDisplay result={results.transferTokens} type="transfer" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HFS Tab */}
        <TabsContent value="hfs" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create File
                </CardTitle>
                <CardDescription>
                  Store verification documents on Hedera File Service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fileMemo">File Memo</Label>
                  <Input
                    id="fileMemo"
                    value={formData.fileMemo}
                    onChange={(e) => handleInputChange('fileMemo', e.target.value)}
                    placeholder="Description of the file"
                  />
                </div>
                <div>
                  <Label htmlFor="fileContent">File Content</Label>
                  <Textarea
                    id="fileContent"
                    value={formData.fileContent}
                    onChange={(e) => handleInputChange('fileContent', e.target.value)}
                    placeholder="Enter file content or JSON data..."
                    rows={6}
                  />
                </div>
                <Button
                  onClick={() => executeAction('createFile', {
                    content: formData.fileContent,
                    memo: formData.fileMemo
                  })}
                  disabled={loading || !formData.fileContent}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                  Create File
                </Button>
                <ResultDisplay result={results.createFile} type="file" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Append to File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="appendFileId">File ID</Label>
                  <Input
                    id="appendFileId"
                    value={formData.selectedFileId}
                    onChange={(e) => handleInputChange('selectedFileId', e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="appendContent">Content to Append</Label>
                  <Textarea
                    id="appendContent"
                    value={formData.appendContent}
                    onChange={(e) => handleInputChange('appendContent', e.target.value)}
                    placeholder="Additional content to append..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => executeAction('appendFile', {
                    fileId: formData.selectedFileId,
                    content: formData.appendContent
                  })}
                  disabled={loading || !formData.selectedFileId || !formData.appendContent}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Append to File
                </Button>
                <ResultDisplay result={results.appendFile} type="append" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HCS Tab */}
        <TabsContent value="hcs" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Topic
                </CardTitle>
                <CardDescription>
                  Create a consensus topic for transaction logging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topicMemo">Topic Memo</Label>
                  <Input
                    id="topicMemo"
                    value={formData.topicMemo}
                    onChange={(e) => handleInputChange('topicMemo', e.target.value)}
                    placeholder="Description of the topic"
                  />
                </div>
                <Button
                  onClick={() => executeAction('createTopic', {
                    memo: formData.topicMemo
                  })}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Create Topic
                </Button>
                <ResultDisplay result={results.createTopic} type="topic" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Submit Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="messageTopicId">Topic ID</Label>
                  <Input
                    id="messageTopicId"
                    value={formData.selectedTopicId}
                    onChange={(e) => handleInputChange('selectedTopicId', e.target.value)}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="topicMessage">Message</Label>
                  <Textarea
                    id="topicMessage"
                    value={formData.topicMessage}
                    onChange={(e) => handleInputChange('topicMessage', e.target.value)}
                    placeholder="Transaction data or message..."
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => executeAction('submitMessage', {
                    topicId: formData.selectedTopicId,
                    message: formData.topicMessage
                  })}
                  disabled={loading || !formData.selectedTopicId || !formData.topicMessage}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Message
                </Button>
                <ResultDisplay result={results.submitMessage} type="message" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HederaIntegration;