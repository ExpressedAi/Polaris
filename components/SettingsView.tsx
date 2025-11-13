import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppView } from '../types';
import { ChevronDownIcon, CheckIcon } from './Icons';
import { clearAllData } from '../services/storage';
import DarkModeToggle from './DarkModeToggle';
import InsightsDashboard from './InsightsDashboard';
import { downloadExport, parseImportFile, importData } from '../utils/exportImport';
import { useToast } from '../hooks/useToast';

const popularModels = [
    'openrouter/polaris-alpha',
    'anthropic/claude-sonnet-4.5',
    'anthropic/claude-haiku-4.5',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-opus',
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash-preview-09-2025',
    'google/gemini-2.5-flash-lite-preview-09-2025',
    'google/gemini-pro-1.5',
    'x-ai/grok-4',
    'x-ai/grok-4-fast',
    'x-ai/grok-code-fast-1',
    'openai/gpt-5-chat',
    'openai/gpt-5',
    'openai/gpt-5-mini',
    'openai/gpt-5-nano',
    'openai/gpt-4.1',
    'openai/gpt-4.1-nano',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-405b-instruct',
    'meta-llama/llama-3.1-70b-instruct',
    'minimax/minimax-m2',
    'amazon/nova-premier-v1',
];

const embeddingModels = [
    'qwen/qwen3-embedding-8b',
    'google/gemini-embedding-001',
    'openai/text-embedding-3-small',
];

const SettingsView: React.FC = () => {
    const { settings, updateSetting, setActiveView } = useAppContext();
    const { success, error: showError } = useToast();
    const [showApiKey, setShowApiKey] = useState(false);
    const [showAuxKey, setShowAuxKey] = useState(false);
    const [showAuditKey, setShowAuditKey] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col h-full">
            <div className="glass-panel border border-white/70 dark:border-white/10 rounded-[32px] mx-4 mt-2 px-6 py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary-light dark:text-secondary-dark">Every piece of intel matters</p>
                    <h1 className="text-2xl font-semibold mt-1">Northstar Control Room</h1>
                    <p className="text-sm text-secondary-light dark:text-secondary-dark max-w-2xl">
                        This is where Sylvia gets her edge. Bring your own OpenRouter key, shape the Polaris stack, and tune the JIT Memory pipeline so our agent never forgets what matters.
                    </p>
                </div>
                <button
                    onClick={() => setActiveView(AppView.CHAT)}
                    className="mt-2 md:mt-0 inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-black text-white text-sm hover:shadow-lg transition-colors"
                >
                    Back to chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 soft-scrollbar">
                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl">
                    <div className="flex flex-col gap-2 mb-6">
                        <p className="text-xs font-semibold text-accent tracking-[0.3em] uppercase">Bring Your Own Key</p>
                        <h2 className="text-xl font-semibold">OpenRouter · Polaris Alpha</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            We default to `openrouter/polaris-alpha` (256k context, 128k max output). Your key never leaves the browser — it lives in IndexedDB alongside your threads.
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <label className="text-sm font-medium">OpenRouter API Key</label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={settings.apiKey || ''}
                                    onChange={(e) => updateSetting('apiKey', e.target.value)}
                                    placeholder="sk-or-..."
                                    className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 pr-28"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey((prev) => !prev)}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-sm px-3 py-1 rounded-full bg-black text-white"
                                >
                                    {showApiKey ? 'Hide' : 'Reveal'}
                                </button>
                            </div>
                            <p className="text-xs text-secondary-light dark:text-secondary-dark">
                                Stored locally only. Rotate whenever you need.
                            </p>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Weighted System Prompts</label>
                                    <div className="flex gap-2">
                                        {settings.weightedPrompts && settings.weightedPrompts.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const current = settings.weightedPrompts || [];
                                                    const equalWeight = Math.floor(100 / current.length);
                                                    const remainder = 100 - (equalWeight * current.length);
                                                    const updated = current.map((p, i) => ({
                                                        ...p,
                                                        weight: equalWeight + (i < remainder ? 1 : 0),
                                                    }));
                                                    updateSetting('weightedPrompts', updated);
                                                }}
                                                className="px-3 py-1 rounded-full bg-white border border-white/70 text-xs hover:bg-white/90"
                                                title="Distribute weights evenly"
                                            >
                                                Auto-Balance
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const current = settings.weightedPrompts || [];
                                                const newPrompt = {
                                                    id: `prompt-${Date.now()}`,
                                                    content: '',
                                                    weight: current.length === 0 ? 100 : 0,
                                                };
                                                updateSetting('weightedPrompts', [...current, newPrompt]);
                                            }}
                                            className="px-3 py-1 rounded-full bg-black text-white text-xs"
                                        >
                                            + Add Prompt
                                        </button>
                                    </div>
                                </div>
                                
                                {settings.weightedPrompts && settings.weightedPrompts.length > 0 ? (
                                    <div className="space-y-3">
                                        {settings.weightedPrompts.map((prompt, index) => {
                                            const totalWeight = (settings.weightedPrompts || []).reduce((sum, p) => sum + p.weight, 0);
                                            const isValid = totalWeight === 100;
                                            
                                            return (
                                                <div key={prompt.id} className="rounded-2xl border border-white/70 bg-white/80 p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs uppercase tracking-[0.2em] text-secondary-light">
                                                            Prompt {index + 1}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={prompt.weight}
                                                                onChange={(e) => {
                                                                    const newWeight = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                                                    const updated = [...(settings.weightedPrompts || [])];
                                                                    updated[index] = { ...prompt, weight: newWeight };
                                                                    updateSetting('weightedPrompts', updated);
                                                                }}
                                                                className="w-20 px-2 py-1 rounded-full border border-white/70 bg-white text-sm text-center"
                                                            />
                                                            <span className="text-xs text-secondary-light">%</span>
                                                            <button
                                                                onClick={() => {
                                                                    const updated = (settings.weightedPrompts || []).filter(p => p.id !== prompt.id);
                                                                    // Redistribute weights if removing
                                                                    if (updated.length > 0 && updated.reduce((sum, p) => sum + p.weight, 0) !== 100) {
                                                                        const remainingWeight = updated.reduce((sum, p) => sum + p.weight, 0);
                                                                        const adjustment = (100 - remainingWeight) / updated.length;
                                                                        updated.forEach(p => {
                                                                            p.weight = Math.max(0, Math.min(100, p.weight + adjustment));
                                                                        });
                                                                    }
                                                                    updateSetting('weightedPrompts', updated);
                                                                }}
                                                                className="px-2 py-1 rounded-full bg-red-500/20 text-red-600 text-xs hover:bg-red-500/30"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        value={prompt.content}
                                                        onChange={(e) => {
                                                            const updated = [...(settings.weightedPrompts || [])];
                                                            updated[index] = { ...prompt, content: e.target.value };
                                                            updateSetting('weightedPrompts', updated);
                                                        }}
                                                        placeholder={`Enter prompt ${index + 1} content...`}
                                                        className="w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm min-h-[120px] resize-y"
                                                    />
                                                </div>
                                            );
                                        })}
                                        
                                        <div className={`rounded-2xl border p-3 text-xs ${
                                            (settings.weightedPrompts || []).reduce((sum, p) => sum + p.weight, 0) === 100
                                                ? 'border-green-500/50 bg-green-500/10 text-green-700'
                                                : 'border-red-500/50 bg-red-500/10 text-red-700'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <span>Total Weight:</span>
                                                <span className="font-semibold">
                                                    {(settings.weightedPrompts || []).reduce((sum, p) => sum + p.weight, 0)}%
                                                </span>
                                            </div>
                                            {(settings.weightedPrompts || []).reduce((sum, p) => sum + p.weight, 0) !== 100 && (
                                                <p className="mt-1">Weights must equal exactly 100%</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/50 p-4 text-center text-xs text-secondary-light">
                                        <p>No weighted prompts configured.</p>
                                        <p className="mt-1">Add prompts with weights that sum to 100%</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="rounded-2xl border border-dashed border-white/50 p-3 text-xs text-secondary-light">
                                Legacy single system prompt (deprecated - use weighted prompts above)
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">Auxiliary OpenRouter Key (optional)</label>
                                <div className="relative">
                                    <input
                                        type={showAuxKey ? 'text' : 'password'}
                                        value={settings.secondaryApiKey || ''}
                                        onChange={(e) => updateSetting('secondaryApiKey', e.target.value)}
                                        placeholder="sk-or-..."
                                        className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 pr-28"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAuxKey((prev) => !prev)}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-sm px-3 py-1 rounded-full bg-black text-white"
                                    >
                                        {showAuxKey ? 'Hide' : 'Reveal'}
                                    </button>
                                </div>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark">
                                    Use this for embeddings, experiments, or as a reserve key. Stored locally just like the primary key.
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">Audit API Key (Free Model)</label>
                                <div className="relative">
                                    <input
                                        type={showAuditKey ? 'text' : 'password'}
                                        value={settings.auditApiKey || ''}
                                        onChange={(e) => updateSetting('auditApiKey', e.target.value)}
                                        placeholder="sk-or-... (uses free polaris-alpha)"
                                        className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 pr-28"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAuditKey((prev) => !prev)}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-sm px-3 py-1 rounded-full bg-black text-white"
                                    >
                                        {showAuditKey ? 'Hide' : 'Reveal'}
                                    </button>
                                </div>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark">
                                    Optional key for the audit agent. Uses free openrouter/polaris-alpha model to periodically audit journal entries and catch missed entity extractions. Runs automatically when configured.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Primary Model</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 appearance-none"
                                        value={settings.mainModel || 'openrouter/polaris-alpha'}
                                        onChange={(e) => updateSetting('mainModel', e.target.value)}
                                    >
                                        {popularModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                    Max output tokens defaults to 128k for Polaris Alpha.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Backup Model</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 appearance-none"
                                        value={settings.backupModel || 'x-ai/grok-4-fast'}
                                        onChange={(e) => updateSetting('backupModel', e.target.value)}
                                    >
                                        {popularModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Embedding Model</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-3 rounded-2xl border border-white/70 bg-white/80 appearance-none"
                                        value={settings.embeddingModel || embeddingModels[0]}
                                        onChange={(e) => updateSetting('embeddingModel', e.target.value)}
                                    >
                                        {embeddingModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                    Used for memory search + post-processing visibility when we turn on embedding flows.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Audit Interval (minutes)</label>
                                <input
                                    type="number"
                                    min="15"
                                    max="1440"
                                    className="w-full p-3 rounded-2xl border border-white/70 bg-white/80"
                                    placeholder="60"
                                    value={settings.auditInterval || 60}
                                    onChange={(e) => updateSetting('auditInterval', parseInt(e.target.value) || 60)}
                                />
                                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                    How often the audit agent checks journal entries for missed entities (15-1440 minutes). Default: 60 minutes.
                                </p>
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-medium mb-2">
                                    <span>Temperature</span>
                                    <span className="text-secondary-light dark:text-secondary-dark">{settings.temperature ?? 0.7}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={settings.temperature ?? 0.7}
                                    onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-medium mb-2">
                                    <span>Max Output Tokens</span>
                                    <span className="text-secondary-light dark:text-secondary-dark">{settings.maxTokens ?? 128000}</span>
                                </label>
                                <input
                                    type="range"
                                    min="4000"
                                    max="128000"
                                    step="1000"
                                    value={settings.maxTokens ?? 128000}
                                    onChange={(e) => updateSetting('maxTokens', Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                    Keep it high for Polaris (128k), dial it down for smaller context models.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl space-y-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light dark:text-secondary-dark">Experimental</p>
                        <h2 className="text-xl font-semibold mt-1">Preflection</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            Dynamic instruction generation that analyzes context and generates query-specific system instructions. Each query receives tailored guidance optimized for its type and available context.
                        </p>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-gray-900/50">
                        <div className="flex-1">
                            <label htmlFor="preflectionEnabled" className="text-sm font-medium cursor-pointer">
                                Enable Preflection
                            </label>
                            <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                Analyzes each query, generates dynamic instructions, and primes the agent with context-specific guidance. Adds one extra API call per message.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="preflectionEnabled"
                                checked={settings.preflectionEnabled || false}
                                onChange={(e) => updateSetting('preflectionEnabled', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>
                </section>

                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl space-y-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light dark:text-secondary-dark">Status</p>
                        <h2 className="text-xl font-semibold mt-1">Local persistence</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            Threads, artifacts, and settings stay on-device via IndexedDB for true BYO-key privacy.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { title: 'Threads', detail: 'Conversation metadata + ordering live locally.' },
                            { title: 'Artifacts', detail: 'Per-thread documents sync directly to IndexedDB.' },
                            { title: 'Settings', detail: 'API prefs + keys never leave the browser.' },
                        ].map((item) => (
                            <div key={item.title} className="p-4 rounded-xl border border-white/70 dark:border-white/10 flex flex-col gap-2">
                                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                    <CheckIcon className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-base">{item.title}</h3>
                                <p className="text-sm text-secondary-light dark:text-secondary-dark">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl space-y-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light dark:text-secondary-dark">Personalization</p>
                        <h2 className="text-xl font-semibold mt-1">Appearance</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            Customize how Polaris looks and feels.
                        </p>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-gray-900/50">
                        <div className="flex-1">
                            <label className="text-sm font-medium">Dark Mode</label>
                            <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                                Toggle between light and dark themes
                            </p>
                        </div>
                        <DarkModeToggle />
                    </div>
                </section>

                {/* Insights Dashboard */}
                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl space-y-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light dark:text-secondary-dark">Analytics</p>
                        <h2 className="text-xl font-semibold mt-1">Your Insights</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            Track your activity, progress, and streaks.
                        </p>
                    </div>
                    <InsightsDashboard />
                </section>

                {/* Data Management Section */}
                <section className="glass-panel rounded-[32px] border border-white/70 dark:border-white/10 p-6 shadow-xl space-y-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary-light dark:text-secondary-dark">Backup & Restore</p>
                        <h2 className="text-xl font-semibold mt-1">Data Management</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark">
                            Export your data for backup or import from a previous backup.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <button
                            onClick={async () => {
                                setIsExporting(true);
                                try {
                                    await downloadExport();
                                    success('Data exported successfully!');
                                } catch (err) {
                                    showError('Failed to export data');
                                } finally {
                                    setIsExporting(false);
                                }
                            }}
                            disabled={isExporting}
                            className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? 'Exporting...' : '📥 Export Data'}
                        </button>

                        <div>
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setIsImporting(true);
                                    try {
                                        const data = await parseImportFile(file);
                                        const result = await importData(data, { merge: true, overwrite: false });
                                        if (result.success) {
                                            success('Data imported successfully!');
                                            setTimeout(() => window.location.reload(), 1500);
                                        } else {
                                            showError(result.error || 'Failed to import data');
                                        }
                                    } catch (err) {
                                        showError('Invalid backup file');
                                    } finally {
                                        setIsImporting(false);
                                        if (importInputRef.current) {
                                            importInputRef.current.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => importInputRef.current?.click()}
                                disabled={isImporting}
                                className="w-full p-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? 'Importing...' : '📤 Import Data'}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-secondary-light dark:text-secondary-dark">
                        Import will merge new data with existing data. Existing records won't be overwritten.
                    </p>
                </section>

                {/* Clear Everything Section */}
                <section className="glass-panel rounded-[32px] border-2 border-red-200 dark:border-red-800 p-6 shadow-xl space-y-4 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-red-600 dark:text-red-400 font-bold">⚠️ DANGER ZONE</p>
                        <h2 className="text-xl font-semibold mt-1 text-red-700 dark:text-red-300">Clear Everything</h2>
                        <p className="text-sm text-secondary-light dark:text-secondary-dark mt-2">
                            This will permanently delete all your data: threads, messages, journal entries, calendar events, agenda items, people, clients, brand records, pomodoros, XP, and achievements. This action cannot be undone.
                        </p>
                    </div>

                    {!showClearConfirm ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-lg"
                            >
                                Clear All Data
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 border-2 border-red-300 dark:border-red-700">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-red-700 dark:text-red-300 mb-2">
                                        Are you absolutely sure?
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                        This will delete:
                                    </p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4 list-disc list-inside">
                                        <li>All threads and messages</li>
                                        <li>All journal entries</li>
                                        <li>All calendar events</li>
                                        <li>All agenda items</li>
                                        <li>All people, clients, and brand records</li>
                                        <li>All pomodoro sessions</li>
                                        <li>All XP and achievements</li>
                                        <li>All deliverables, goals, and other records</li>
                                    </ul>
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        This action is IRREVERSIBLE. Your settings (API keys, etc.) will be preserved unless you check the box below.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="clearSettings"
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <label htmlFor="clearSettings" className="text-sm text-gray-700 dark:text-gray-300">
                                    Also clear settings (API keys, prompts, etc.)
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        setIsClearing(true);
                                        try {
                                            const clearSettings = (document.getElementById('clearSettings') as HTMLInputElement)?.checked || false;
                                            await clearAllData(clearSettings);
                                            setShowClearConfirm(false);
                                            setIsClearing(false);
                                            // Reload the page to reset state
                                            window.location.reload();
                                        } catch (error) {
                                            console.error('Failed to clear data:', error);
                                            alert('Failed to clear data. Please try again.');
                                            setIsClearing(false);
                                        }
                                    }}
                                    disabled={isClearing}
                                    className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isClearing ? 'Clearing...' : 'Yes, Clear Everything'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowClearConfirm(false);
                                    }}
                                    disabled={isClearing}
                                    className="px-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default SettingsView;
