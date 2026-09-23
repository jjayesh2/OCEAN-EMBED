import React, { useState, useEffect, useCallback } from 'react';
import { PrimaryView, OceanRegion, StandardDepth, OceanSurfaceState, ModelInferencePackage } from './types/ocean';
import { glorysAdapterInstance } from './data/adapter/GlorysAdapter';
import { activeOceanModel } from './model/oceanModel';

import { Header } from './components/layout/Header';
import { OceanMonitorView } from './components/monitor/OceanMonitorView';
import { ReconstructionView } from './components/reconstruction/ReconstructionView';
import { ValidationView } from './components/validation/ValidationView';
import { MethodView } from './components/method/MethodView';

const DEFAULT_LAT = 12.5;
const DEFAULT_LON = 85.0;
const DEFAULT_REGION: OceanRegion = 'Bay of Bengal';
const DEFAULT_DATE = '2026-06-23';

export function App() {
  const [activeView, setActiveView] = useState<PrimaryView>('monitor');
  const [region, setRegion] = useState<OceanRegion>(DEFAULT_REGION);
  const [date] = useState<string>(DEFAULT_DATE);
  const [selectedLat, setSelectedLat] = useState<number>(DEFAULT_LAT);
  const [selectedLon, setSelectedLon] = useState<number>(DEFAULT_LON);
  const [selectedDepth, setSelectedDepth] = useState<StandardDepth>(100);
  const [activeLayer, setActiveLayer] = useState<string>('SST');
  const [surfaceState, setSurfaceState] = useState<OceanSurfaceState | null>(null);
  const [inferenceResult, setInferenceResult] = useState<ModelInferencePackage | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runStage, setRunStage] = useState('');

  // Compute surface state from GlorysAdapter whenever location changes
  useEffect(() => {
    const state = glorysAdapterInstance.getPointSurfaceState(selectedLat, selectedLon, region, date);
    setSurfaceState(state);
  }, [selectedLat, selectedLon, region, date]);

  // Run inference whenever surface state changes
  const runInference = useCallback(async (state: OceanSurfaceState) => {
    setIsRunning(true);
    setRunStage('Extracting surface features…');

    await new Promise(r => setTimeout(r, 180));
    setRunStage('Running OceanEmbed prototype inference…');

    await new Promise(r => setTimeout(r, 220));
    setRunStage('Evaluating physics consistency…');

    const glorysRef = glorysAdapterInstance.getReferenceProfile(state.lat, state.lon, date);
    const argoMatch = glorysAdapterInstance.findNearestArgoObservation(state.lat, state.lon, date, 350);

    await new Promise(r => setTimeout(r, 160));
    setRunStage('Matching ARGO observations…');

    const result = await activeOceanModel.predict(state, selectedDepth, glorysRef, argoMatch);

    setInferenceResult(result);
    setIsRunning(false);
    setRunStage('');
  }, [date, selectedDepth]);

  useEffect(() => {
    if (surfaceState) {
      runInference(surfaceState);
    }
  }, [surfaceState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectLocation = (lat: number, lon: number) => {
    const r: OceanRegion = lon < 78 ? 'Arabian Sea' : 'Bay of Bengal';
    setSelectedLat(lat);
    setSelectedLon(lon);
    setRegion(r);
  };

  const handleManualRun = async () => {
    if (surfaceState) {
      await runInference(surfaceState);
    }
  };

  const adapterMeta = glorysAdapterInstance.getMetadata();
  const availableVariables = glorysAdapterInstance.getAvailableVariables();
  const allArgoFloats = glorysAdapterInstance.getAllArgoObservations();

  return (
    <div className="min-h-screen bg-ocean-950 text-slate-100 flex flex-col font-sans antialiased">
      <Header
        activeView={activeView}
        onSetView={setActiveView}
        date={date}
        region={region}
        isRunning={isRunning}
        adapterMeta={adapterMeta}
      />

      <main className="flex-1 w-full">
        {activeView === 'monitor' && (
          <OceanMonitorView
            date={date}
            region={region}
            selectedLat={selectedLat}
            selectedLon={selectedLon}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            surfaceState={surfaceState}
            inferenceResult={inferenceResult}
            isRunning={isRunning}
            runStage={runStage}
            availableVariables={availableVariables}
            allArgoFloats={allArgoFloats}
            onSelectLocation={handleSelectLocation}
            onRunInference={handleManualRun}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'reconstruction' && (
          <ReconstructionView
            inferenceResult={inferenceResult}
            surfaceState={surfaceState}
            selectedDepth={selectedDepth}
            onSelectDepth={setSelectedDepth}
            isRunning={isRunning}
          />
        )}

        {activeView === 'validation' && (
          <ValidationView
            inferenceResult={inferenceResult}
            allArgoFloats={allArgoFloats}
            onSelectLocation={handleSelectLocation}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'method' && (
          <MethodView availableVariables={availableVariables} adapterMeta={adapterMeta} />
        )}
      </main>

      <footer className="border-t border-ocean-800/60 bg-ocean-950 py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">OceanEmbed</span>
            <span>·</span>
            <span>From Surface Signals to the Hidden Ocean</span>
          </div>
          <div className="text-[11px] text-slate-600 text-right">
            Research Prototype · GLORYS12V1 Copernicus · ARGO In-Situ · Northern Indian Ocean
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
