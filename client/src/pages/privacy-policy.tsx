import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    >
      <div className="container mx-auto max-w-3xl px-4 py-10 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-albert text-sm text-gray-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <header className="mb-12">
          <h1 className="font-sora text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Política de privacidad
          </h1>
          <p className="font-albert text-sm text-gray-400">
            Última actualización: febrero 2025
          </p>
        </header>

        <article className="font-albert text-[15px] text-gray-300 leading-relaxed space-y-8">
          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              1. Responsable del tratamiento
            </h2>
            <p>
              Expertos NoCode IA es el responsable del tratamiento de los datos
              personales que nos facilitas. Puedes contactarnos en
              soporte@expertosnocodeia.com para cualquier consulta sobre
              privacidad o ejercicio de derechos.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              2. Datos que recogemos
            </h2>
            <p className="mb-3">
              Recogemos los datos necesarios para prestar el servicio y mejorar
              tu experiencia:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-300">
              <li>Nombre y apellidos, correo electrónico y contraseña (cuenta)</li>
              <li>Datos de facturación y pago (procesados por proveedores de pago)</li>
              <li>Uso de la plataforma (cursos, progreso, preferencias)</li>
              <li>Comunicaciones con soporte y participación en la comunidad</li>
              <li>Datos técnicos (IP, tipo de navegador, cookies) para seguridad y análisis</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              3. Finalidad y base legal
            </h2>
            <p>
              Utilizamos tus datos para gestionar tu cuenta, el acceso a
              contenidos, la facturación, el soporte y las comunicaciones
              comerciales (con tu consentimiento cuando sea necesario). La base
              legal es la ejecución del contrato, el consentimiento y, en su caso,
              el interés legítimo (seguridad, mejora del servicio, analytics).
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              4. Cesiones y transferencias
            </h2>
            <p>
              Podemos compartir datos con proveedores que nos ayudan a operar la
              plataforma (hosting, pagos, email, analytics), siempre con
              garantías adecuadas. No vendemos tus datos personales a terceros.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              5. Conservación
            </h2>
            <p>
              Conservamos los datos mientras mantengas una cuenta activa y,
              después, el tiempo necesario para obligaciones legales, reclamaciones
              y auditoría. Los datos de facturación se conservan según la
              normativa fiscal aplicable.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              6. Tus derechos
            </h2>
            <p className="mb-3">
              Puedes ejercer los derechos de acceso, rectificación, supresión,
              limitación del tratamiento, portabilidad y oposición, así como
              presentar una reclamación ante la autoridad de control. Para ello
              escribe a soporte@expertosnocodeia.com indicando el derecho que
              deseas ejercer.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              7. Cookies y tecnologías similares
            </h2>
            <p>
              Utilizamos cookies y tecnologías similares para el funcionamiento
              del sitio, la autenticación, la preferencia de idioma y, con tu
              consentimiento, para análisis y publicidad. Puedes gestionar las
              preferencias de cookies en tu navegador.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              8. Cambios
            </h2>
            <p>
              Podemos actualizar esta política. Los cambios relevantes se
              comunicarán por correo o mediante un aviso en la plataforma. La
              fecha de última actualización se indica al inicio del documento.
            </p>
          </section>
        </article>

        <div className="mt-14 pt-8 border-t border-gray-700">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-albert text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
