import LehengaLogo from "./LehengaLogo";

export default function Header() {
  return (
    <header className="h-16 sticky top-0 z-40 px-4 flex items-center justify-center gap-3 text-white app-header bg-gradient-to-r from-brand-dark via-brand to-brand-dark">
      <LehengaLogo className="w-10 h-10 drop-shadow" />
      <h1 className="font-display text-[1.7rem] font-bold tracking-wide leading-none">
        Anokhi <span className="text-gold">Fabrics</span>
      </h1>
    </header>
  );
}
