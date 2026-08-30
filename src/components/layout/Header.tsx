import Link from "next/link";

export function Header() {
  return (
    <header className="header">
      <div className="container-wide header-inner">
        <Link className="brand" href="/" aria-label="Cristian Oliveira — página inicial">
          <span className="brand-name">Cristian Oliveira</span>
          <span className="eyebrow">Private Real Estate</span>
        </Link>
        <nav className="nav" aria-label="Navegação principal">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/regioes">Regiões</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
        </nav>
      </div>
    </header>
  );
}
