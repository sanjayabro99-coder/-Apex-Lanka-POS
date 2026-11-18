import React, { useState } from 'react';
import {
  X,
  Download,
  Laptop,
  CheckCircle,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  FileCode,
  HardDrive
} from 'lucide-react';
import { StoreSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onExportAllData: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
  onExportAllData,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'download' | 'exe'>('pwa');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const nativefierCommand = `npx nativefier --name "POS-Register" --icon icon.png "${currentUrl}"`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  // Download Windows batch launcher script
  const downloadBatchLauncher = () => {
    const batContent = `@echo off
title Windows POS Register Launcher
echo Launching POS Register...
start msedge --app="${currentUrl}" || start chrome --app="${currentUrl}" || start "" "${currentUrl}"
exit
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Launch-POS-Register.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Windows PC එකට Install කරගැනීම සහ Download</h3>
              <p className="text-xs text-slate-400">
                Install, Download & Desktop Setup for Windows Computer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'pwa'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>ක්‍රමය 1: PC එකට Standalone App එකක් ලෙස Install (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'download'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ක්‍රමය 2: Windows Shortcut & Backup බාගත කිරීම</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exe')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'exe'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>ක්‍රමය 3: සෘජු EXE ගොනුවක් (Standalone .exe)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-blue-950">
                    Windows PC සඳහා වඩාත්ම නිර්දේශිත සහ වේගවත්ම ක්‍රමය
                  </h4>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  මෙම මෘදුකාංගය <strong>Progressive Web App (PWA)</strong> තාක්ෂණයෙන් සමන්විත බැවින්, 
                  සාමාන්‍ය Windows මෘදුකාංගයක් (.exe) මෙන්ම ඔබගේ පරිගණකයේ <strong>Desktop Shortcut</strong> එකක් සහ <strong>Start Menu App</strong> එකක් ලෙස Install කරගත හැක.
                </p>

                {isInstalled ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2 font-semibold">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>මෙම මෘදුකාංගය දැනටමත් ඔබගේ Windows පරිගණකයේ Standalone App එකක් ලෙස ක්‍රියාත්මක වේ!</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <Download className="w-5 h-5" />
                    <span>දැන්ම Windows PC එකට Install කරන්න (Install App)</span>
                  </button>
                ) : (
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-slate-800">
                      ඔබගේ Chrome හෝ Microsoft Edge Browser එකෙන් Install කරගන්නේ කෙසේද:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                      <li>
                        බ්‍රවුසරයේ ඉහළ ලිපින තීරුවේ (URL Bar) දකුණු පස ඇති <strong>Install App (පරිගණක තිරයේ පහළට ඊතලයක් සහිත අයිකනය)</strong> ක්ලික් කරන්න.
                      </li>
                      <li>
                        නැතහොත් බ්‍රවුසරයේ ඉහළ දකුණු කෙලවරේ ඇති <strong>Menu තිත් 3 (...)</strong> ක්ලික් කර <strong>"Install POS Bill &amp; Change Calculator"</strong> හෝ <strong>"Apps &gt; Install this site as an app"</strong> තෝරන්න.
                      </li>
                      <li>
                        එවිට ඔබගේ Windows ඩෙස්ක්ටොප් එකට සෘජු අයිකනයක් (Desktop Icon) නිර්මාණය වන අතර අන්තර්ජාලය නොමැතිව වුවද (Offline) බාධාවකින් තොරව ක්‍රියා කරයි.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    නොබැඳිව (Offline) ක්‍රියා කිරීම
                  </h5>
                  <p className="text-[11px] text-slate-600">
                    වරක් Install කළ පසු අන්තර්ජාලය ක්‍රියා විරහිත වුවද බිල්පත් දැමීම, මිල ලැයිස්තුව වෙනස් කිරීම සහ මුද්‍රණය බාධාවකින් තොරව කළ හැක.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ස්ථිර දත්ත සුරැකීම
                  </h5>
                  <p className="text-[11px] text-slate-600">
                    ඔබ ඇතුලත් කරන වෙළඳසැල් විස්තර, දුරකථන අංක, පාරිභෝගික විස්තර සහ භාණ්ඩවල මිල ගණන් ඔබගේ පරිගණකයේ ස්ථිරව ගබඩා වේ.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Windows 1-Click Launcher &amp; දත්ත Backup බාගත කිරීම</span>
                </h4>
                <p className="text-slate-600">
                  පහත බොත්තම් මඟින් ඔබට මෙම පද්ධතිය ඩෙස්ක්ටොප් එකෙන් කෙලින්ම විවෘත කරන Windows Script එකක් හෝ සියලුම මිල ලැයිස්තු හා විකිණුම් දත්ත Backup ගොනුවක් බාගත කළ හැක.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Download Launcher Script */}
                  <button
                    type="button"
                    onClick={downloadBatchLauncher}
                    className="p-3 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-blue-700">
                        Launch-POS-Register.bat
                      </span>
                      <Download className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Windows ඩෙස්ක්ටොප් එකේ තබාගෙන double-click කර ක්ෂණිකව POS එක විවෘත කරගත හැකි Launcher Script එක බාගත කරන්න.
                    </p>
                  </button>

                  {/* Export All Data Backup */}
                  <button
                    type="button"
                    onClick={onExportAllData}
                    className="p-3 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 group-hover:text-emerald-700">
                        Backup-POS-Data.json
                      </span>
                      <HardDrive className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      වෙළඳසැල් නම, දුරකථන අංකය, පාරිභෝගිකයින්, භාණ්ඩ සහ මිල ගණන් සියල්ල ඇතුළත් සම්පූර්ණ දත්ත Backup එකක් බාගත කරන්න.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exe' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  <span>ස්වාධීන Windows .exe Setup ගොනුවක් සාදාගන්නා ආකාරය</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  ඔබට මෙම App එක වෙනත් පරිගණකවල Install කිරීමට හෝ සම්පූර්ණ Windows Desktop <strong>.exe</strong> ගොනුවක් සකසා ගැනීමට අවශ්‍ය නම්, 
                  පහත පියවර අනුගමනය කළ හැක:
                </p>

                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Windows Command Prompt (CMD) හි ධාවනය කරන්න:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(nativefierCommand)}
                      className="text-blue-400 hover:text-white flex items-center gap-1 font-sans text-xs"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd ? 'පිටපත් විය!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-400 select-all overflow-x-auto">
                    {nativefierCommand}
                  </div>
                </div>

                <div className="text-slate-700 space-y-1.5 pl-3 border-l-2 border-purple-400">
                  <p className="font-semibold text-slate-900">පියවර:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>ඔබගේ Windows පරිගණකයේ Command Prompt විවෘත කරන්න.</li>
                    <li>ඉහත කේතය (Code) Paste කර Enter ඔබන්න.</li>
                    <li>තත්පර 30කින් ඔබගේ පරිගණකයේ <strong>POS-Register-win32-x64</strong> නමින් ෆෝල්ඩරයක් සහ එහි <strong>POS-Register.exe</strong> නමින් සෘජු EXE ගොනුව සැකසේ.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-700 font-bold">
            Powered By Apex Lanka Solution
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
          >
            වසන්න (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
