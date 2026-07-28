import React, { useState } from 'react';
import { AlertTriangle, Bell, Volume2, VolumeX, X, ChevronRight, ShieldAlert, MapPin, Clock } from 'lucide-react';
import { EmergencyAlert } from '../types';
import { Language, UI_STRINGS } from '../i18n/translations';
import { getLocalizedField } from '../utils/i18nHelpers';

interface UrgentAlertsBarProps {
  language: Language;
  alerts: EmergencyAlert[];
  isOpenDrawer: boolean;
  onCloseDrawer: () => void;
  onSelectAlertLocation?: (neighborhood: string) => void;
}

export const UrgentAlertsBar: React.FC<UrgentAlertsBarProps> = ({
  language,
  alerts,
  isOpenDrawer,
  onCloseDrawer,
  onSelectAlertLocation,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const strings = UI_STRINGS[language] || UI_STRINGS.es;
  const activeAlerts = alerts.filter((a) => a.active);
  const criticalAlert = activeAlerts.find((a) => a.severity === 'critical') || activeAlerts[0];

  const criticalTitle = criticalAlert ? getLocalizedField(criticalAlert.title, language) : '';

  if (!criticalAlert && !isOpenDrawer) return null;

  return (
    <>
      {/* Top Ticker Banner if active alert exists */}
      {criticalAlert && !isOpenDrawer && (
        <div className="bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white border-l-4 border-red-600 border-b border-red-200 dark:border-red-900/60 px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs relative z-30">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black italic tracking-wider uppercase animate-pulse shrink-0">
                <AlertTriangle className="w-3 h-3 text-white" />
                !
              </span>
              <span className="font-bold text-red-700 dark:text-red-400 shrink-0 text-xs">📍 {criticalAlert.neighborhood}:</span>
              <p className="truncate text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm">{criticalTitle}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onCloseDrawer}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1 rounded transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>{strings.emergencyDetails}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Overlay */}
      {isOpenDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-slide-in">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{strings.emergencyBannerTitle}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{strings.spainEmergencies}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    soundEnabled
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={onCloseDrawer}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of Alerts */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{strings.noArticlesFound}</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const title = getLocalizedField(alert.title, language);
                  const summary = getLocalizedField(alert.summary, language);
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        alert.severity === 'critical'
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            alert.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {alert.type}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 leading-snug">
                        {title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                        {summary}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {alert.neighborhood}
                        </span>
                        {onSelectAlertLocation && (
                          <button
                            onClick={() => {
                              onSelectAlertLocation(alert.neighborhood);
                              onCloseDrawer();
                            }}
                            className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                          >
                            {strings.viewOnMap} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Emergency Call numbers */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-bold mb-2 text-slate-800 dark:text-slate-200">{strings.emergencyCenterTitle}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                {(strings.emergencyPhones || []).map((ep, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                    <span>{ep.name}: </span>
                    <span className="text-rose-600 font-black">{ep.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
