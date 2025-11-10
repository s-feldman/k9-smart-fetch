import React from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

// --- Brand palette (hex) ---
const palette = {
  marigold: "#E59D2C",
  buff: "#F3D58D",
  pearl: "#EBDDC5",
  policeBlue: "#2E4365",
  citrineBrown: "#8A3B08",
};

// --- Mock data (replace with Supabase later) ---
const MOCK_ENTRIES = [
  { id: "A-001", perro: "Lobo", fecha: "2025-10-12" },
  { id: "A-002", perro: "Mora", fecha: "2025-10-18" },
  { id: "A-003", perro: "Kira", fecha: "2025-10-21" },
  { id: "A-004", perro: "Thor", fecha: "2025-10-25" },
];

// --- UI primitives ---
const Button = ({ to, children, onClick, variant = "primary" }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-md transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: `${base} text-white` ,
    ghost: `${base} border-2`,
  };

  const styleMap = {
    primary: {
      background: palette.policeBlue,
      borderColor: palette.policeBlue,
    },
    ghost: {
      background: "transparent",
      color: palette.policeBlue,
      borderColor: palette.policeBlue,
    },
  };

  const content = (
    <span className="flex items-center gap-2">
      {children}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={variants[variant]} style={styleMap[variant]}>
        {content}
      </Link>
    );
  }
  return (
    <button className={variants[variant]} style={styleMap[variant]} onClick={onClick}>
      {content}
    </button>
  );
};

const Shell = ({ children }) => (
  <div
    className="min-h-screen w-screen"
    style={{
      background: `linear-gradient(160deg, ${palette.buff} 0%, ${palette.pearl} 40%, ${palette.marigold} 100%)`,
    }}
  >
    {/* Full-width container */}
    <div className="w-full px-4 md:px-8 py-8">
      <header className="flex items-center justify-start mb-8">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo size={40} />
          <span className="text-xl font-bold" style={{ color: palette.policeBlue }}>K-9 Smart Fetch</span>
        </Link>
      </header>
      {/* Full-width main card */}
      <main className="bg-white/70 backdrop-blur rounded-none md:rounded-3xl shadow-xl p-6 md:p-10 w-full">
        {children}
      </main>
      <footer className="mt-8 text-sm text-center" style={{ color: palette.policeBlue }}>
        © {new Date().getFullYear()} K-9 Smart Fetch
      </footer>
    </div>
  </div>
);

// --- Logo ---
const Logo = ({ size = 120 }) => (
  <div
    aria-label="K-9 Smart Fetch logo"
    className="grid place-items-center rounded-full shadow-xl"
    style={{
      width: size,
      height: size,
      background: palette.policeBlue,
      color: "white",
      border: `6px solid ${palette.buff}`,
    }}
  >
    <span className="font-extrabold" style={{ fontSize: size * 0.35 }}>K9</span>
  </div>
);

// --- Pages ---
const Home = () => (
  <Shell>
    <section className="flex flex-col items-center text-center gap-6 md:gap-10">
      <Logo />
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: palette.policeBlue }}>
        K-9 Smart Fetch
      </h1>
      <p className="max-w-2xl text-lg md:text-xl" style={{ color: palette.citrineBrown }}>
        Plataforma para administrar registros de sesiones y visualizar estadísticas generales de entrenamiento.
      </p>
      <div className="flex flex-col gap-3 mt-4">
        <Button to="/records" variant="primary">Acceder a registros individuales</Button>
        <Button to="/stats" variant="primary">Estadísticas generales</Button>
      </div>
    </section>
  </Shell>
);

const Records = () => {
  const navigate = useNavigate();
  return (
    <Shell>
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
          <h2 className="text-3xl font-bold" style={{ color: palette.policeBlue }}>Registros individuales</h2>
        </div>
        <p style={{ color: palette.citrineBrown }}>Seleccioná un registro para ver sus detalles.</p>
        <ul className="grid md:grid-cols-2 gap-4">
          {MOCK_ENTRIES.map((e) => (
            <li key={e.id}>
              <Link
                to={`/records/${e.id}`}
                className="block rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow"
                style={{ background: palette.pearl, border: `2px solid ${palette.buff}` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold" style={{ color: palette.policeBlue }}>
                      #{e.id} — {e.perro}
                    </div>
                    <div className="text-sm" style={{ color: palette.citrineBrown }}>Fecha: {e.fecha}</div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: palette.marigold }}>Ver ▶</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
};

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = MOCK_ENTRIES.find((e) => e.id === id);

  return (
    <Shell>
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
          <h2 className="text-3xl font-bold" style={{ color: palette.policeBlue }}>
            Registro #{id}
          </h2>
        </div>
        {entry ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl p-5 shadow-md" style={{ background: palette.pearl, border: `2px solid ${palette.buff}` }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: palette.policeBlue }}>Información básica</h3>
              <dl className="space-y-2">
                <div className="flex justify-between"><dt className="font-medium">Perro</dt><dd>{entry.perro}</dd></div>
                <div className="flex justify-between"><dt className="font-medium">Fecha</dt><dd>{entry.fecha}</dd></div>
                <div className="flex justify-between"><dt className="font-medium">Origen</dt><dd>Supabase (pendiente)</dd></div>
              </dl>
            </div>
            <div className="rounded-2xl p-5 shadow-md" style={{ background: palette.pearl, border: `2px solid ${palette.buff}` }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: palette.policeBlue }}>Estadísticas (placeholder)</h3>
              <p style={{ color: palette.citrineBrown }}>
                Acá mostraremos gráficos y métricas del registro cuando conectemos la base de datos.
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: palette.citrineBrown }}>No encontramos el registro solicitado.</p>
        )}
      </section>
    </Shell>
  );
};

const Stats = () => {
  const navigate = useNavigate();
  return (
    <Shell>
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Volver</Button>
          <h2 className="text-3xl font-bold" style={{ color: palette.policeBlue }}>Estadísticas generales</h2>
        </div>
        <p style={{ color: palette.citrineBrown }}>
          Esta página presentará un resumen estadístico de todos los registros. Por ahora es un placeholder
          con navegación lista.
        </p>
        <div className="rounded-2xl p-6 shadow-md" style={{ background: palette.pearl, border: `2px solid ${palette.buff}` }}>
          <ul className="list-disc pl-6">
            <li>Conteos totales</li>
            <li>Distribuciones por perro / fecha</li>
            <li>Gráficos (cuando conectemos Supabase)</li>
          </ul>
        </div>
      </section>
    </Shell>
  );
};

// --- App (Router) ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/records" element={<Records />} />
        <Route path="/records/:id" element={<RecordDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const NotFound = () => (
  <Shell>
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold" style={{ color: palette.policeBlue }}>Página no encontrada</h2>
      <p style={{ color: palette.citrineBrown }}>La ruta solicitada no existe.</p>
      <Button to="/" variant="primary">Volver al inicio</Button>
    </div>
  </Shell>
);
