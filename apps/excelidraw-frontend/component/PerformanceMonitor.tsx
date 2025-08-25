import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  shapes: number;
  memory: number;
  renderTime: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    shapes: 0,
    memory: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateMetrics = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Get memory usage if available
        const memory = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0;

        setMetrics(prev => ({
          ...prev,
          fps,
          memory
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 z-50 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-50 hover:opacity-100 transition-opacity"
      >
        Show FPS
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps >= 50 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span>{metrics.memory}MB</span>
        </div>
        <div className="flex justify-between">
          <span>Shapes:</span>
          <span>{metrics.shapes}</span>
        </div>
        <div className="flex justify-between">
          <span>Render:</span>
          <span>{metrics.renderTime}ms</span>
        </div>
      </div>
    </div>
  );
}
