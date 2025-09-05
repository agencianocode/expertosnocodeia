import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import MobileHeader from "@/components/layout/mobile-header";
import { ChevronDown, X, Info, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const categories = [
  { id: "mi-cuenta", label: "Mi cuenta y suscripción" },
  { id: "informacion", label: "Información de precios y facturación" },
  { id: "contenido", label: "Contenido y recursos" },
  { id: "gestion", label: "Gestión de equipos" },
  { id: "pruebas", label: "Pruebas y reembolsos" },
  { id: "talleres", label: "Talleres en vivo" },
];

const faqData = {
  "mi-cuenta": [
    {
      question: "¿Cómo elimino mi cuenta?",
      answer: "Para eliminar tu cuenta, ve a Configuración > Cuenta y selecciona 'Eliminar cuenta'. Ten en cuenta que esta acción es irreversible."
    },
    {
      question: "¿Dónde puedo encontrar la fecha en que mi suscripción se renovará?",
      answer: "Puedes encontrar la fecha de renovación en tu perfil, sección 'Mi suscripción' o en el email de confirmación que recibiste."
    },
    {
      question: "Si desactivo la renovación automática, ¿seguiré teniendo acceso al contenido de Expertos NoCode IA y a mis marcadores?",
      answer: "Las membresías en Expertos NoCode IA se facturan mensual o anualmente y tienen una vigencia de 30 días o un año. Durante este período, los miembros pueden acceder libremente a todos los materiales universitarios y recursos guardados mientras su membresía permanezca activa. Si su membresía no se renueva automáticamente y vence, perderá el acceso a los materiales universitarios hasta que la reactive."
    },
    {
      question: "¿Cómo reactivo mi cuenta?",
      answer: "¡Bienvenido de nuevo! Para reanudar tu suscripción a Expertos NoCode IA, simplemente inicia sesión en el panel de tu cuenta, ve a Facturación y Pagos y haz clic en la pestaña Suscripciones . Sigue las instrucciones para reactivar tu cuenta."
    },
    {
      question: "¿Puedo transferir mi membresía a otra persona antes de que expire?",
      answer: "No, las membresías son personales e intransferibles. Cada usuario debe tener su propia cuenta."
    },
    {
      question: "¿Mi membresía se renueva automáticamente?",
      answer: "Sí, todas las suscripciones se renuevan automáticamente. Puedes desactivar esta opción desde tu perfil."
    },
    {
      question: "¿Cómo puedo cambiar o actualizar mi correo electrónico principal?",
      answer: "Ve a tu perfil > Configuración > Información personal y actualiza tu correo electrónico desde ahí."
    },
    {
      question: "¿Cómo cancelo mi plan?",
      answer: "Puedes cancelar tu plan desde tu perfil > Suscripción > Cancelar suscripción. El acceso continuará hasta el final del periodo pagado."
    },
    {
      question: "¿Tiene alguna otra pregunta?",
      answer: "Si tienes alguna otra consulta, no dudes en contactarnos a través del formulario de contacto o escribiendo a soporte@expertosnocodeia.com"
    }
  ],
  "informacion": [
    {
      question: "¿Cómo descargo un recibo o factura de pago?",
      answer: "Para acceder y descargar su recibo o factura de los pagos realizados a Expertos NoCode IA, vaya a su perfil haciendo clic en su avatar en la esquina superior derecha. Una vez allí, diríjase a la sección 'Detalles de facturación' y luego 'Administrar facturación', donde podrá 'Descargar la última factura'."
    },
    {
      question: "¿Cómo cambio mi tarjeta de crédito registrada?",
      answer: "Actualizar la información de tu tarjeta de crédito para Expertos NoCode IA es sencillo:\n\n1) Inicie sesión en su cuenta\n2) Vaya al Panel de control de su cuenta\n3) Seleccione la sección 'Facturación' del menú\n4) Encuentre el área 'Métodos de pago'\n5) Haga clic en 'Agregar nuevo método de pago' para ingresar la información actualizada de su tarjeta de crédito"
    },
    {
      question: "Tengo un problema con el pago. ¿Cómo puedo obtener ayuda?",
      answer: "Si tiene dificultades con su pago, confirme que su tarjeta tenga fondos suficientes y que su banco permita transacciones de este tipo. Si el problema persiste, no dude en contactarnos a través del botón 'Contactar con soporte técnico' en esta página. ¡Estamos aquí para ayudarle!"
    },
    {
      question: "¿Ofrecen planes de financiación a plazos?",
      answer: "Actualmente ofrecemos planes anuales y mensuales. Si necesita un plan de pago personalizado para equipos o situaciones especiales, puede contactarnos a través del soporte técnico para evaluar opciones específicas."
    },
    {
      question: "¿Ofrecen planes de suscripción mensual?",
      answer: "Sí, ofrecemos tanto planes mensuales ($39/mes) como anuales ($299/año) para adaptarnos a diferentes necesidades. El plan anual incluye un descuento significativo comparado con el pago mensual."
    },
    {
      question: "¿Puedo debitar mi membresía de Expertos NoCode IA de mi empresa?",
      answer: "¡Por supuesto! Invertir en la membresía de Expertos NoCode IA beneficia tanto tu crecimiento profesional como el éxito de tu empresa. Muchos empleadores reconocen membresías como la nuestra como inversiones estratégicas que mejoran los resultados empresariales. Si su empresa acepta financiar su membresía, contáctenos para solicitar una factura empresarial."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Expertos NoCode IA acepta pagos con tarjeta de crédito (Visa, MasterCard, American Express) y transferencias bancarias. Todos los precios están expresados en dólares estadounidenses. Para solicitudes de facturas empresariales u otras consultas relacionadas con pagos, contáctenos a través del soporte técnico."
    },
    {
      question: "¿Cuánto cuesta Expertos NoCode IA?",
      answer: "Expertos NoCode IA ofrece planes flexibles:\n\n• Plan GRATIS: Prueba de 14 días\n• Plan MENSUAL: $39 USD/mes con acceso completo a nuestra biblioteca de contenido, guías NoCode, talleres y cursos\n• Plan ANUAL: $299 USD/año con descuento significativo\n\nTambién ofrecemos planes para equipos con precios personalizados."
    },
    {
      question: "Si hay varios asientos como parte de mi suscripción, ¿todos los asientos de mi suscripción se renovarán en la misma fecha?",
      answer: "Sí, si actualmente tiene una suscripción a un plan de equipo, todos los asientos se renovarán en la misma fecha de renovación para mantener la sincronización de facturación."
    },
    {
      question: "¿Hay algún costo adicional para asistir a los talleres en vivo?",
      answer: "Si es un miembro activo de Expertos NoCode IA, su suscripción le otorga acceso gratuito a nuestros talleres en vivo. Los talleres se realizan regularmente y las grabaciones están disponibles inmediatamente después. Los miembros pueden inscribirse en todos los talleres que deseen."
    },
    {
      question: "¿Puedo obtener un descuento?",
      answer: "Para membresías de equipo ofrecemos descuentos generosos dependiendo del número de asientos. Actualmente no ofrecemos descuentos para membresías individuales, pero realizamos eventos promocionales durante el año que le mantendremos informado."
    },
    {
      question: "¿Puedo utilizar esto como gasto empresarial?",
      answer: "¡Sí! Muchos de nuestros estudiantes incluyen el coste de nuestros cursos y membresías en el presupuesto de su empresa. Las habilidades NoCode e IA son inversiones estratégicas que generan valor empresarial tangible."
    },
    {
      question: "Quiero registrar a toda mi empresa. ¿Ofrecen precios para equipos?",
      answer: "Sí, ofrecemos descuentos para empresas que buscan membresías para equipos de más de 5 personas. Contáctenos a través del soporte técnico para solicitar información personalizada y configurar su plan empresarial."
    }
  ],
  "contenido": [
    {
      question: "¿Puedo solicitar cursos o guías específicos?",
      answer: "¡Por supuesto! Nuestros miembros solicitan temas específicos a través de la sección de comentarios de nuestra plataforma. Luego, revisamos todas las solicitudes y priorizamos los temas y casos prácticos más solicitados que sabemos que les gustarán a otros miembros. Muchas de nuestras guías más populares surgieron como sugerencias de nuestros miembros.\n\nTambién no dudes en solicitar tutoriales específicos a través del botón 'Contactar con soporte técnico' en esta página."
    },
    {
      question: "¿Ofrecen certificaciones que pueda agregar a mi currículum?",
      answer: "Sí, todos nuestros cursos incluyen certificaciones que puedes añadir a tu perfil de LinkedIn y a tu currículum. Estas certificaciones demuestran a los empleadores que tienes habilidades prácticas de implementación NoCode e IA que te distinguen de otros profesionales."
    },
    {
      question: "¿Qué es exactamente Expertos NoCode IA?",
      answer: "Expertos NoCode IA es una plataforma de aprendizaje integral diseñada específicamente para profesionales que desean implementar el NoCode y la IA en su trabajo diario. Combina cursos de certificación, guías diarias, talleres en vivo y una comunidad de pioneros en NoCode e IA para ayudarte a conectar con el entusiasmo por estas tecnologías y su implementación práctica."
    },
    {
      question: "Compartir y descargar contenido",
      answer: "Actualmente, Expertos NoCode IA no admite la descarga o el intercambio de contenido para uso sin conexión, ya que nuestra plataforma aún no incluye capacidades de visualización sin conexión.\n\nSi bien nuestros materiales son compatibles con dispositivos móviles y están diseñados para una visualización cómoda en pantallas más pequeñas, actualmente no ofrecemos una aplicación móvil dedicada que pueda permitir el acceso sin conexión.\n\nEstamos explorando activamente el desarrollo de una aplicación móvil nativa compatible con la visualización sin conexión. Entendemos el valor que esto podría aportar a nuestros usuarios y estamos entusiasmados con las posibles mejoras en este aspecto. ¡Manténganse al tanto de las novedades!"
    },
    {
      question: "¿Hay cursos que son un prerrequisito para otros?",
      answer: "No, ninguno de nuestros cursos requiere prerrequisitos, y obtendrás información inmediata de cualquier curso que elijas para comenzar. En Expertos NoCode IA, entendemos que los caminos de aprendizaje rara vez son lineales, por eso hemos estructurado nuestra oferta para abordar directamente tus necesidades profesionales actuales.\n\nSi eres nuevo en nuestra plataforma, te recomendamos comenzar con nuestro prestigioso Kit de inicio NoCode IA, diseñado para brindar una sólida comprensión básica del NoCode y la inteligencia artificial.\n\nYa sea que su objetivo sea dominar conceptos fundamentales, avanzar estratégicamente en su función, pasar de ser un colaborador individual a una posición de liderazgo o explorar temas especializados de NoCode e IA con mayor profundidad, nuestros cursos están diseñados para brindarle conocimiento práctico que genere impacto en su carrera y organización."
    },
    {
      question: "¿Qué tan avanzado es el contenido de Expertos NoCode IA?",
      answer: "No hay una fórmula mágica para lograr resultados significativos y destacar en tu trayectoria profesional. En Expertos NoCode IA, ofrecemos material práctico, directo y experto, diseñado para abordar directamente los desafíos reales que enfrentas en tu carrera.\n\nYa sea que esté incursionando en una nueva área, pasando de un rol de colaborador individual a uno de liderazgo o profundizando su experiencia en su disciplina actual, nuestro contenido le proporciona información práctica. Confiamos en que posee conocimientos fundamentales en su campo y nos enfocamos en ofrecer recursos rigurosos e impactantes.\n\nNuestro compromiso es guiarlo más allá de trucos temporales o consejos superficiales, permitiéndole invertir su tiempo sabiamente para lograr un crecimiento profesional duradero."
    },
    {
      question: "¿Qué curso es adecuado para mí?",
      answer: "En Expertos NoCode IA, ofrecemos itinerarios de aprendizaje personalizados, adaptados específicamente a tu nicho o sector de especialización. Elige cursos que se ajusten a tu trayectoria profesional, objetivos actuales y las oportunidades de crecimiento únicas de tu organización. Nuestros cursos están diseñados para ser independientes, lo que significa que puedes inscribirte en cualquier curso relevante para tus necesidades inmediatas sin preocuparte por los prerrequisitos.\n\nLos cursos de Expertos NoCode IA son ideales para profesionales que:\n\n• Experiencia especializada en el sector. Nuestros cursos específicos para cada sector capacitan a los profesionales para resolver desafíos específicos de su campo. Por ejemplo, si tienes una sólida formación en marketing, te recomendamos empezar con el curso de NoCode para Marketing, idealmente después del Kit de Inicio NoCode IA.\n\n• Colaborar estrechamente con las diferentes funciones de su organización. Nuestros cursos también son beneficiosos si su puesto implica interacción y colaboración frecuente con segmentos o equipos específicos de la industria.\n\nPor ejemplo, un gerente de ventas podría inscribirse en NoCode para marketing si a menudo coordina campañas con equipos de marketing, o un gerente de producto podría elegir nuestro curso de NoCode para empresas para mejorar su efectividad entre equipos en los procesos operativos.\n\n• Aspire a la innovación y el crecimiento interdisciplinarios. El crecimiento en el mercado actual suele exigir una amplia colaboración y un pensamiento interdisciplinario. Recomendamos encarecidamente a todos los profesionales que buscan mejorar su capacidad de innovación y crecimiento que consideren nuestros cursos diseñados específicamente para la excelencia interdisciplinaria.\n\n• Somos profesionales con experiencia que buscan desarrollar habilidades de liderazgo. Si estás asumiendo roles de liderazgo, pasando de puestos de colaborador individual a puestos gerenciales o buscando mejorar tus habilidades estratégicas, nuestros cursos especializados en liderazgo te capacitan para afrontar eficazmente los desafíos estratégicos de las empresas modernas."
    },
    {
      question: "¿Puedo ver el contenido sin conexión?",
      answer: "Actualmente, Expertos NoCode IA no permite la descarga ni la visualización sin conexión de nuestro contenido. Esta política nos ayuda a proteger nuestra propiedad intelectual y a evitar la distribución no autorizada. Si le preocupa acceder al contenido mientras viaja o sin conexión, le recomendamos explorar nuestro sitio web optimizado para dispositivos móviles para una experiencia en línea fluida."
    },
    {
      question: "¿Cuál es el compromiso de tiempo para todos los cursos de Expertos NoCode IA?",
      answer: "Todos los cursos de Expertos NoCode IA son programas concisos y altamente prácticos, diseñados para brindar un aprendizaje impactante rápidamente. Normalmente, puedes completar un curso en tan solo uno o dos días si dedicas tiempo específico. Con una dedicación promedio de unas 10 horas semanales, la mayoría de los participantes terminan el curso cómodamente en una semana, sin interrumpir su rutina laboral o personal habitual.\n\nSin embargo, sus resultados dependen en gran medida de su inversión. Cuanto más esfuerzo y participación activa dedique al curso, mayores serán los beneficios que usted y su organización recibirán.\n\nPara obtener resultados óptimos, recomendamos asignar al menos 10 horas cada semana, estructuradas aproximadamente de la siguiente manera:\n\n• 4 a 5 horas de participación activa con el contenido del curso.\n• 2 a 3 horas aplicando los métodos del curso directamente a sus propios proyectos.\n• 1 a 2 horas participando en debates interactivos, ya sea virtualmente o presencialmente.\n\nLos participantes que obtienen el mayor valor generalmente reservan tiempo adicional para:\n\n• Establecer redes con compañeros.\n• Discuta nuevos conocimientos con sus colegas.\n• Implementar y probar flujos de trabajo NoCode e IA prácticos de inmediato en su entorno profesional."
    },
    {
      question: "Comprender formatos de contenidos, guías, cursos y talleres.",
      answer: "Entendiendo nuestros formatos de contenido en Expertos NoCode IA\n\nEn Expertos NoCode IA, nos dedicamos a brindar experiencias de aprendizaje altamente prácticas y viables diseñadas específicamente para capacitarlo con flujos de trabajo NoCode e IA del mundo real.\n\nPara garantizar que cumplimos esta promesa, hemos desarrollado varios formatos que se adaptan directamente a sus preferencias de aprendizaje y necesidades profesionales únicas.\n\n¿Qué incluye nuestro nuevo formato de contenido?\n\n• Nuestras nuevas guías incluyen videoguías prácticas, paso a paso, que demuestran claramente cómo implementar flujos de trabajo NoCode e IA específicos. Cada guía incluye texto estructurado que define claramente el público objetivo, explica la importancia y el impacto de resolver el problema específico y detalla cada paso de implementación para lograr resultados concretos. Además, cada guía incluye un valioso consejo profesional para mejorar aún más su aplicación práctica.\n\n• Talleres especializados impartidos por expertos del sector. También ofrecemos talleres especializados donde expertos líderes de las principales empresas que desarrollan las herramientas NoCode e IA que utilizas a diario ofrecen tutoriales seleccionados y de alto nivel. Estos talleres te brindan acceso directo a información privilegiada y consejos prácticos que pueden impulsar tus proyectos profesionales de inmediato.\n\n• Cursos Estructurados para un Aprendizaje Integral. Ofrecemos cursos estructurados que combinan las mejores guías paso a paso y enseñanzas impartidas por expertos en un itinerario de aprendizaje claro y coherente. Este formato integral te garantiza el logro de tus objetivos educativos de forma eficiente y eficaz."
    },
    {
      question: "Tengo problemas para acceder a un taller, curso o guía en vivo. ¿Qué hago?",
      answer: "¡Le pedimos disculpas por cualquier inconveniente que esté experimentando al acceder al evento!\n\nContáctanos directamente a través del botón 'Contactar con soporte técnico' en esta página. Monitoreamos de cerca las consultas durante los eventos en vivo y te ayudaremos a acceder lo antes posible."
    },
    {
      question: "¿Expertos NoCode IA tiene cursos presenciales?",
      answer: "Lamentablemente no. Actualmente solo ofrecemos experiencias completamente virtuales en Expertos NoCode IA."
    },
    {
      question: "¿Puedo participar en un taller si no soy miembro de Expertos NoCode IA?",
      answer: "No. Para inscribirse en un taller o curso presencial, o acceder a las guías de Expertos NoCode IA, ahora se requiere una membresía activa. Ya no ofrecemos cursos individuales para comprar por separado. Para obtener más información sobre los cambios recientes en nuestra estructura de membresía, incluyendo cómo los cursos ahora son automáticamente accesibles para los miembros, consulte la sección de precios en nuestro sitio web."
    },
    {
      question: "¿Dónde puedo saber cuándo comienza el próximo taller en vivo?",
      answer: "Puedes explorar todos nuestros talleres en vivo en la pestaña 'Talleres'. Organizamos talleres semanales impartidos por expertos, lo que te brinda numerosas oportunidades para participar y aprender en tiempo real. También puedes consultar el Calendario de Expertos NoCode IA para ver todos los talleres, tanto actuales como pasados.\n\nPara no perderte los próximos talleres, activa tus notificaciones. Te avisaremos cuando se programen nuevos talleres, manteniéndote al tanto de las últimas novedades de Expertos NoCode IA."
    },
    {
      question: "No podré asistir a los eventos del curso en vivo debido a mi zona horaria. ¿Se graban los eventos?",
      answer: "¡Por supuesto! En Expertos NoCode IA, cada taller se graba y está disponible a los pocos minutos de finalizar. Si no puedes asistir al taller en vivo, puedes acceder fácilmente a la grabación directamente desde la pestaña 'Talleres' poco después de que finalice la sesión."
    }
  ],
  "gestion": [
    {
      question: "¿Puede mi equipo tener más de un administrador de planes? ¿Puedo cambiar de administrador de planes?",
      answer: "En el caso de la suscripción de Expertos NoCode IA, las responsabilidades de facturación solo pueden estar a cargo de una única persona, mientras que la gestión de las invitaciones al equipo se puede compartir entre varios miembros del equipo.\n\n• Coordinador de Facturación: Gestiona todos los asuntos relacionados con la facturación de la suscripción y supervisa las invitaciones del equipo. Solo puede haber un Coordinador de Facturación, y no es necesario que utilice una de las plazas disponibles de la suscripción.\n\n• Administrador del equipo: Responsable de gestionar las invitaciones del equipo, incluyendo la asignación de nuevos miembros a puestos disponibles o la eliminación de miembros existentes. Puede tener varios administradores de equipo, pero cada uno debe ocupar un puesto de suscripción.\n\n• Miembro del equipo: tiene acceso a suscripción, pero no tiene permiso para administrar la facturación ni las invitaciones.\n\nSi actualmente se desempeña como Coordinador de Facturación en Expertos NoCode IA y desea transferir esta función a otra persona o asignar administradores de equipo adicionales, contáctenos a través del botón 'Contactar con soporte técnico' en esta página. En su mensaje, indique claramente el nombre completo y la dirección de correo electrónico del nuevo Coordinador de Facturación."
    },
    {
      question: "Como administrador de plan, ¿cómo asigno un asiento?",
      answer: "Siga estos pasos para asignar asientos a su equipo en Expertos NoCode IA:\n\n1. Inicie sesión en su cuenta en la plataforma de Expertos NoCode IA.\n2. Vaya a la sección 'Miembros del equipo'.\n3. Seleccione la opción 'Administrar invitaciones'. Aquí tiene dos maneras de agregar miembros al equipo:\n   • Ingrese las direcciones de correo electrónico de los miembros del equipo que desea invitar en el campo 'Agregar nuevos usuarios', luego haga clic en 'Enviar invitaciones'.\n   • Alternativamente, haga clic en 'Copiar enlace de invitación' para generar un enlace para compartir, que puede enviar directamente a los miembros de su equipo.\n4. Una vez completado, los miembros de su equipo invitados recibirán una invitación por correo electrónico. Recuérdeles que acepten la invitación haciendo clic en el enlace incluido en el correo electrónico, en lugar de iniciar sesión directamente en sus cuentas."
    },
    {
      question: "¿Puedo agregar compañeros de equipo a mi membresía?",
      answer: "¡Por supuesto! La experiencia de Expertos NoCode IA cobra aún más importancia cuando los equipos colaboran.\n\nOfrecemos planes de equipo especialmente diseñados, que brindan a su equipo acceso integral a nuestros cursos en vivo y amplios recursos a pedido de NoCode e IA.\n\n¿Te interesa saber más? Explora nuestros planes de equipo contactando con el soporte técnico a través del botón 'Contactar con soporte técnico' en esta página."
    }
  ],
  "pruebas": [
    {
      question: "¿Ofrecen una prueba gratuita?",
      answer: "Sí, puedes registrarte para la prueba gratuita de 14 días y obtener acceso limitado a un nicho específico y su contenido NoCode e IA. Al actualizar a un plan de pago, se desbloqueará todo el contenido de Expertos NoCode IA."
    },
    {
      question: "¿Existe alguna garantía de reembolso o devolución de dinero?",
      answer: "No se realizan reembolsos por los productos de Expertos NoCode IA una vez adquiridos. No se realizan reembolsos por el acceso a los productos una vez adquiridos. Una vez procesada una suscripción recurrente, Expertos NoCode IA no se responsabilizará de reembolsos bajo ninguna circunstancia, a menos que la cancelación se realice antes de la fecha de inicio de la suscripción. Para obtener ayuda, contáctenos a través del botón 'Contactar con soporte técnico' en esta página."
    }
  ],
  "talleres": [
    {
      question: "¿Cuál es el formato de los talleres en vivo de Expertos NoCode IA?",
      answer: "En Expertos NoCode IA, todos los cursos se imparten completamente en línea, combinando contenido interactivo y autoguiado con atractivas sesiones en vivo. Estas sesiones en vivo, dirigidas por profesionales con amplia experiencia en el sector NoCode e IA, están diseñadas para ofrecer talleres prácticos y paso a paso que resuelven casos prácticos específicos para profesionales de diversos nichos."
    },
    {
      question: "¿Qué tan accesible es Expertos NoCode IA?",
      answer: "Expertos NoCode IA ofrece acceso global a todo su contenido, lo que permite a los estudiantes de cualquier lugar participar 24/7 a su conveniencia.\n\nEn cuanto a los talleres impartidos por expertos en directo: todas las sesiones se transmiten en directo y las grabaciones de cada taller están disponibles posteriormente.\n\nLas sesiones se programan principalmente entre la 1:00 p. m. y las 4:00 p. m., hora del Este, para dar cabida a participantes de distintas zonas horarias internacionales.\n\nInformación sobre el idioma: Actualmente, todos los cursos y sesiones en vivo se ofrecen exclusivamente en español. Lamentablemente, no disponemos de soporte para otros idiomas en este momento."
    }
  ]
};

export default function Support() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("mi-cuenta");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted:", contactForm);
    // Reset form and close dialog
    setContactForm({ name: "", email: "", subject: "", message: "" });
    setShowContactDialog(false);
    // Show success message (could be a toast)
    alert("¡Mensaje enviado con éxito! Te contactaremos pronto.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 bg-card border-r border-border"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <MobileHeader />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0 lg:ml-[250px]">
          {/* Header */}
          <div className="border-b border-border bg-background px-6 py-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Centro de soporte
                </h1>
                <p className="text-muted-foreground">
                  Encuentra respuestas a preguntas frecuentes o comunícate con nuestro equipo de soporte para obtener asistencia personalizada.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="shrink-0"
                onClick={() => setShowContactDialog(true)}
              >
                Contactar con soporte técnico
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Terms and Privacy Banner */}
        {showBanner && (
          <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Términos y política de privacidad actualizados
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-4 leading-relaxed">
                      Hemos actualizado nuestros Términos y Condiciones y nuestra Política de Privacidad, incluyendo un cambio importante en nuestra política de reembolsos, para proteger mejor tus datos y mejorar la transparencia. Los nuevos términos entrarán en vigencia el 12 de febrero de 2025.
                    </p>
                    <div className="flex gap-3">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Términos y condiciones
                      </Button>
                      <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950">
                        Política de privacidad
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBanner(false)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  📋 Preguntas frecuentes
                </h2>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground mb-4">Categorías</p>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? "bg-muted text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* FAQ Section */}
            <div className="space-y-4 mb-8">
              {faqData[selectedCategory as keyof typeof faqData]?.map((faq, index) => (
                <Collapsible key={index} open={openFAQ === index} onOpenChange={() => setOpenFAQ(openFAQ === index ? null : index)}>
                  <CollapsibleTrigger className="w-full">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground text-left">
                            {faq.question}
                          </h3>
                          <ChevronDown 
                            className={`h-5 w-5 text-muted-foreground transition-transform ${
                              openFAQ === index ? "rotate-180" : ""
                            }`} 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="pt-2 text-muted-foreground leading-relaxed whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )) || (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No hay preguntas frecuentes disponibles para esta categoría aún.</p>
                  <p className="text-sm mt-2">Puedes contactarnos directamente para cualquier consulta.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Contact Support Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
              <DialogTitle className="text-xl font-semibold text-foreground">
                Contactar con soporte técnico
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Formulario para contactar con el equipo de soporte técnico
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitContact} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Su nombre
              </label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                placeholder="Ingrese su nombre completo"
                required
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Su correo electrónico
              </label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                placeholder="tu.email@ejemplo.com"
                required
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sujeto
              </label>
              <Input
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                placeholder="¿Sobre qué es su consulta?"
                required
                className="bg-background border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mensaje
              </label>
              <Textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                placeholder="Por favor describa su problema o pregunta en detalle..."
                rows={5}
                required
                className="bg-background border-border resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Enviar mensaje
            </Button>
          </form>
        </DialogContent>
      </Dialog>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}