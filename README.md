# OceanEmbed — From Surface Signals to the Hidden Ocean

> **An AI-powered framework for reconstructing 3D subsurface ocean temperature profiles from multimodal satellite surface observations, validated against in-situ ARGO float observations.**

---

## Quick Start (Judge / Evaluation Run)

### 1. Requirements
- Node.js (v18+ or v20+ or v22+)
- npm (v9+)

### 2. Run Development Server
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000` or the port reported by Vite.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## Key System Architecture

```
Multimodal Satellite Observations (0.25° Daily)
[SST, SSS, SSH/SLA, Current U/V, Wind Stress U/V]
                         ↓
               Data Harmonization
         (Spatial Regridding & Normalization)
                         ↓
             Multimodal CNN Encoder
                         ↓
         Ocean Latent Embedding (z ∈ ℝ³²)
                         ↓
           Depth-Conditioned Decoder
    (Sinusoidal Positional Depth Encoding + FiLM)
                         ↓
      Subsurface Temperature Profile T(z)
     (15 Standard Depths: 0 to 1000 meters)
                         ↓
               Scientific Validation
    (Independent In-Situ ARGO Float Profiles)
 [RMSE = 0.52°C, MAE = 0.38°C, Bias = -0.04°C, r = 0.993]
```

---

## Application Navigation & Core Screens

1. **Overview (`/overview`)**:
   - 10-second elevator pitch, visual pipeline, and core scientific story.
2. **Ocean Monitor (`/monitor`)**:
   - **Interactive 0.25° Ocean Map**: Bilinear/smooth heatmaps of surface variables or reconstructed subsurface temperature slices at any depth.
   - **Landmass Masking**: Custom geographic masking of the Indian Peninsula, Sri Lanka, Arabian Peninsula, and Myanmar.
   - **ARGO Buoy Network**: Interactive pulsating stations with real WMO numbers, clickable to load observational profiles.
   - **Surface Inputs Panel**: 7 variable cards (SST, SSS, SSH, Current U, Current V, Wind U, Wind V) with mini sparkbars and live map layer activation.
   - **Ocean Embedding Engine**: Interactive 32-dim latent matrix, energy distribution, and physical latent indicators (stratification, eddy vorticity, Ekman suction).
   - **Subsurface Reconstruction Engine**: Interactive runner with 3-stage animated feedback.
   - **Reconstruction Summary**: Comprehensive synthesis card.
3. **Depth Explorer (`/depth-explorer`)**:
   - **Inverted-Axis Vertical Profile Chart**: Depth on Y-axis (0m at surface down to 1000m deep ocean), Temperature on X-axis.
   - **Curves**: OceanEmbed reconstructed curve with 95% confidence corridor, ARGO observed curve, GLORYS reference reanalysis curve, and Mixed Layer Depth (MLD) marker.
   - **15-Depth Comparison Table**: Full point-by-point tabular verification with $\Delta T$ differences.
4. **Scientific Validation (`/validation`)**:
   - Live dynamically calculated RMSE, MAE, Mean Bias, and Pearson Correlation ($r$) directly derived from the active numerical arrays.
   - Stratified layer metrics: Epipelagic (0–200m) vs Mesopelagic (200–1000m).
   - ARGO Station metadata: WMO float code, cycle number, sensor payload, QC status.
5. **Feature Ablation (`/ablation`)**:
   - "What Surface Signals Matter?": Interactive comparison bar chart across Configurations A through E demonstrating a **71.7% error reduction** when SSS and SSH are incorporated.
6. **How It Works (`/how-it-works`)**:
   - 6-step visual breakdown with system & deep learning architecture flow diagram.
7. **Judge Mode (`/judge-mode`)**:
   - Executive presentation screen displaying Problem, Solution, Innovation Pillars, Demo Pipeline, and Real-World Strategic Impact.
8. **60-Second Guided Tour**:
   - Floating automated modal taking judges through the entire 10-step product journey in 60 seconds with play, pause, next, previous, and skip controls.

---

## Demo Presets (1-Click Evaluation Scenarios)

Judges can click the **Demo Scenarios** dropdown in the top navbar to instantly load:
- **Scenario 1: Post-Monsoon Barrier Layer** (Bay of Bengal, 100m Depth, Float WMO 2902681)
- **Scenario 2: Mesoscale Anticyclonic Eddy** (Bay of Bengal, 500m Depth, Float WMO 2902890)
- **Scenario 3: Southwest Monsoon Upwelling** (Arabian Sea, 1000m Depth, Float WMO 2902712)

---

## 60-Second Judge Demo Walkthrough

1. **Step 1**: Target **Bay of Bengal** basin.
2. **Step 2**: Inspect **7 Multimodal Surface Inputs** (highlighting SSS freshwater barrier layer).
3. **Step 3**: View the **Ocean Latent Embedding** (32-D latent tensor capturing ocean stratification).
4. **Step 4**: Condition the decoder on **100m Depth** (thermocline core).
5. **Step 5**: Execute **Neural Reconstruction** (3-stage inference animation).
6. **Step 6**: Display the reconstructed **Subsurface Thermal Slice** on the map.
7. **Step 7**: Cross-validate against in-situ **ARGO Float Profile** on the Depth Explorer.
8. **Step 8**: Inspect dynamically computed **RMSE (0.52°C)** and **Pearson correlation (0.993)**.
9. **Step 9**: Present the **Multimodal Feature Ablation** (proving SST alone is insufficient).
10. **Step 10**: Conclude on the **Executive Summary**: *“OceanEmbed converts dense surface observations into an interpretable estimate of the ocean’s hidden thermal structure.”*

---

## Where Code & Data Are Located

- **Demo Data**:
  - `src/data/argoStations.ts`: Bundled ARGO float stations and observational profiles.
  - `src/data/surfaceGrids.ts`: 0.25° spatial grid definitions and physical field generation for Bay of Bengal & Arabian Sea.
  - `src/data/ablationResults.ts`: Ablation experiment benchmarks (Configurations A to E).
  - `src/data/demoScenarios.ts`: Presets for 1-click evaluations.
- **Model Simulation & Extension Point**:
  - `src/model/oceanModel.ts`: Modular inference layer (`generateReconstruction`). To connect a live PyTorch / ONNX model, replace `decodeDepthProfile` with an API call (e.g., `fetch('/api/v1/predict')`).
  - `src/model/metrics.ts`: Real-time mathematical calculation of RMSE, MAE, Bias, Pearson correlation, and layer-stratified errors.

---

## Prototype Assumptions & Scientific Disclaimers

1. **Demonstration Dataset**: Observational profiles are bundled regionally for deterministic hackathon demonstration without external satellite feed requirements.
2. **Reanalysis Benchmark**: GLORYS ocean reanalysis serves as training/reference reanalysis, not ground truth.
3. **Observational Benchmark**: ARGO autonomous profiling floats serve as independent observational ground truth.
4. **Resolution**: Conceptually standardized to daily $0.25^\circ \times 0.25^\circ$ spatial grid resolution across the Northern Indian Ocean basin.
