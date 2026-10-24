'use client';

import mermaid from 'mermaid';
import { useEffect, useId, useState } from 'react';

interface MermaidDiagramProps {
  markup: string;
}

export default function MermaidDiagram({ markup }: MermaidDiagramProps) {
  const diagramId = `architecture-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [renderError, setRenderError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'dark' });
    setRenderError(undefined);

    mermaid
      .render(diagramId, markup)
      .then(({ svg, bindFunctions }) => {
        if (!cancelled) {
          const container = document.getElementById(diagramId);
          if (container) {
            container.innerHTML = svg;
            bindFunctions?.(container);
          }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [diagramId, markup]);

  return (
    <div className="diagram">
      {renderError ? (
        <p className="error" role="alert">Could not render diagram: {renderError}</p>
      ) : (
        <div id={diagramId} aria-label="Mermaid architecture diagram" />
      )}
    </div>
  );
}
