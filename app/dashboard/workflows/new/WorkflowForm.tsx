"use client";

import React, { useState, useEffect, useTransition, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { availableAgents, Agent } from '@/lib/agents'; 
import { PipedreamConnectedAccount } from '@/types/pipedream'; 
import { createWorkflow, updateWorkflow } from '@/app/actions/workflowActions'; 
import type { Workflow } from "@/lib/generated/prisma";
import {
  listGoogleSpreadsheets,
  createGoogleSpreadsheet,
  listSlackChannels,
} from '@/app/actions/pipedreamProxyActions';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ExternalLink, Plus, SheetIcon, MessageSquareIcon, Rocket } from 'lucide-react';

// Helper function to format agent input keys for display
function formatInputKeyForDisplay(key: string): string {
  return key
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
}

// New Input Definition Parser
interface ParsedInputDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'unknown';
  isRequired: boolean;
  defaultValue?: any;
  description: string;
}

function parseInputDefinition(definition: string): ParsedInputDefinition {
  const nameMatch = definition.match(/^([^\(]+)\s*\(([^)]+)\):\s*(.+)$/);
  if (!nameMatch) {
    const simpleNameMatch = definition.match(/^([^:]+):\s*(.+)$/);
    if (simpleNameMatch) {
      const simpleName = simpleNameMatch[1].trim();
      return {
        name: simpleName.includes(' ') ? simpleName.toLowerCase().replace(/\s+(.)/g, (match, chr) => chr.toUpperCase()) : simpleName, // Convert to camelCase if spaces, else use as is
        label: formatInputKeyForDisplay(simpleName),
        type: 'string',
        isRequired: true,
        description: simpleNameMatch[2].trim(),
      };
    }
    const fallbackName = definition.trim();
    return {
        name: fallbackName.includes(' ') ? fallbackName.toLowerCase().replace(/\s+(.)/g, (match, chr) => chr.toUpperCase()) : fallbackName,
        label: formatInputKeyForDisplay(fallbackName),
        type: 'string',
        isRequired: true, 
        description: `Input for ${fallbackName}`,
    };
  }

  const fullNameKeyRaw = nameMatch[1].trim();
  const attributesString = nameMatch[2].trim();
  const description = nameMatch[3].trim();

  let name: string;
  if (fullNameKeyRaw.includes(' ')) {
    // Convert to camelCase: "Key Message Angle" -> "keyMessageAngle"
    name = fullNameKeyRaw.toLowerCase().replace(/\s+(.)/g, (match, chr) => chr.toUpperCase());
  } else {
    // Assume already camelCase or single word: "userQuery" -> "userQuery"
    name = fullNameKeyRaw;
  }

  let type: ParsedInputDefinition['type'] = 'unknown';
  const typeMatch = attributesString.match(/^(string|number|boolean)/i);
  if (typeMatch) {
    type = typeMatch[0].toLowerCase() as ParsedInputDefinition['type'];
  }

  const isRequired = attributesString.includes('required');
  let defaultValue: any;
  const defaultMatch = attributesString.match(/default:\s*([^,)]+)/);

  if (defaultMatch) {
    const defaultValStr = defaultMatch[1].trim();
    if (type === 'boolean') {
      defaultValue = defaultValStr.toLowerCase() === 'true';
    } else if (type === 'number') {
      defaultValue = parseFloat(defaultValStr);
      if (isNaN(defaultValue)) defaultValue = undefined; // Invalid number default
    } else {
      defaultValue = defaultValStr;
    }
  }

  return {
    name, // Use the processed name
    label: formatInputKeyForDisplay(fullNameKeyRaw), // Original form for label
    type,
    isRequired,
    defaultValue,
    description,
  };
}

// Types for fetched data
interface GoogleSpreadsheet {
  id: string;
  name: string;
  webViewLink?: string;
}
interface SlackChannel {
  id: string;
  name: string;
  purpose?: { value: string };
}

interface WorkflowFormProps {
  pipedreamAccounts: PipedreamConnectedAccount[];
  userId: string;
  initialWorkflowData?: Workflow & { agentInput: Record<string, any>, outputConfiguration: Record<string, any> };
}

export default function WorkflowForm({ pipedreamAccounts, userId, initialWorkflowData }: WorkflowFormProps) {
  console.log("[WorkflowForm] Props received - Pipedream Accounts:", pipedreamAccounts);
  console.log("[WorkflowForm] availableAgents:", availableAgents);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialWorkflowData;

  // New state to track full initialization in edit mode
  const [isEditModeInitialized, setIsEditModeInitialized] = useState(false);

  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentInputs, setAgentInputs] = useState<Record<string, any>>({});

  const [selectedPipedreamAccountId, setSelectedPipedreamAccountId] = useState<string>("");
  const [selectedPipedreamAppSlug, setSelectedPipedreamAppSlug] = useState<string | null>(null);
  const [outputConfiguration, setOutputConfiguration] = useState<Record<string, any>>({});

  // Google Sheets State
  const [googleSheets, setGoogleSheets] = useState<GoogleSpreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>("");
  const [newSheetName, setNewSheetName] = useState("");
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);
  const [isSheetCreating, setIsSheetCreating] = useState(false);

  // Slack Channels State
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [isChannelsLoading, setIsChannelsLoading] = useState(false);

  const selectedAgent = availableAgents.find(agent => agent.id === selectedAgentId);

  // Helper function to fetch sheets
  const fetchSheets = async (accountId: string) => {
    if (!accountId) return;
    setIsSheetsLoading(true);
    try {
      const sheets = await listGoogleSpreadsheets(accountId);
      setGoogleSheets(sheets || []);
      console.log("[WF Form] Fetched Google Sheets:", sheets);
    } catch (error: any) {
      toast.error(`Failed to load spreadsheets: ${error.message}`);
      setGoogleSheets([]);
    } finally {
      setIsSheetsLoading(false);
    }
  };

  // Helper function to fetch channels
  const fetchChannels = async (accountId: string) => {
    if (!accountId) return;
    setIsChannelsLoading(true);
    try {
      const channels = await listSlackChannels(accountId);
      setSlackChannels(channels || []);
      console.log("[WF Form] Fetched Slack Channels:", channels);
    } catch (error: any) {
      toast.error(`Failed to load Slack channels: ${error.message}`);
      setSlackChannels([]);
    } finally {
      setIsChannelsLoading(false);
    }
  };

  // Effect 1: Populate basic form fields from initialWorkflowData (if in edit mode)
  useEffect(() => {
    if (isEditMode && initialWorkflowData && pipedreamAccounts && pipedreamAccounts.length > 0 && availableAgents && availableAgents.length > 0) {
      console.log("[WF Form - Effect 1] Populating from initialWorkflowData (lists are ready):", initialWorkflowData);
      setWorkflowName(initialWorkflowData.name);
      setWorkflowDescription(initialWorkflowData.description || "");

      const initialAgentId = initialWorkflowData.agentId || "";
      const currentSelectedAgent = availableAgents.find(a => a.id === initialAgentId);

      if (currentSelectedAgent) {
        setSelectedAgentId(initialAgentId);
        console.log("[WF Form - Effect 1] Set selectedAgentId to:", initialAgentId);
        
        const initialAgentInputs: Record<string, any> = {};
        if (typeof initialWorkflowData.agentInput === 'object' && initialWorkflowData.agentInput !== null && !Array.isArray(initialWorkflowData.agentInput)) {
            currentSelectedAgent.inputsExpected.forEach(defString => {
                const parsedDef = parseInputDefinition(defString);
                if (initialWorkflowData.agentInput.hasOwnProperty(parsedDef.name)) {
                    let value = initialWorkflowData.agentInput[parsedDef.name];
                    if (parsedDef.type === 'boolean') {
                        initialAgentInputs[parsedDef.name] = String(value).toLowerCase() === 'true';
                    } else if (parsedDef.type === 'number') {
                        const numVal = parseFloat(String(value));
                        initialAgentInputs[parsedDef.name] = isNaN(numVal) ? (parsedDef.defaultValue !== undefined ? parsedDef.defaultValue : '') : numVal;
                    } else {
                        initialAgentInputs[parsedDef.name] = String(value);
                    }
                } else if (parsedDef.defaultValue !== undefined) {
                    initialAgentInputs[parsedDef.name] = parsedDef.defaultValue;
                }
            });
        } else {
            // If no initial inputs, populate with defaults
            currentSelectedAgent.inputsExpected.forEach(defString => {
                const parsedDef = parseInputDefinition(defString);
                if (parsedDef.defaultValue !== undefined) {
                    initialAgentInputs[parsedDef.name] = parsedDef.defaultValue;
                }
            });
        }
        setAgentInputs(initialAgentInputs);
        console.log("[WF Form - Effect 1] Initialized agentInputs:", initialAgentInputs);

      } else {
        setSelectedAgentId("");
        setAgentInputs({});
        console.log("[WF Form - Effect 1] Invalid or no initialAgentId provided, or agent not in availableAgents. Resetting agent selection.");
      }

      const initialAccountId = initialWorkflowData.outputPipedreamConnectedAccountId || "";
      const isValidAccount = pipedreamAccounts.some(acc => acc.id === initialAccountId);

      if (isValidAccount) {
        setSelectedPipedreamAccountId(initialAccountId);
        console.log("[WF Form - Effect 1] Set selectedPipedreamAccountId to:", initialAccountId);

        const accountData = pipedreamAccounts.find(acc => acc.id === initialAccountId);
        if (accountData) {
          const currentAppSlug = accountData.appNameSlug;
          setSelectedPipedreamAppSlug(currentAppSlug);
          console.log(`[WF Form - Effect 1] Set/Derived selectedPipedreamAppSlug: ${currentAppSlug}`);

          if (initialWorkflowData.outputConfiguration && 
              typeof initialWorkflowData.outputConfiguration === 'object' &&
              initialWorkflowData.outputConfiguration.type === currentAppSlug) {
            
            const initialOutputConfig = initialWorkflowData.outputConfiguration;
            setOutputConfiguration(initialOutputConfig);
            console.log("[WF Form - Effect 1] Set outputConfiguration to (matching slug):", initialOutputConfig);

            if (initialOutputConfig.type === 'google_sheets' && initialOutputConfig.spreadsheetId) {
              setSelectedSpreadsheetId(initialOutputConfig.spreadsheetId);
              console.log("[WF Form - Effect 1] Set selectedSpreadsheetId to:", initialOutputConfig.spreadsheetId);
              fetchSheets(initialAccountId); // Fetch sheets for pre-selected GSheet output
            }
            if (initialOutputConfig.type === 'slack' && initialOutputConfig.channelId) {
              setSelectedChannelId(initialOutputConfig.channelId);
              console.log("[WF Form - Effect 1] Set selectedChannelId to:", initialOutputConfig.channelId);
              fetchChannels(initialAccountId); // Fetch channels for pre-selected Slack output
            }
          } else {
            if (initialWorkflowData.outputConfiguration && initialWorkflowData.outputConfiguration.type !== currentAppSlug) {
                 console.warn(`[WF Form - Effect 1] Mismatch: initial output config type ${initialWorkflowData.outputConfiguration.type} vs derived slug ${currentAppSlug}. Resetting outputConfiguration.`);
            }
            setOutputConfiguration({ type: currentAppSlug }); 
            console.log("[WF Form - Effect 1] Set outputConfiguration to basic type for slug:", currentAppSlug);
            setSelectedSpreadsheetId("");
            setSelectedChannelId("");
            // If basic type is set, and it's sheets/slack, still trigger fetch so user can select
            if (currentAppSlug === 'google_sheets') fetchSheets(initialAccountId);
            if (currentAppSlug === 'slack') fetchChannels(initialAccountId);
          }
        } else {
          setSelectedPipedreamAppSlug(null);
          setOutputConfiguration({});
          console.log("[WF Form - Effect 1] Could not find account data for a valid account ID. Resetting slug and output config.");
        }
      } else {
        setSelectedPipedreamAccountId("");
        setSelectedPipedreamAppSlug(null);
        setOutputConfiguration({});
        console.log("[WF Form - Effect 1] Invalid or no initialPipedreamAccountId provided, or account not in pipedreamAccounts. Resetting Pipedream selection & output config.");
      }
      setIsEditModeInitialized(true); 
      console.log("[WF Form - Effect 1] Finished initialization, isEditModeInitialized set to true.");
    } else if (isEditMode && initialWorkflowData) {
      if (!pipedreamAccounts || pipedreamAccounts.length === 0) console.log("[WF Form - Effect 1] Waiting for pipedreamAccounts to populate...");
      if (!availableAgents || availableAgents.length === 0) console.log("[WF Form - Effect 1] Waiting for availableAgents to populate...");
    }
  }, [isEditMode, initialWorkflowData, pipedreamAccounts, availableAgents]);

  // Effect 2: Keep selectedPipedreamAppSlug in sync with selectedPipedreamAccountId changes
  useEffect(() => {
    console.log(`[WF Form - Effect 2] Running. selectedPipedreamAccountId: ${selectedPipedreamAccountId}`);
    const account = pipedreamAccounts.find(acc => acc.id === selectedPipedreamAccountId);
    const newSlug = account ? account.appNameSlug : null;

    if (selectedPipedreamAppSlug !== newSlug) {
      console.log(`[WF Form - Effect 2] App slug changed from '${selectedPipedreamAppSlug}' to '${newSlug}'. Updating state.`);
      setSelectedPipedreamAppSlug(newSlug);
    }
  }, [selectedPipedreamAccountId, pipedreamAccounts]); // Removed selectedPipedreamAppSlug from deps

  // Effect 3: Update outputConfiguration structure if selectedPipedreamAppSlug changes post-initialization
  useEffect(() => {
    console.log(`[WF Form - Effect 3] Running. AppSlug: ${selectedPipedreamAppSlug}, isEditMode: ${isEditMode}, isEditModeInitialized: ${isEditModeInitialized}, currentOutputType: ${outputConfiguration.type}`);

    if (isEditMode && !isEditModeInitialized) {
      console.log("[WF Form - Effect 3] Edit mode, but Effect 1 not complete. Skipping.");
      return; 
    }

    if (selectedPipedreamAppSlug) {
      // If outputConfiguration type is different from the current slug, reset it.
      // This handles cases where the user changes the Pipedream account post-initialization.
      if (outputConfiguration.type !== selectedPipedreamAppSlug) {
        console.log(`[WF Form - Effect 3] Output type '${outputConfiguration.type}' !== current slug '${selectedPipedreamAppSlug}'. Resetting output config.`);
        setOutputConfiguration({ type: selectedPipedreamAppSlug });
      }
    } else {
      // No app slug selected (e.g., Pipedream account deselected or invalid post-initialization)
      // Clear outputConfiguration if it has any keys.
      if (Object.keys(outputConfiguration).length > 0) {
        console.log("[WF Form - Effect 3] No Pipedream app slug. Clearing output configuration.");
        setOutputConfiguration({});
      }
    }
  }, [selectedPipedreamAppSlug, isEditMode, isEditModeInitialized, outputConfiguration.type]); // outputConfiguration.type helps react correctly if it's out of sync

  // Effect 4: Fetch Google Sheets or Slack Channels when Pipedream account/app slug changes (post-initialization)
  useEffect(() => {
    // Don't run this during initial edit mode setup if Effect 1 is handling it, or if no account is selected.
    if ((isEditMode && !isEditModeInitialized) || !selectedPipedreamAccountId || selectedPipedreamAccountId === "_") {
      // Clear lists if no valid account is selected post-initialization
      if (isEditModeInitialized || !isEditMode) { // only clear if not in the middle of initial load
        if(googleSheets.length > 0) setGoogleSheets([]);
        if(slackChannels.length > 0) setSlackChannels([]);
      }
      return;
    }

    console.log(`[WF Form - Effect 4] Evaluating. AppSlug: ${selectedPipedreamAppSlug}, AccountID: ${selectedPipedreamAccountId}`);

    if (selectedPipedreamAppSlug === 'google_sheets') {
      console.log("[WF Form - Effect 4] Detected Google Sheets, fetching sheets.");
      fetchSheets(selectedPipedreamAccountId);
      if(slackChannels.length > 0) setSlackChannels([]); // Clear slack channels if switching to sheets
    } else if (selectedPipedreamAppSlug === 'slack') {
      console.log("[WF Form - Effect 4] Detected Slack, fetching channels.");
      fetchChannels(selectedPipedreamAccountId);
      if(googleSheets.length > 0) setGoogleSheets([]); // Clear google sheets if switching to slack
    } else {
      // Clear both if switching to a different app type
      if(googleSheets.length > 0) setGoogleSheets([]);
      if(slackChannels.length > 0) setSlackChannels([]);
    }
  }, [selectedPipedreamAppSlug, selectedPipedreamAccountId, isEditMode, isEditModeInitialized]);

  // Effect 5: Update outputConfiguration when specific output details (like channelId or spreadsheetId) change
  useEffect(() => {
    // Don't run if in edit mode and not yet initialized, as Effect 1 handles initial population
    if (isEditMode && !isEditModeInitialized) {
      console.log("[WF Form - Effect 5] Edit mode, Effect 1 not complete. Skipping output config update based on item selection.");
      return;
    }

    console.log(`[WF Form - Effect 5] Evaluating. AppSlug: ${selectedPipedreamAppSlug}, SelectedChannel: ${selectedChannelId}, SelectedSheet: ${selectedSpreadsheetId}`);

    if (selectedPipedreamAppSlug === 'slack' && selectedChannelId) {
      const channel = slackChannels.find(c => c.id === selectedChannelId);
      const newConfig = {
        ...outputConfiguration, // Preserve other potential keys if any
        type: 'slack',
        action: 'postMessage', // Default action
        channelId: selectedChannelId,
        channelName: channel?.name || 'Selected Channel'
      };
      // Only update if it's meaningfully different to avoid loops
      if (JSON.stringify(outputConfiguration) !== JSON.stringify(newConfig)) {
        console.log("[WF Form - Effect 5] Updating outputConfiguration for Slack:", newConfig);
        setOutputConfiguration(newConfig);
      }
    } else if (selectedPipedreamAppSlug === 'google_sheets' && selectedSpreadsheetId) {
      const sheet = googleSheets.find(s => s.id === selectedSpreadsheetId);
      const newConfig = {
        ...outputConfiguration, // Preserve other potential keys
        type: 'google_sheets',
        action: 'appendRow', // Default action
        spreadsheetId: selectedSpreadsheetId,
        spreadsheetName: sheet?.name || 'Selected Sheet',
        sheetName: 'Sheet1' // Default sheet name
      };
      if (JSON.stringify(outputConfiguration) !== JSON.stringify(newConfig)) {
        console.log("[WF Form - Effect 5] Updating outputConfiguration for Google Sheets:", newConfig);
        setOutputConfiguration(newConfig);
      }
    } else if (
        (selectedPipedreamAppSlug === 'slack' && !selectedChannelId && outputConfiguration.channelId) ||
        (selectedPipedreamAppSlug === 'google_sheets' && !selectedSpreadsheetId && outputConfiguration.spreadsheetId)
      ) {
        // If a channel/sheet was selected but is now deselected, remove its specific fields from outputConfiguration
        // but keep the type if the app slug is still the same.
        const { channelId, channelName, spreadsheetId, spreadsheetName, sheetName, ...restOfConfig } = outputConfiguration;
        const newConfig = { ...restOfConfig, type: selectedPipedreamAppSlug };
        console.log(`[WF Form - Effect 5] Clearing specific item from outputConfiguration for ${selectedPipedreamAppSlug}:`, newConfig);
        setOutputConfiguration(newConfig);
    }
    // If selectedPipedreamAppSlug is neither, Effect 3 should handle clearing or setting basic type.

  }, [selectedChannelId, selectedSpreadsheetId, selectedPipedreamAppSlug, slackChannels, googleSheets, isEditMode, isEditModeInitialized /*, outputConfiguration - see note below */]);
  // Note: Adding outputConfiguration to deps of Effect 5 can cause loops if not careful.
  // The JSON.stringify check helps, but it's often better to derive from more primary states.

  // Updated handleAgentInputChange
  const handleAgentInputChange = (inputName: string, value: string | boolean | number, type: ParsedInputDefinition['type']) => {
    let processedValue = value;
    if (type === 'number') {
      if (value === '') {
        processedValue = ''; // Allow clearing number input
      } else {
        const num = parseFloat(String(value));
        processedValue = isNaN(num) ? '' : num; // If not a valid number, keep as empty or could set to 0 or undefined based on preference
      }
    }
    setAgentInputs(prev => ({ 
      ...prev, 
      [inputName]: processedValue 
    }));
  };

  const handleCreateNewSheet = async () => {
    if (!newSheetName.trim() || !selectedPipedreamAccountId) {
      toast.error("Please enter a name for the new sheet.");
      return;
    }
    setIsSheetCreating(true);
    try {
      const newSheet = await createGoogleSpreadsheet(selectedPipedreamAccountId, newSheetName.trim());
      toast.success(`Sheet "${newSheet.properties.title}" created!`);
      
      const newConfig = {
        type: 'google_sheets',
        action: 'createSheetAndAppendRow',
        newSpreadsheetName: newSheet.properties.title,
        spreadsheetId: newSheet.spreadsheetId,
        worksheetName: 'Sheet1',
      };
      setOutputConfiguration(newConfig);
      
      setGoogleSheets(prev => [ {id: newSheet.spreadsheetId, name: newSheet.properties.title || 'Untitled Spreadsheet', webViewLink: newSheet.spreadsheetUrl}, ...prev]);
      setSelectedSpreadsheetId(newSheet.spreadsheetId);
      setNewSheetName("");
    } catch (error: any) {
      toast.error(`Failed to create sheet: ${error.message}`);
    } finally {
      setIsSheetCreating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!selectedAgentId || !selectedPipedreamAccountId || selectedPipedreamAccountId === "_") {
      toast.error("Please select an agent and an output connection.");
      setIsSubmitting(false);
      return;
    }
    if (selectedPipedreamAppSlug === 'google_sheets' && !selectedSpreadsheetId) {
      toast.error("Please select or create a Google Sheet for the output.");
      setIsSubmitting(false);
      return;
    }
    if (selectedPipedreamAppSlug === 'slack' && !selectedChannelId) {
      toast.error("Please select a Slack channel for the output.");
      setIsSubmitting(false);
      return;
    }
    if (selectedPipedreamAppSlug && (!outputConfiguration.type || 
        (outputConfiguration.type === 'google_sheets' && !outputConfiguration.spreadsheetId) || 
        (outputConfiguration.type === 'slack' && !outputConfiguration.channelId) )){
            toast.error("Output configuration is incomplete for the selected app.");
            setIsSubmitting(false);
            return;
    }

    const selectedPdAccount = pipedreamAccounts.find(acc => acc.id === selectedPipedreamAccountId);
    if (!selectedPdAccount) {
        toast.error("Selected Pipedream account not found.");
        setIsSubmitting(false);
        return;
    }

    let finalOutputConfiguration = { ...outputConfiguration };

    if (selectedPdAccount.appNameSlug === 'google_sheets') {
      if (finalOutputConfiguration.action === 'createSheetAndAppendRow' && finalOutputConfiguration.newSpreadsheetName) {
        finalOutputConfiguration = {
          type: 'google_sheets',
          action: 'createSheetAndAppendRow',
          newSpreadsheetName: finalOutputConfiguration.newSpreadsheetName,
          spreadsheetId: finalOutputConfiguration.spreadsheetId,
          worksheetName: finalOutputConfiguration.worksheetName || 'Sheet1',
        };
      } else if (selectedSpreadsheetId) {
        const sheet = googleSheets.find(s => s.id === selectedSpreadsheetId);
        finalOutputConfiguration = {
          type: 'google_sheets',
          action: 'appendRow',
          spreadsheetId: selectedSpreadsheetId,
          spreadsheetName: sheet?.name || 'Sheet for append',
          sheetName: 'Sheet1',
        };
      } else {
        toast.error("Google Sheet configuration is incomplete.");
        setIsSubmitting(false);
        return;
      }
    } else if (selectedPdAccount.appNameSlug === 'slack') {
      if (selectedChannelId) {
        const channel = slackChannels.find(c => c.id === selectedChannelId);
        finalOutputConfiguration = {
          type: 'slack',
          action: 'postMessage',
          channelId: selectedChannelId,
          channelName: channel?.name || 'Selected Channel',
        };
      } else {
        toast.error("Slack channel configuration is incomplete.");
        setIsSubmitting(false);
        return;
      }
    }
    

    let parsedAgentInputToSubmit: Record<string, any> = {};
    let allRequiredInputsPresent = true;
    if (selectedAgent?.inputsExpected && Array.isArray(selectedAgent.inputsExpected)) {
        selectedAgent.inputsExpected.forEach((defString: string) => {
            const parsedDef = parseInputDefinition(defString);
            let value = agentInputs[parsedDef.name];

            if (parsedDef.type === 'boolean') {
                value = typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
            } else if (parsedDef.type === 'number') {
                if (value === '' || value === undefined || value === null) {
                    value = parsedDef.defaultValue !== undefined ? parsedDef.defaultValue : undefined;
                } else {
                    const numVal = parseFloat(String(value));
                    value = isNaN(numVal) ? (parsedDef.defaultValue !== undefined ? parsedDef.defaultValue : undefined) : numVal;
                }
            } else { // string or unknown
                 if ((value === undefined || value === '') && parsedDef.defaultValue !== undefined) {
                    value = parsedDef.defaultValue;
                }
            }

            if (parsedDef.isRequired && (value === undefined || value === '')) {
                toast.error(`Required input "${parsedDef.label}" is missing.`);
                allRequiredInputsPresent = false;
            }
            parsedAgentInputToSubmit[parsedDef.name] = value;
        });
    }

    if (!allRequiredInputsPresent) {
        setIsSubmitting(false);
        return;
    }
    
    startTransition(async () => {
      try {
        const workflowDataPayload = {
          name: workflowName,
          description: workflowDescription,
          agentId: selectedAgentId,
          agentInput: parsedAgentInputToSubmit,
          outputPipedreamAppSlug: selectedPdAccount.appNameSlug,
          outputPipedreamConnectedAccountId: selectedPipedreamAccountId,
          outputConfiguration: finalOutputConfiguration,
        };

        if (isEditMode && initialWorkflowData?.id) {
          const result = await updateWorkflow(initialWorkflowData.id, workflowDataPayload as any);
          toast.success(`Workflow "${result.name}" updated successfully!`);
          router.push(`/dashboard/workflows/${initialWorkflowData.id}`);
        } else {
          const result = await createWorkflow(workflowDataPayload as any);
          toast.success(`Workflow "${result.name}" created successfully!`);
          router.push('/dashboard/workflows');
        }
      } catch (error: any) {
        console.error(`Failed to ${isEditMode ? 'update' : 'create'} workflow:`, error);
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} workflow. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Workflow' : 'Create New Workflow'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? `Update the details for "${initialWorkflowData?.name || 'this workflow'}".`
            : 'Define your new automation by selecting an AI agent and configuring its output to a connected application.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Workflow Info */}
          <div className="space-y-2">
            <Label htmlFor="workflowName">Workflow Name <span className="text-destructive">*</span></Label>
            <Input
              id="workflowName"
              value={workflowName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkflowName(e.target.value)}
              placeholder="e.g., Summarize Daily News and Post to Slack"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflowDescription">Description</Label>
            <Textarea
              id="workflowDescription"
              value={workflowDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setWorkflowDescription(e.target.value)}
              placeholder="Briefly describe what this workflow does."
            />
          </div>

          {/* Agent Selection & Configuration */}
          <Card className="p-4 md:p-6 bg-muted/20 dark:bg-primary-dark/30"> 
            <h3 className="text-lg font-semibold mb-3 text-foreground">1. Configure AI Agent</h3>
            <div className="space-y-2 mb-4">
              <Label htmlFor="agentSelect">Select Agent <span className="text-destructive">*</span></Label>
              <Select 
                key={`agent-select-${selectedAgentId || 'initial'}`}
                value={selectedAgentId} 
                onValueChange={value => {
                  console.log("[WorkflowForm] Agent Select onValueChange triggered. New value:", value, "Current selectedAgentId before update:", selectedAgentId);
                  setSelectedAgentId(value);
                  const agent = availableAgents.find(a => a.id === value);
                  const newAgentInputs: Record<string, any> = {};
                  if (agent) {
                    agent.inputsExpected.forEach(defString => {
                      const parsedDef = parseInputDefinition(defString);
                      if (parsedDef.defaultValue !== undefined) {
                        newAgentInputs[parsedDef.name] = parsedDef.defaultValue;
                      } else if (parsedDef.type === 'boolean') {
                        newAgentInputs[parsedDef.name] = false; // Default false for booleans if no other default
                      }
                    });
                  }
                  setAgentInputs(newAgentInputs); // Reset inputs with defaults for new agent
                }} 
                required
              >
                <SelectTrigger id="agentSelect" className="bg-card text-card-foreground">
                  <SelectValue>
                    {selectedAgentId ? availableAgents.find(agent => agent.id === selectedAgentId)?.name : "Choose an AI agent..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--popover, white)', 
                  color: 'var(--popover-foreground, black)',
                  maxHeight: "var(--radix-select-content-available-height, 300px)",
                  overflowY: "auto",
                }}>
                  {availableAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAgent && (
              <div className="space-y-4 mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">{selectedAgent.longDescription || selectedAgent.description}</p>
                <h4 className="text-md font-semibold text-foreground">Agent Inputs:</h4>
                {selectedAgent.inputsExpected && Array.isArray(selectedAgent.inputsExpected) && selectedAgent.inputsExpected.length > 0 ? 
                  selectedAgent.inputsExpected.map(defString => {
                    const parsedDef = parseInputDefinition(defString);
                    if (!parsedDef) return null;

                    const commonInputProps = {
                        id: `agentInput-${parsedDef.name}`,
                        required: parsedDef.isRequired,
                    };

                    if (parsedDef.type === 'boolean') {
                      return (
                        <div key={parsedDef.name} className="flex items-center space-x-3 py-2.5">
                          <input
                            type="checkbox"
                            {...commonInputProps}
                            checked={agentInputs[parsedDef.name] === true || String(agentInputs[parsedDef.name]).toLowerCase() === 'true'}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => 
                                handleAgentInputChange(parsedDef.name, e.target.checked, 'boolean')
                            }
                            className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary-focus accent-primary"
                          />
                          <Label htmlFor={commonInputProps.id} className="cursor-pointer text-sm font-medium">
                            {parsedDef.label}
                            {parsedDef.isRequired && <span className="text-destructive"> *</span>}
                          </Label>
                          {parsedDef.description && <p className="text-xs text-muted-foreground pl-1">({parsedDef.description})</p>}
                        </div>
                      );
                    } else if (parsedDef.type === 'number') {
                      return (
                        <div key={parsedDef.name} className="space-y-1.5">
                          <Label htmlFor={commonInputProps.id}>
                            {parsedDef.label}
                            {parsedDef.isRequired && <span className="text-destructive"> *</span>}
                          </Label>
                          <Input
                            {...commonInputProps}
                            type="number"
                            value={agentInputs[parsedDef.name] === undefined || agentInputs[parsedDef.name] === null ? '' : agentInputs[parsedDef.name]} 
                            onChange={(e: ChangeEvent<HTMLInputElement>) => 
                                handleAgentInputChange(parsedDef.name, e.target.value, 'number')
                            }
                            placeholder={parsedDef.description || `E.g., ${parsedDef.defaultValue !== undefined ? parsedDef.defaultValue : '123'}`}
                          />
                           {parsedDef.description && <p className="text-xs text-muted-foreground pt-1">{parsedDef.description}</p>}
                        </div>
                      );
                    } else { 
                      return (
                        <div key={parsedDef.name} className="space-y-1.5">
                          <Label htmlFor={commonInputProps.id}>
                            {parsedDef.label}
                            {parsedDef.isRequired && <span className="text-destructive"> *</span>}
                          </Label>
                          <Textarea
                            {...commonInputProps}
                            value={agentInputs[parsedDef.name] || ''} 
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                                handleAgentInputChange(parsedDef.name, e.target.value, 'string')
                            }
                            placeholder={parsedDef.description || `Enter ${parsedDef.label.toLowerCase()}`}
                            className="min-h-[60px]"
                            rows={parsedDef.type === 'string' && parsedDef.description.length > 50 ? 3 : 2} // Slightly taller for long descriptions
                          />
                           {parsedDef.description && <p className="text-xs text-muted-foreground pt-1">{parsedDef.description}</p>}
                        </div>
                      );
                    }
                  }) : <p className="text-xs text-muted-foreground">This agent requires no specific inputs beyond its core function.</p>}
              </div>
            )}
          </Card>

          {/* Output Configuration */}
          <Card className="p-4 md:p-6 bg-muted/20 dark:bg-primary-dark/30">
            <h3 className="text-lg font-semibold mb-3 text-foreground">2. Configure Output Destination</h3>
            <div className="space-y-2 mb-4">
              <Label htmlFor="pipedreamAccountSelect">Send Output To (via Pipedream) <span className="text-destructive">*</span></Label>
              <Select 
                key={`pipedream-account-select-${selectedPipedreamAccountId || 'initial'}`}
                value={selectedPipedreamAccountId} 
                onValueChange={value => {
                  console.log("[WorkflowForm] Pipedream Account Select onValueChange triggered. New value:", value, "Current selectedPipedreamAccountId before update:", selectedPipedreamAccountId);
                  setSelectedPipedreamAccountId(value);
                }} 
                required
              >
                <SelectTrigger id="pipedreamAccountSelect" className="bg-card text-card-foreground">
                  <SelectValue>
                    {selectedPipedreamAccountId && selectedPipedreamAccountId !== "_" 
                      ? pipedreamAccounts.find(acc => acc.id === selectedPipedreamAccountId)?.app 
                      : "Choose a connected Pipedream app..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent style={{
                  backgroundColor: 'var(--popover, white)', 
                  color: 'var(--popover-foreground, black)',
                  maxHeight: "var(--radix-select-content-available-height, 300px)",
                  overflowY: "auto",
                }}>
                  {pipedreamAccounts.length > 0 ? pipedreamAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.app} ({acc.appNameSlug} - ID: {acc.id.substring(0,6)}...)
                    </SelectItem>
                  )) : <SelectItem value="_" disabled>No Pipedream accounts. Connect first.</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {selectedPipedreamAccountId && selectedPipedreamAccountId !== "_" && (
              <div className="space-y-4 mt-4 border-t border-border pt-4">
                {selectedPipedreamAppSlug === 'google_sheets' && (
                  <div className="space-y-3">
                    <Label className="flex items-center"><SheetIcon className="w-4 h-4 mr-2" />Configure Google Sheet Output</Label>
                    <Select 
                      value={selectedSpreadsheetId} 
                      onValueChange={setSelectedSpreadsheetId}
                      disabled={isSheetsLoading || isSheetCreating}
                    >
                      <SelectTrigger className="w-full" style={{
                        "--radix-select-trigger-width": "100%", 
                        "--radix-select-content-available-width": "var(--radix-select-trigger-width)", 
                        "--radix-select-content-available-height": "300px"
                      } as React.CSSProperties}>
                        <SelectValue placeholder="Select a spreadsheet" />
                      </SelectTrigger>
                      <SelectContent style={{
                        backgroundColor: 'var(--popover, white)', 
                        color: 'var(--popover-foreground, black)',
                        maxHeight: "var(--radix-select-content-available-height, 300px)",
                        overflowY: "auto",
                        width: "var(--radix-select-trigger-width)"
                      } as React.CSSProperties}>
                        {isSheetsLoading ? (
                          <SelectItem value="loading" disabled className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading sheets...
                          </SelectItem>
                        ) : googleSheets.length === 0 ? (
                          <SelectItem value="no-sheets" disabled>
                            No spreadsheets found. Create one below.
                          </SelectItem>
                        ) : (
                          googleSheets.map((sheet) => (
                            <SelectItem key={sheet.id} value={sheet.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{sheet.name}</span>
                                {sheet.webViewLink && (
                                  <a href={sheet.webViewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </a>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground text-center my-2">OR</div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="text" 
                        placeholder="New spreadsheet name..." 
                        value={newSheetName} 
                        onChange={e => setNewSheetName(e.target.value)}
                        disabled={isSheetCreating || isSheetsLoading}
                        className="bg-card text-card-foreground flex-grow"
                      />
                      <Button 
                        type="button" 
                        onClick={handleCreateNewSheet} 
                        disabled={isSheetCreating || isSheetsLoading || !newSheetName.trim()}
                        variant="outline"
                      >
                        {isSheetCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Create Sheet
                      </Button>
                    </div>
                    {selectedSpreadsheetId && outputConfiguration.spreadsheetName && (
                        <p className="text-xs text-muted-foreground">
                            Selected Sheet: <span className="font-medium text-foreground">{outputConfiguration.spreadsheetName}</span> (ID: {outputConfiguration.spreadsheetId?.substring(0,10)}...). Output will be appended to 'Sheet1'.
                        </p>
                    )}
                  </div>
                )}

                {selectedPipedreamAppSlug === 'slack' && (
                  <div className="space-y-3">
                    <Label className="flex items-center"><MessageSquareIcon className="w-4 h-4 mr-2"/>Configure Slack Output</Label>
                    <Select 
                      value={selectedChannelId} 
                      onValueChange={setSelectedChannelId}
                      disabled={isChannelsLoading}
                    >
                      <SelectTrigger className="bg-card text-card-foreground">
                        <SelectValue placeholder={isChannelsLoading ? "Loading channels..." : "Select Slack channel..."} />
                      </SelectTrigger>
                      <SelectContent style={{
                        backgroundColor: 'var(--popover, white)', 
                        color: 'var(--popover-foreground, black)',
                        maxHeight: "var(--radix-select-content-available-height, 300px)",
                        overflowY: "auto",
                      }}>
                        {isChannelsLoading && <SelectItem value="loading" disabled>Loading channels...</SelectItem>}
                        {!isChannelsLoading && slackChannels.length === 0 && <SelectItem value="no-channels" disabled>No channels found.</SelectItem>}
                        {slackChannels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     {selectedChannelId && outputConfiguration.channelName && (
                        <p className="text-xs text-muted-foreground">
                            Selected Channel: <span className="font-medium text-foreground">#{outputConfiguration.channelName}</span> (ID: {outputConfiguration.channelId}).
                        </p>
                    )}
                  </div>
                )}

                {/* Fallback for other app types or if specific UI not implemented yet */}
                {selectedPipedreamAppSlug && selectedPipedreamAppSlug !== 'google_sheets' && selectedPipedreamAppSlug !== 'slack' && (
                    <div>
                        <Label htmlFor="genericOutputConfig">Output Configuration (JSON)</Label>
                        <Textarea
                        id="genericOutputConfig"
                        value={JSON.stringify(outputConfiguration, null, 2)}
                        onChange={(e) => {
                            try {
                            setOutputConfiguration(JSON.parse(e.target.value));
                            } catch (err) {
                            toast.error("Invalid JSON format for output configuration.")
                            }
                        }}
                        placeholder={`{\n  "type": "${selectedPipedreamAppSlug}",\n  "key": "value"\n}`}
                        rows={4}
                        className="font-mono text-xs bg-background"
                        />
                        <p className="text-xs text-muted-foreground">
                        Define the output configuration for <span className="font-semibold">{pipedreamAccounts.find(acc => acc.id === selectedPipedreamAccountId)?.app || selectedPipedreamAppSlug}</span>.
                        </p>
                    </div>
                )}

              </div>
            )}
          </Card>

          <Button 
            type="submit" 
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-primary text-primary-dark dark:text-white hover:opacity-90 transition-opacity py-3 px-6 text-base rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-150"
            disabled={isPending || isSubmitting || !workflowName || !selectedAgentId || !selectedPipedreamAccountId || selectedPipedreamAccountId === "_"}
          >
            {(isPending || isSubmitting) ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Rocket size={18} className="mr-2" />
            )}
            <span>
              {(isPending || isSubmitting)
                ? `${isEditMode ? 'Updating' : 'Creating'} Workflow...`
                : isEditMode ? 'Update Workflow' : 'Create Workflow'}
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 