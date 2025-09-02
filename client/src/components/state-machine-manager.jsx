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
  GitBranch, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  Info,
  AlertTriangle,
  Settings,
  History
} from 'lucide-react';
import { 
  LOT_STATES,
  ORDER_STATES,
  CLAIM_STATES,
  LOT_TRANSITIONS,
  ORDER_TRANSITIONS,
  CLAIM_TRANSITIONS,
  canTransition,
  transitionLotState,
  transitionOrderState,
  transitionClaimState,
  getStateInfo,
  validateStateTransitionHistory
} from '@shared/schema.js';

const StateMachineManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('lot');
  const [currentStates, setCurrentStates] = useState({
    lot: LOT_STATES.DRAFT,
    order: ORDER_STATES.PENDING,
    claim: CLAIM_STATES.DRAFT
  });
  const [transitionHistory, setTransitionHistory] = useState({
    lot: [],
    order: [],
    claim: []
  });
  const [transitionContext, setTransitionContext] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  const stateConfigs = {
    lot: {
      states: LOT_STATES,
      transitions: LOT_TRANSITIONS,
      transitionFn: transitionLotState,
      color: 'blue',
      icon: GitBranch
    },
    order: {
      states: ORDER_STATES,
      transitions: ORDER_TRANSITIONS,
      transitionFn: transitionOrderState,
      color: 'green',
      icon: Settings
    },
    claim: {
      states: CLAIM_STATES,
      transitions: CLAIM_TRANSITIONS,
      transitionFn: transitionClaimState,
      color: 'purple',
      icon: CheckCircle
    }
  };

  const getStateColor = (state, type) => {
    const config = stateConfigs[type];
    const stateValues = Object.values(config.states);
    const terminalStates = Object.keys(config.transitions).filter(
      key => config.transitions[key].length === 0
    );
    
    if (terminalStates.includes(state)) {
      return state.includes('cancelled') || state.includes('failed') || state.includes('rejected') 
        ? 'destructive' : 'default';
    }
    return 'secondary';
  };

  const handleStateTransition = (type, targetState) => {
    try {
      setError(null);
      const config = stateConfigs[type];
      const currentState = currentStates[type];
      
      const result = config.transitionFn(currentState, targetState, transitionContext);
      
      // Update current state
      setCurrentStates(prev => ({
        ...prev,
        [type]: result.newState
      }));
      
      // Add to history
      setTransitionHistory(prev => ({
        ...prev,
        [type]: [...prev[type], result.transition]
      }));
      
      // Clear context after successful transition
      setTransitionContext({});
      
    } catch (err) {
      setError(err.message);
    }
  };

  const resetStateMachine = (type) => {
    const config = stateConfigs[type];
    const initialState = Object.values(config.states)[0];
    
    setCurrentStates(prev => ({
      ...prev,
      [type]: initialState
    }));
    
    setTransitionHistory(prev => ({
      ...prev,
      [type]: []
    }));
    
    setError(null);
    setTransitionContext({});
  };

  const validateHistory = (type) => {
    const history = transitionHistory[type];
    if (history.length === 0) {
      setValidationResult({ isValid: true, message: 'No transitions to validate' });
      return;
    }
    
    try {
      const result = validateStateTransitionHistory(history, type);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({ isValid: false, error: err.message });
    }
  };

  const getPossibleTransitions = (type) => {
    const config = stateConfigs[type];
    const currentState = currentStates[type];
    return config.transitions[currentState] || [];
  };

  const formatStateName = (state) => {
    return state.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const StateMachineTab = ({ type }) => {
    const config = stateConfigs[type];
    const currentState = currentStates[type];
    const possibleTransitions = getPossibleTransitions(type);
    const history = transitionHistory[type];
    const stateInfo = getStateInfo(currentState, type);
    
    return (
      <div className="space-y-6">
        {/* Current State Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <config.icon className="h-5 w-5" />
              Current {formatStateName(type)} State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={getStateColor(currentState, type)} className="text-lg px-3 py-1">
                  {formatStateName(currentState)}
                </Badge>
                {stateInfo.isTerminal && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Terminal
                  </Badge>
                )}
                {stateInfo.isInitial && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Initial
                  </Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => resetStateMachine(type)}
              >
                Reset
              </Button>
            </div>
            
            {possibleTransitions.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Next Possible States:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {possibleTransitions.map(state => (
                    <Badge key={state} variant="outline">
                      {formatStateName(state)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transition Controls */}
        {possibleTransitions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execute Transition</CardTitle>
              <CardDescription>
                Select a target state and provide context for the transition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetState">Target State</Label>
                  <Select onValueChange={(value) => setTransitionContext(prev => ({ ...prev, targetState: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target state" />
                    </SelectTrigger>
                    <SelectContent>
                      {possibleTransitions.map(state => (
                        <SelectItem key={state} value={state}>
                          {formatStateName(state)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                  <Input
                    id="txHash"
                    placeholder="0x..."
                    value={transitionContext.txHash || ''}
                    onChange={(e) => setTransitionContext(prev => ({ ...prev, txHash: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fileId">File ID (Optional)</Label>
                  <Input
                    id="fileId"
                    placeholder="0.0.123456"
                    value={transitionContext.fileId || ''}
                    onChange={(e) => setTransitionContext(prev => ({ ...prev, fileId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="topicId">Topic ID (Optional)</Label>
                  <Input
                    id="topicId"
                    placeholder="0.0.789012"
                    value={transitionContext.topicId || ''}
                    onChange={(e) => setTransitionContext(prev => ({ ...prev, topicId: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contextData">Additional Context (JSON)</Label>
                <Textarea
                  id="contextData"
                  placeholder='{"verificationProof": "proof123", "price": 25.50}'
                  value={transitionContext.contextData || ''}
                  onChange={(e) => {
                    try {
                      const parsed = e.target.value ? JSON.parse(e.target.value) : {};
                      setTransitionContext(prev => ({ ...prev, ...parsed, contextData: e.target.value }));
                    } catch {
                      setTransitionContext(prev => ({ ...prev, contextData: e.target.value }));
                    }
                  }}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={() => {
                  if (transitionContext.targetState) {
                    handleStateTransition(type, transitionContext.targetState);
                  }
                }}
                disabled={!transitionContext.targetState}
                className="w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Execute Transition
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transition History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transition History
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => validateHistory(type)}
                disabled={history.length === 0}
              >
                Validate History
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transitions yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((transition, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStateColor(transition.from, type)}>
                          {formatStateName(transition.from)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <Badge variant={getStateColor(transition.to, type)}>
                          {formatStateName(transition.to)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transition.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {validationResult && (
              <div className={`mt-4 p-3 rounded-lg border ${
                validationResult.isValid 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>
                    {validationResult.isValid 
                      ? `History is valid. Final state: ${formatStateName(validationResult.finalState || currentState)}`
                      : validationResult.error || validationResult.message
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* State Machine Diagram */}
        <Card>
          <CardHeader>
            <CardTitle>State Machine Diagram</CardTitle>
            <CardDescription>
              Visual representation of all possible states and transitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.values(config.states).map(state => {
                const isCurrentState = state === currentState;
                const possibleFromHere = config.transitions[state] || [];
                const isTerminal = possibleFromHere.length === 0;
                
                return (
                  <div key={state} className={`p-3 border rounded-lg ${isCurrentState ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getStateColor(state, type)}>
                        {formatStateName(state)}
                      </Badge>
                      {isCurrentState && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    {possibleFromHere.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <div className="font-medium mb-1">Can transition to:</div>
                        <div className="space-y-1">
                          {possibleFromHere.map(nextState => (
                            <div key={nextState} className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" />
                              <span>{formatStateName(nextState)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isTerminal && (
                      <div className="text-xs text-gray-500 mt-2">
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Terminal State
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="h-6 w-6" />
        <h2 className="text-2xl font-bold">State Machine Manager</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lot" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Lot States
          </TabsTrigger>
          <TabsTrigger value="order" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Order States
          </TabsTrigger>
          <TabsTrigger value="claim" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Claim States
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lot">
          <StateMachineTab type="lot" />
        </TabsContent>
        
        <TabsContent value="order">
          <StateMachineTab type="order" />
        </TabsContent>
        
        <TabsContent value="claim">
          <StateMachineTab type="claim" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateMachineManager;