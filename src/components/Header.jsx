import LehengaLogo from "./LehengaLogo";
import NavMenu from "./NavMenu";

export default function Header({ active, onChange }) {
  return (
    // The outer bar extends under the iPhone notch / status bar (safe-area padding);
    // the inner row is the visible 64px header.
    <header className="header-safe sticky top-0 z-40 text-white app-header bg-gradient-to-r from-brand-dark via-brand to-brand-dark">
      <div className="relative h-16 px-4 flex items-center justify-center gap-3">
        <NavMenu active={active} onChange={onChange} />
        <LehengaLogo className="w-10 h-10 drop-shadow" />
        <h1 className="font-display text-[1.7rem] font-bold tracking-wide leading-none">
          Anokhi <span className="text-gold">Fabrics</span>
        </h1>
      </div>
    </header>
  );
}
