type Props = {
  search: string;
  setSearch: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  nationality: string;
  setNationality: (v: string) => void;
  positions: string[];
  nationalities: string[];
};

export default function FilterBar({
  search,
  setSearch,
  position,
  setPosition,
  nationality,
  setNationality,
  positions,
  nationalities,
}: Props) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Pesquisar</label>
            <input
              className="form-control"
              placeholder="Nome do atleta…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Posição</label>
            <select className="form-select" value={position} onChange={(e) => setPosition(e.target.value)}>
              <option value="">Todas</option>
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Nacionalidade</label>
            <select className="form-select" value={nationality} onChange={(e) => setNationality(e.target.value)}>
              <option value="">Todas</option>
              {nationalities.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
