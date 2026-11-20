import LehengaLogo from "./LehengaLogo";

export default function Header() {
  return (
    <header className="h-16 sticky top-0 z-40 px-4 flex items-center justify-center gap-3 text-white shadow-lg bg-gradient-to-r from-brand-dark via-brand to-brand-dark">
      <LehengaLogo className="w-10 h-10 drop-shadow" />
      <h1 className="text-xl font-extrabold tracking-wide">
        Anokhi <span className="text-gold">Fabrics</span>
      </h1>
    </header>
  );
}
