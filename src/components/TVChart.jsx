import React, { useEffect, useRef, useId } from 'react';

export default function TVChart({ symbol, interval = 'D', theme = 'dark', height = 420, studies, timezone = 'Etc/UTC' }) {
  const id = useId().replace(/:/g, '');
  const containerId = `tv_${id}`;
  const widgetRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    function init() {
      if (cancelled) return;
      if (typeof window.TradingView === 'undefined') {
        if (retries++ < 30) setTimeout(init, 400);
        return;
      }
      try { if (widgetRef.current) widgetRef.current.remove(); } catch {}

      const tvTheme = theme === 'light' ? 'light' : 'dark';
      const bgColor = theme === 'light' ? '#ffffff' : '#080c14';
      const gridColor = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(30,45,69,0.4)';

      widgetRef.current = new window.TradingView.widget({
        container_id: containerId,
        autosize: true,
        symbol,
        interval,
        timezone,
        theme: tvTheme,
        style: '1',
        locale: 'en',
        toolbar_bg: theme === 'light' ? '#f8fafc' : '#0d1220',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: true,
        studies: studies || ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        withdateranges: true,
        details: true,
        hotlist: true,
        calendar: true,
        overrides: {
          'paneProperties.background': bgColor,
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': gridColor,
          'paneProperties.horzGridProperties.color': gridColor,
        },
      });
    }

    init();
    return () => {
      cancelled = true;
      try { if (widgetRef.current) widgetRef.current.remove(); } catch {}
      widgetRef.current = null;
    };
  }, [symbol, interval, theme, containerId]);

  return (
    <div className="chart-outer" style={{ height }}>
      <div id={containerId} className="tv-chart" style={{ height: '100%' }} />
    </div>
  );
}
