import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// --- Brand palette (hex) ---
const palette = {
  marigold: "#E59D2C",
  buff: "#F3D58D",
  pearl: "#EBDDC5",
  policeBlue: "#2E4365",
  citrineBrown: "#8A3B08",
};

// --- Mock data (fallback si Supabase no está configurado) ---
const MOCK_ENTRIES = [
  { id: "A-001", perro: "Lobo", fecha: "2025-10-12" },
  { id: "A-002", perro: "Mora", fecha: "2025-10-18" },
  { id: "A-003", perro: "Kira", fecha: "2025-10-21" },
  { id: "A-004", perro: "Thor", fecha: "2025-10-25" },
];

// --- Supabase client ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey && /^https?:\/\//.test(supabaseUrl)) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "Supabase no configurado o URL inválida. Se usarán datos mock. " +
      "Revisá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env.local"
  );
}

// --- Auth context: usuario + perfil (rol) ---
const AuthContext = React.createContext(null);

const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null); // { role, full_name }
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadProfile = async (userId) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = React.useMemo(
    () => ({ user, profile, loading }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Guards de rutas ---
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Shell>
        <p style={{ color: palette.citrineBrown }}>Cargando sesión...</p>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <section className="space-y-4 text-center">
          <h2
            className="text-2xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Iniciá sesión para continuar
          </h2>
          <p style={{ color: palette.citrineBrown }}>
            Esta página está disponible solo para usuarios autenticados.
          </p>
          <Button to="/" variant="primary">
            Ir al inicio de sesión
          </Button>
        </section>
      </Shell>
    );
  }

  return children;
};

const RequireAdmin = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Shell>
        <p style={{ color: palette.citrineBrown }}>Cargando sesión...</p>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <section className="space-y-4 text-center">
          <h2
            className="text-2xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Iniciá sesión para continuar
          </h2>
          <Button to="/" variant="primary">
            Ir al inicio de sesión
          </Button>
        </section>
      </Shell>
    );
  }

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) {
    return (
      <Shell>
        <section className="space-y-4 text-center">
          <h2
            className="text-2xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Acceso restringido
          </h2>
          <p style={{ color: palette.citrineBrown }}>
            Solo los usuarios con rol <strong>admin</strong> pueden crear
            nuevos perros.
          </p>
          <Button to="/home" variant="primary">
            Volver al inicio
          </Button>
        </section>
      </Shell>
    );
  }

  return children;
};

// --- UI primitives ---
const Button = ({ to, children, onClick, variant = "primary", type }) => {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-md transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: `${base} text-white`,
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
    <button
      type={type}
      className={variants[variant]}
      style={styleMap[variant]}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

const Shell = ({ children }) => {
  const { user } = useAuth() || {};

  return (
    <div
      className="min-h-screen w-screen"
      style={{
        background: `linear-gradient(160deg, ${palette.buff} 0%, ${palette.pearl} 40%, ${palette.marigold} 100%)`,
      }}
    >
      <div className="w-full px-4 md:px-8 py-8">
        <header className="flex items-center justify-between mb-8">
          <Link
            to={user ? "/home" : "/"}
            className="flex items-center gap-3 group"
          >
            <Logo size={40} />
            <span
              className="text-xl font-bold"
              style={{ color: palette.policeBlue }}
            >
              K-9 Smart Fetch
            </span>
          </Link>
          {user && supabase && (
            <button
              className="text-sm font-semibold px-3 py-1 rounded-full border"
              style={{
                borderColor: palette.policeBlue,
                color: palette.policeBlue,
              }}
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar sesión
            </button>
          )}
        </header>

        <main className="bg-white/70 backdrop-blur rounded-none md:rounded-3xl shadow-xl p-6 md:p-10 w-full">
          {children}
        </main>

        <footer
          className="mt-8 text-sm text-center"
          style={{ color: palette.policeBlue }}
        >
          © {new Date().getFullYear()} K-9 Smart Fetch
        </footer>
      </div>
    </div>
  );
};

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
    <span className="font-extrabold" style={{ fontSize: size * 0.35 }}>
      K9
    </span>
  </div>
);

// --- Página de inicio de sesión ---
const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  if (!supabase) {
    return (
      <Shell>
        <section className="space-y-6 max-w-md mx-auto flex flex-col items-center text-center">
          <Logo />
          <h1
            className="text-3xl font-extrabold"
            style={{ color: palette.policeBlue }}
          >
            K-9 Smart Fetch
          </h1>
          <p style={{ color: palette.citrineBrown }}>
            Supabase no está configurado correctamente. No se puede iniciar
            sesión.
          </p>
        </section>
      </Shell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // AuthProvider se encarga de redirigir cuando haya sesión
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <section className="space-y-6 max-w-md mx-auto flex flex-col items-center text-center">
        <Logo />
        <h1
          className="text-3xl font-extrabold"
          style={{ color: palette.policeBlue }}
        >
          Iniciar sesión
        </h1>
        <p style={{ color: palette.citrineBrown }}>
          Usá tu correo y contraseña de K-9 Smart Fetch.
        </p>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 w-full text-left">
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3 py-2 border"
              required
            />
          </div>

          <div className="pt-2 flex justify-center">
            <Button type="submit" variant="primary">
              {submitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </div>
        </form>
      </section>
    </Shell>
  );
};


// --- Home (después de iniciar sesión) ---
const Home = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <Shell>
      <section className="flex flex-col items-center text-center gap-6 md:gap-10">
        <Logo />
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
          style={{ color: palette.policeBlue }}
        >
          K-9 Smart Fetch
        </h1>
        <p
          className="max-w-2xl text-lg md:text-xl"
          style={{ color: palette.citrineBrown }}
        >
          Plataforma para administrar registros de sesiones y visualizar
          estadísticas generales de entrenamiento.
        </p>
        <div className="flex flex-col gap-3 mt-4">
          <Button to="/records" variant="primary">
            Acceder a registros individuales
          </Button>
          <Button to="/stats" variant="primary">
            Estadísticas generales
          </Button>
          {isAdmin && (
            <Button to="/dogs/new" variant="primary">
              Agregar un nuevo perro
            </Button>
          )}
        </div>
      </section>
    </Shell>
  );
};

/**
 * Records: lista de perros.
 */
const Records = () => {
  const navigate = useNavigate();
  const [dogs, setDogs] = React.useState([]);
  const [loading, setLoading] = React.useState(!!supabase);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (supabase) {
      (async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("dogs")
            .select(
              "id, dog_code, name, breed, sex, birthdate, notes, active, created_at"
            )
            .order("created_at", { ascending: false });

          if (error) throw error;
          setDogs(data || []);
        } catch (err) {
          console.error(err);
          setError(err.message || "Error al cargar perros desde Supabase");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      const mapped = MOCK_ENTRIES.map((e) => ({
        id: e.id,
        dog_code: e.id,
        name: e.perro,
        breed: null,
        sex: null,
        birthdate: null,
        notes: null,
        active: true,
        created_at: e.fecha,
      }));
      setDogs(mapped);
      setLoading(false);
    }
  }, []);

  return (
    <Shell>
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <h2
            className="text-3xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Registros individuales
          </h2>
        </div>
        <p style={{ color: palette.citrineBrown }}>
          Seleccioná un perro para ver sus detalles.
        </p>

        {loading && (
          <p style={{ color: palette.citrineBrown }}>Cargando perros…</p>
        )}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

        {!loading && !error && (
          <ul className="grid md:grid-cols-2 gap-4">
            {dogs.map((dog) => (
              <li key={dog.id}>
                <Link
                  to={`/records/${dog.id}`}
                  className="block rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    background: palette.pearl,
                    border: `2px solid ${palette.buff}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="text-lg font-semibold"
                        style={{ color: palette.policeBlue }}
                      >
                        {dog.name} {dog.dog_code ? `— ${dog.dog_code}` : ""}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: palette.citrineBrown }}
                      >
                        {dog.created_at
                          ? `Registrado: ${String(dog.created_at).slice(
                              0,
                              10
                            )}`
                          : "Fecha no disponible"}
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: palette.marigold }}
                    >
                      Ver ▶
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {dogs.length === 0 && (
              <li
                className="text-sm"
                style={{ color: palette.citrineBrown }}
              >
                No hay perros cargados aún.
              </li>
            )}
          </ul>
        )}
      </section>
    </Shell>
  );
};

/**
 * RecordDetail: detalle de un perro.
 */
const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dog, setDog] = React.useState(null);
  const [loading, setLoading] = React.useState(!!supabase);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (supabase) {
      (async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("dogs")
            .select(
              "id, dog_code, name, breed, sex, birthdate, notes, active, created_at"
            )
            .eq("id", id)
            .single();

          if (error) throw error;
          setDog(data);
        } catch (err) {
          console.error(err);
          setError(err.message || "Error al cargar el perro desde Supabase");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      const entry = MOCK_ENTRIES.find((e) => e.id === id);
      if (entry) {
        setDog({
          id: entry.id,
          dog_code: entry.id,
          name: entry.perro,
          breed: null,
          sex: null,
          birthdate: null,
          notes: null,
          active: true,
          created_at: entry.fecha,
        });
      }
      setLoading(false);
    }
  }, [id]);

  return (
    <Shell>
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <h2
            className="text-3xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Registro
          </h2>
        </div>

        {loading && (
          <p style={{ color: palette.citrineBrown }}>Cargando…</p>
        )}
        {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

        {dog ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div
              className="rounded-2xl p-5 shadow-md"
              style={{
                background: palette.pearl,
                border: `2px solid ${palette.buff}`,
              }}
            >
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: palette.policeBlue }}
              >
                Información básica
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">Nombre</dt>
                  <dd>{dog.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Código</dt>
                  <dd>{dog.dog_code || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Raza</dt>
                  <dd>{dog.breed || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Sexo</dt>
                  <dd>{dog.sex || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Nacimiento</dt>
                  <dd>{dog.birthdate || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Activo</dt>
                  <dd>{dog.active ? "Sí" : "No"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Registrado</dt>
                  <dd>
                    {dog.created_at
                      ? String(dog.created_at).slice(0, 10)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div
              className="rounded-2xl p-5 shadow-md"
              style={{
                background: palette.pearl,
                border: `2px solid ${palette.buff}`,
              }}
            >
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: palette.policeBlue }}
              >
                Notas
              </h3>
              <p style={{ color: palette.citrineBrown }}>
                {dog.notes || "Sin notas"}
              </p>
            </div>
          </div>
        ) : (
          !loading &&
          !error && (
            <p style={{ color: palette.citrineBrown }}>
              No encontramos el registro solicitado.
            </p>
          )
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
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <h2
            className="text-3xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Estadísticas generales
          </h2>
        </div>
        <p style={{ color: palette.citrineBrown }}>
          Esta página presentará un resumen estadístico de todos los registros.
          Por ahora es un placeholder con navegación lista.
        </p>
        <div
          className="rounded-2xl p-6 shadow-md"
          style={{
            background: palette.pearl,
            border: `2px solid ${palette.buff}`,
          }}
        >
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

const NewDog = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    dog_code: "",
    name: "",
    breed: "",
    sex: "",
    birthdate: "",
    notes: "",
    active: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  if (!supabase) {
    return (
      <Shell>
        <section className="space-y-6">
          <h2
            className="text-3xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Agregar un nuevo perro
          </h2>
          <p style={{ color: palette.citrineBrown }}>
            Supabase no está configurado correctamente. No se pueden guardar
            perros nuevos.
          </p>
        </section>
      </Shell>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.dog_code.trim() || !form.name.trim()) {
      setError("Los campos Código y Nombre son obligatorios.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        dog_code: form.dog_code.trim(),
        name: form.name.trim(),
        breed: form.breed.trim() || null,
        sex: form.sex.trim() || null,
        birthdate: form.birthdate || null,
        notes: form.notes.trim() || null,
        active: form.active,
      };

      const { data, error } = await supabase
        .from("dogs")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      navigate(`/records/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar el perro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <section className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <h2
            className="text-3xl font-bold"
            style={{ color: palette.policeBlue }}
          >
            Agregar un nuevo perro
          </h2>
        </div>

        <p style={{ color: palette.citrineBrown }}>
          Completá los datos del perro. Los campos marcados con * son
          obligatorios.
        </p>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Código del perro* (dog_code)
            </label>
            <input
              type="text"
              name="dog_code"
              value={form.dog_code}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Nombre* (name)
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Raza (breed)</label>
            <input
              type="text"
              name="breed"
              value={form.breed}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Sexo (sex)</label>
            <input
              type="text"
              name="sex"
              value={form.sex}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
              placeholder="M para macho / H para hembra"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Fecha de nacimiento (birthdate)
            </label>
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Notas (notes)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full rounded-xl px-3 py-2 border"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="font-medium">
              Activo para entrenamiento (active)
            </label>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary">
              {loading ? "Guardando..." : "Guardar perro"}
            </Button>
          </div>
        </form>
      </section>
    </Shell>
  );
};

// --- App (Router) ---
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/records"
            element={
              <RequireAuth>
                <Records />
              </RequireAuth>
            }
          />
          <Route
            path="/records/:id"
            element={
              <RequireAuth>
                <RecordDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/stats"
            element={
              <RequireAuth>
                <Stats />
              </RequireAuth>
            }
          />
          <Route
            path="/dogs/new"
            element={
              <RequireAdmin>
                <NewDog />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const NotFound = () => (
  <Shell>
    <div className="text-center space-y-4">
      <h2
        className="text-3xl font-bold"
        style={{ color: palette.policeBlue }}
      >
        Página no encontrada
      </h2>
      <p style={{ color: palette.citrineBrown }}>
        La ruta solicitada no existe.
      </p>
      <Button to="/" variant="primary">
        Volver al inicio
      </Button>
    </div>
  </Shell>
);
