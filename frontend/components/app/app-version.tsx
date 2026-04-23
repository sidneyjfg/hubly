import { getBuildInfo } from "@/lib/build-info";

export function AppVersion() {
  const buildInfo = getBuildInfo();

  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Versão</p>
      <p className="mt-1 text-xs text-slate-300">{buildInfo.label}</p>
    </div>
  );
}
