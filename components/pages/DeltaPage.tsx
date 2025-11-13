import React, { useState, useEffect } from 'react';
import PageShell from './PageShell';
import {
  Activity,
  Lock,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  Database,
  GitBranch,
  Layers
} from 'lucide-react';

const DeltaPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'overview' | 'locks' | 'strategies' | 'hazards'>('overview');

  // Mock data for demonstration
  const stats = {
    totalStrategies: 12,
    e0Strategies: 8,
    e1Strategies: 5,
    e2Strategies: 3,
    e3Strategies: 2,
    e4Strategies: 1,
    potentialStrategies: 8,
    actualizedStrategies: 3,
    deployedStrategies: 2,
    avgDeltaH: 0.25,
    avgLowScore: 0.15,
  };

  const mockLocks = [
    {
      id: 'BTC-ETH-1:1',
      a: 'BTC',
      b: 'ETH',
      p: 1,
      q: 1,
      eGate: 'E3' as const,
      padStatus: 'deployed' as const,
      deltaH: 0.35,
      complexity: 2,
      lowScore: 0.15,
    },
    {
      id: 'SPY-QQQ-1:2',
      a: 'SPY',
      b: 'QQQ',
      p: 1,
      q: 2,
      eGate: 'E2' as const,
      padStatus: 'actualized' as const,
      deltaH: 0.22,
      complexity: 3,
      lowScore: 0.12,
    },
    {
      id: 'AAPL-MSFT-2:3',
      a: 'AAPL',
      b: 'MSFT',
      p: 2,
      q: 3,
      eGate: 'E1' as const,
      padStatus: 'potential' as const,
      deltaH: 0.15,
      complexity: 5,
      lowScore: -0.35,
    },
  ];

  const getEGateColor = (eGate: string) => {
    const colors: Record<string, string> = {
      'E0': 'bg-gray-100 text-gray-700 border-gray-200',
      'E1': 'bg-blue-100 text-blue-700 border-blue-200',
      'E2': 'bg-purple-100 text-purple-700 border-purple-200',
      'E3': 'bg-green-100 text-green-700 border-green-200',
      'E4': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[eGate] || colors.E0;
  };

  const getPADColor = (status: string) => {
    const colors: Record<string, string> = {
      'potential': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'actualized': 'bg-blue-100 text-blue-700 border-blue-200',
      'deployed': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[status] || colors.potential;
  };

  return (
    <PageShell
      title="Delta Trading System"
      subtitle="Evidence-based trading with LOW constraint enforcement. We are the house, not the gambler."
    >
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-black">{stats.totalStrategies}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Total Strategies</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-black">{stats.e4Strategies}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">E4 Strategies</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-black">{stats.deployedStrategies}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Deployed</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-black">{stats.actualizedStrategies}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Actualized</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span className="text-2xl font-bold text-black">{stats.avgDeltaH.toFixed(2)}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Avg ΔH*</p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-pink-50 to-pink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-6 h-6 text-pink-600" />
            <span className="text-2xl font-bold text-black">{stats.avgLowScore.toFixed(2)}</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-600">Avg LOW Score</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedView === 'overview'
              ? 'bg-black text-white'
              : 'bg-white/80 border border-white/70 hover:bg-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('locks')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedView === 'locks'
              ? 'bg-black text-white'
              : 'bg-white/80 border border-white/70 hover:bg-white'
          }`}
        >
          Phase Locks
        </button>
        <button
          onClick={() => setSelectedView('strategies')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedView === 'strategies'
              ? 'bg-black text-white'
              : 'bg-white/80 border border-white/70 hover:bg-white'
          }`}
        >
          Strategies
        </button>
        <button
          onClick={() => setSelectedView('hazards')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedView === 'hazards'
              ? 'bg-black text-white'
              : 'bg-white/80 border border-white/70 hover:bg-white'
          }`}
        >
          Hazards
        </button>
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Philosophy Card */}
          <div className="glass-panel rounded-3xl border border-white/70 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Delta Trading Philosophy
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <strong className="text-black">We are the house, not the gambler</strong>
                  <p className="text-secondary-light">Crisis protection over returns. Unbroken capital compounds forever.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div>
                  <strong className="text-black">LOW (Low-Order Wins)</strong>
                  <p className="text-secondary-light">Score = ΔH* - λ·Complexity. Prefer simple structures with exceptional evidence.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong className="text-black">Evidence-Based Deployment</strong>
                  <p className="text-secondary-light">No vibes, only E-tested strategies. E0 → E1 → E2 → E3 → E4.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong className="text-black">Hazard-Based Selection</strong>
                  <p className="text-secondary-light">h(t) = κ·ε·g·(1-ζ/ζ*)·u·p. Same decoder physics for LLM tokens and trades.</p>
                </div>
              </div>
            </div>
          </div>

          {/* E-Gates Progress */}
          <div className="glass-panel rounded-3xl border border-white/70 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6" />
              E-Gate Distribution
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {['E0', 'E1', 'E2', 'E3', 'E4'].map((gate, idx) => {
                const count = [stats.e0Strategies, stats.e1Strategies, stats.e2Strategies, stats.e3Strategies, stats.e4Strategies][idx];
                const maxCount = stats.e0Strategies;
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={gate} className="text-center">
                    <div className="mb-2">
                      <div className="text-2xl font-bold text-black">{count}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-secondary-light">{gate}</div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Locks View */}
      {selectedView === 'locks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-6 h-6" />
              Phase Locks
            </h3>
            <span className="text-sm text-secondary-light">{mockLocks.length} detected</span>
          </div>

          {mockLocks.map(lock => (
            <div
              key={lock.id}
              className="glass-panel rounded-3xl border border-white/70 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-black mb-2">{lock.id}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getEGateColor(lock.eGate)}`}>
                      {lock.eGate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getPADColor(lock.padStatus)}`}>
                      {lock.padStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-black">{lock.p}:{lock.q}</div>
                  <div className="text-xs text-secondary-light">Lock Ratio</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-1">ΔH* Evidence</div>
                  <div className="text-lg font-bold text-black">{lock.deltaH.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-1">Complexity</div>
                  <div className="text-lg font-bold text-black">{lock.complexity}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-secondary-light mb-1">LOW Score</div>
                  <div className={`text-lg font-bold ${lock.lowScore >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {lock.lowScore >= 0 ? '✓' : '✗'} {lock.lowScore.toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-xs text-secondary-light">
                  Assets: <span className="font-semibold text-black">{lock.a}</span> ↔ <span className="font-semibold text-black">{lock.b}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategies View */}
      {selectedView === 'strategies' && (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <GitBranch className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Strategies Module</h3>
          <p className="text-secondary-light">
            Strategy management will be implemented here. This will show actualized and deployed strategies with their evidence scores.
          </p>
        </div>
      )}

      {/* Hazards View */}
      {selectedView === 'hazards' && (
        <div className="glass-panel rounded-3xl border border-white/70 p-12 text-center">
          <div className="flex justify-center mb-4">
            <BarChart3 className="w-16 h-16 text-secondary-light" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Trade Hazards</h3>
          <p className="text-secondary-light">
            VBC (Variable Barrier Controller) hazard analysis will be displayed here. Shows ranked trade candidates by hazard score.
          </p>
        </div>
      )}
    </PageShell>
  );
};

export default DeltaPage;
