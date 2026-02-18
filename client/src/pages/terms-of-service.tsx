import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            Condiciones de servicio
          </h1>
          <p className="font-albert text-sm text-gray-400">
            Última actualización: febrero 2025
          </p>
        </header>

        <article className="font-albert text-[15px] text-gray-300 leading-relaxed space-y-8">
          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              1. Aceptación
            </h2>
            <p>
              Al acceder o utilizar los servicios de Expertos NoCode IA
              (“plataforma”, “servicio”) aceptas estas condiciones de servicio.
              Si no estás de acuerdo, no utilices el servicio.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              2. Descripción del servicio
            </h2>
            <p>
              Expertos NoCode IA ofrece formación, comunidad y recursos
              relacionados con No Code e inteligencia artificial, incluyendo
              cursos, talleres, eventos y áreas de miembros. Nos reservamos el
              derecho de modificar, suspender o discontinuar partes del servicio
              con aviso previo cuando sea razonable.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              3. Cuenta y registro
            </h2>
            <p>
              Debes proporcionar información veraz y mantener la confidencialidad
              de tu contraseña. Eres responsable de toda la actividad en tu
              cuenta. Debes tener la edad mínima legal en tu país para contratar
              o contar con el consentimiento de un tutor.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              4. Precios y facturación
            </h2>
            <p>
              Los precios y condiciones de suscripción se muestran en la
              plataforma. El pago puede ser único o recurrente (mensual/anual).
              Las renovaciones se facturan automáticamente salvo cancelación. Los
              reembolsos se rigen por nuestra política de garantía (por ejemplo,
              garantía de 15 días cuando aplique) y por la normativa de consumo
              aplicable.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              5. Uso aceptable
            </h2>
            <p className="mb-3">
              Te comprometes a utilizar el servicio de forma lícita y respetuosa.
              No está permitido:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-300">
              <li>Compartir credenciales o dar acceso no autorizado al contenido</li>
              <li>Copiar, redistribuir o revender el material sin autorización</li>
              <li>Utilizar la plataforma para actividades ilegales o que vulneren derechos de terceros</li>
              <li>Realizar ingeniería inversa, scraping o sobrecargar los sistemas</li>
              <li>Acosar, insultar o discriminar a otros usuarios o al equipo</li>
            </ul>
            <p className="mt-3">
              El incumplimiento puede dar lugar a la suspensión o cancelación de
              la cuenta sin reembolso.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              6. Propiedad intelectual
            </h2>
            <p>
              Todo el contenido (cursos, textos, vídeos, diseños, marcas) es
              propiedad de Expertos NoCode IA o de sus licenciantes. Se te
              concede un acceso personal y no exclusivo para uso formativo durante
              la vigencia de tu suscripción. No se transfieren derechos de
              explotación comercial ni de distribución del material.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              7. Limitación de responsabilidad
            </h2>
            <p>
              El servicio se ofrece “tal cual”. En la medida permitida por la ley,
              no seremos responsables por daños indirectos, consecuentes o
              lucro cesante. Nuestra responsabilidad total se limita al importe
              pagado por ti en los últimos 12 meses por el servicio objeto del
              reclamo. No excluimos ni limitamos responsabilidad cuando la ley
              no lo permite.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              8. Cancelación y baja
            </h2>
            <p>
              Puedes cancelar tu suscripción en cualquier momento desde tu
              perfil o facturación. El acceso continuará hasta el final del
              periodo ya pagado. Nos reservamos el derecho de dar de baja
              cuentas que incumplan estas condiciones o por decisión comercial,
              con aviso cuando sea procedente.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              9. Ley aplicable y resolución de conflictos
            </h2>
            <p>
              Estas condiciones se rigen por la ley aplicable en el país desde
              el que operamos (o la que corresponda según tu residencia en
              materia de consumo). Cualquier disputa se intentará resolver de
              buena fe; en caso de litigio, los tribunales competentes serán los
              que correspondan según la ley aplicable.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-lg font-bold text-white mb-3">
              10. Contacto
            </h2>
            <p>
              Para preguntas sobre estas condiciones: soporte@expertosnocodeia.com.
              Para ejercicio de derechos de privacidad, consulta nuestra
              Política de privacidad.
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
