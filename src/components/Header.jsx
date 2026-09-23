import logo from "../assets/bansi-logo.png";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-center sticky top-0 z-40 shadow-sm">
      <img src={logo} alt="Bansi Fashion" className="h-10 object-contain" />
    </header>
  );
}
