import React, { useState } from 'react';
import { Cpu, Eye, GitBranch, Layers, Sparkles, Network, ArrowRight } from 'lucide-react';

type ArchKey = 'ViT' | 'CNN_AE' | 'FNO' | 'GNN' | 'Hybrid';

interface ArchDetail {
  name: string;
  fullName: string;
  type: string;
  mechanism: string;
  encoderBackbone: string;
  decoderMechanism: string;
  latentDim: number;
  parameters: string;
  advantage: string;
  lossFunction: string;
}

const ARCHITECTURES: Record<ArchKey, ArchDetail> = {
  ViT: {
    name: 'Vision Transformer (ViT)',
    fullName: 'Spatio-Temporal Ocean Vision Transformer (Patch-16)',
    type: 'Self-Attention / Multi-Head Transformer',
    mechanism: 'Partitions 2D surface observation rasters into 16×16 patches. Learns non-local spatial correlations across distant ocean basins (e.g. Indian Ocean Dipole teleconnections).',
    encoderBackbone: 'ViT-B/16 (12 Transformer blocks, 8 attention heads, 768 hidden dim)',
    decoderMechanism: 'Continuous depth-query cross-attention MLP decoder',
    latentDim: 32,
    parameters: '24.2M params',
    advantage: 'Captures planetary-scale teleconnections and long-range eddy interactions without spatial locality bottlenecks.',
    lossFunction: 'L_recon = MSE(T, T_glorys) + λ1·L_stability(N² ≥ 0) + λ2·L_attention_reg',
  },
  CNN_AE: {
    name: 'Spatial Autoencoder (CNN)',
    fullName: 'Multiscale ResNet-34 Ocean Autoencoder',
    type: 'Deep Convolutional Autoencoder',
    mechanism: 'Uses strided 2D convolutions with residual skip connections to compress high-frequency surface mesoscale features into a compact spatial bottleneck.',
    encoderBackbone: 'ResNet-34 Encoder (4 downsampling stages with residual bottlenecks)',
    decoderMechanism: 'Transposed conv upsampler + depth-conditional hypernetwork',
    latentDim: 16,
    parameters: '18.4M params',
    advantage: 'Fastest inference (<8ms per frame); highly sensitive to local coastal fronts and mesoscale eddies.',
    lossFunction: 'L_recon = L1(T) + L2(T) + λ·max(0, -dρ/dz)',
  },
  FNO: {
    name: 'Fourier Neural Operator (FNO)',
    fullName: '2D Spectral Fourier Neural Operator',
    type: 'Zero-Shot Super-Resolution Operator',
    mechanism: 'Computes spectral convolutions directly in the frequency domain using 2D Fast Fourier Transforms (FFT). Resolution-invariant representation.',
    encoderBackbone: 'FNO-2D (4 spectral Fourier layers, 16 modes truncated)',
    decoderMechanism: 'Continuous coordinate depth evaluation',
    latentDim: 24,
    parameters: '4.8M params',
    advantage: 'Extremely lightweight; mathematically grounded in continuous wave dynamics and geostrophic turbulence.',
    lossFunction: 'L_spectral = ||T_pred - T_ref||_H1 + λ·L_physics',
  },
  GNN: {
    name: 'Graph Neural Network (GNN)',
    fullName: 'MeshGraphNet over Ocean Circulation Topology',
    type: 'Geometric Deep Learning',
    mechanism: 'Represents the North Indian Ocean as an adaptive mesh where edges model geostrophic flow vectors (U, V) and boundary currents.',
    encoderBackbone: 'EdgeConv + Graph Attention (GATv2) with 6 message-passing layers',
    decoderMechanism: 'Node-level vertical depth expansion MLP',
    latentDim: 32,
    parameters: '12.1M params',
    advantage: 'Naturally respects complex irregular coastlines (India, Sri Lanka, Andaman Islands) without land-mask distortion.',
    lossFunction: 'L_graph = MSE_nodes + λ_divergence·||∇·u||²',
  },
  Hybrid: {
    name: 'Attention-Hybrid',
    fullName: 'CNN-Transformer Hybrid Encoder (ConvNeXt + Swin)',
    type: 'Hybrid Local-Global Representation',
    mechanism: 'Early convolutional stages extract fine-scale coastal currents and eddies; upper Swin Transformer layers model basin-wide stratification dynamics.',
    encoderBackbone: 'ConvNeXt-Tiny (local) + Swin-Transformer (global attention)',
    decoderMechanism: 'Implicit Neural Representation (INR) depth decoder',
    latentDim: 32,
    parameters: '28.6M params',
    advantage: 'State-of-the-art accuracy across both shallow coastal mixed layers and deep abyssal water columns.',
    lossFunction: 'L_hybrid = SmoothL1(T) + 0.1·L_UNESCO_EOS80 + 0.05·L_TCHP',
  },
};

export function SatelliteEmbeddingInspector() {
  const [selectedArch, setSelectedArch] = useState<ArchKey>('ViT');
  const [latentDim, setLatentDim] = useState<number>(32);

  const arch = ARCHITECTURES[selectedArch];

  // Simulated 32-D latent embedding vector
  const embeddingVector = Array.from({ length: latentDim }, (_, i) => {
    const phi = (i * Math.PI) / (latentDim / 4);
    const val = 0.5 * Math.sin(phi * 1.3) + 0.3 * Math.cos(phi * 2.1) + 0.2 * Math.sin(phi * 0.7);
    return Number(val.toFixed(3));
  });

  return (
    <div className="bg-ocean-900 border border-ocean-700 rounded-xl p-5 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ocean-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Cpu size={17} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Satellite Embedding & Deep Learning Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 normal-case">
                Representation Learning
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input: Multi-channel 2D satellite tensor <span className="font-mono text-cyan-300">[Batch, 5, 101, 241]</span> → Latent Space → 15-Depth Reconstruction
            </p>
          </div>
        </div>

        {/* Latent Dim Toggle */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-ocean-950 px-2.5 py-1 rounded border border-ocean-800">
          <span className="text-slate-500">Embedding Dim:</span>
          {[16, 32, 64].map(dim => (
            <button
              key={dim}
              onClick={() => setLatentDim(dim)}
              className={`px-2 py-0.5 rounded transition-colors ${
                latentDim === dim ? 'bg-cyan-500 text-ocean-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {dim}-D
            </button>
          ))}
        </div>
      </div>

      {/* Architecture Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ARCHITECTURES) as ArchKey[]).map(key => {
          const a = ARCHITECTURES[key];
          const active = selectedArch === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedArch(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                active
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md'
                  : 'bg-ocean-950/80 border-ocean-800 text-slate-300 hover:border-ocean-600'
              }`}
            >
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Selected Architecture Deep Dive Card */}
      <div className="bg-ocean-950/90 border border-ocean-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ocean-800/80 pb-2">
          <div>
            <div className="text-sm font-bold text-white">{arch.fullName}</div>
            <div className="text-[11px] text-cyan-400 font-mono">{arch.type} · {arch.parameters}</div>
          </div>
          <span className="text-[10px] font-mono bg-ocean-800 text-slate-300 px-2.5 py-1 rounded border border-ocean-700">
            Bottleneck: {latentDim}-dimensional latent vector
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{arch.mechanism}</p>

        {/* Pipeline Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
          <div className="bg-ocean-900/80 border border-ocean-800 rounded p-2.5 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase">Encoder Backbone</div>
            <div className="text-slate-200 text-[11px]">{arch.encoderBackbone}</div>
          </div>
          <div className="bg-ocean-900/80 border border-ocean-800 rounded p-2.5 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase">Depth Decoder Mechanism</div>
            <div className="text-slate-200 text-[11px]">{arch.decoderMechanism}</div>
          </div>
        </div>

        {/* Physics Loss Function */}
        <div className="bg-ocean-900/80 border border-ocean-800 rounded p-2.5 space-y-1 text-xs font-mono">
          <div className="text-slate-500 text-[10px] uppercase">Physics-Informed Optimization Loss Function</div>
          <div className="text-cyan-300 font-semibold text-[11px]">{arch.lossFunction}</div>
        </div>
      </div>

      {/* Latent Vector Visualization Bar */}
      <div className="bg-ocean-950/70 border border-ocean-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            Compact Latent Satellite Embedding Tensor (z):
          </span>
          <span className="text-cyan-300 font-bold">{latentDim} values</span>
        </div>

        {/* Heatmap strip of latent values */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {embeddingVector.map((val, idx) => {
            const intensity = Math.min(1, Math.abs(val));
            const bg = val >= 0
              ? `rgba(6, 182, 212, ${0.2 + intensity * 0.7})`
              : `rgba(239, 68, 68, ${0.2 + intensity * 0.7})`;
            return (
              <div
                key={idx}
                title={`Dim [${idx}]: ${val}`}
                className="flex-1 min-w-[14px] h-7 rounded text-[8px] font-mono flex items-center justify-center border border-ocean-800/80 cursor-default"
                style={{ backgroundColor: bg }}
              >
                <span className="text-white opacity-80">{val > 0 ? '+' : '-'}{Math.abs(val).toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>z[0] (Thermal heave proxy)</span>
          <span>z[{Math.floor(latentDim / 2)}] (Baroclinic mode)</span>
          <span>z[{latentDim - 1}] (Ekman shear)</span>
        </div>
      </div>
    </div>
  );
}
