import dotenv from 'dotenv';
import { storage } from '../server/storage';

// Cargar variables de entorno
dotenv.config();

// Función para generar descripciones basadas en el título de la fase
function generateDescription(phaseTitle: string, roomSlug: string): string {
  const title = phaseTitle.toLowerCase();
  
  // Descripciones para Agentes IA
  if (roomSlug === 'agentes-ia') {
    if (title.includes('fase 0') || title.includes('comience') || title.includes('comienza')) {
      return 'Inicio del programa. Configura tu entorno y conoce la estructura del curso de Agentes IA.';
    }
    if (title.includes('fase 1') || title.includes('fundamentos') || title.includes('introducción')) {
      return 'Aprende los conceptos fundamentales de los Agentes de IA y cómo funcionan.';
    }
    if (title.includes('fase 2') || title.includes('creación') || title.includes('desarrollo')) {
      return 'Desarrolla tus primeros agentes de IA y aprende a implementarlos en proyectos reales.';
    }
    if (title.includes('fase 3') || title.includes('cero a agente')) {
      return 'Crea agentes completos desde cero, integrando múltiples herramientas y servicios.';
    }
    if (title.includes('fase 4') || title.includes('optimización') || title.includes('escalado')) {
      return 'Optimiza y escala tus agentes de IA para producción y casos de uso avanzados.';
    }
    if (title.includes('trayectoria') || title.includes('profesional')) {
      if (title.includes('whatsapp') || title.includes('instagram') || title.includes('telegram')) {
        return 'Especialización en agentes para plataformas de mensajería: WhatsApp, Instagram y Telegram.';
      }
      if (title.includes('comerciales') || title.includes('casos prácticos')) {
        return 'Casos prácticos y aplicaciones comerciales reales de agentes de IA.';
      }
    }
    if (title.includes('ia aplicada') || title.includes('áreas')) {
      return 'Aplicaciones de IA en diferentes áreas y sectores empresariales.';
    }
    if (title.includes('infraestructura') || title.includes('datos')) {
      return 'Infraestructura, almacenamiento y gestión de datos para agentes de IA.';
    }
  }
  
  // Descripciones para Vibe Coding
  if (roomSlug === 'vibe-coding') {
    if (title.includes('fase 0') || title.includes('comience')) {
      return 'Inicio del programa. Configura tu entorno de desarrollo y conoce la metodología Vibe Coding.';
    }
    if (title.includes('fase 1') || title.includes('fundamentos esenciales')) {
      return 'Aprende los fundamentos del desarrollo con IA y cómo multiplicar tu productividad como desarrollador.';
    }
    if (title.includes('fase 2') || title.includes('lovable')) {
      return 'Domina Lovable, una de las herramientas de código asistido por IA más populares del mercado.';
    }
    if (title.includes('fase 3') || title.includes('cero a app')) {
      return 'Crea aplicaciones completas desde cero utilizando herramientas de desarrollo asistido por IA.';
    }
    if (title.includes('supabase principiante')) {
      return 'Introducción a Supabase: bases de datos, autenticación y backend como servicio.';
    }
    if (title.includes('supabase intermedio')) {
      return 'Profundiza en Supabase: funciones serverless, almacenamiento y consultas avanzadas.';
    }
    if (title.includes('supabase avanzado')) {
      return 'Nivel avanzado de Supabase: optimización, seguridad y arquitectura de aplicaciones escalables.';
    }
    if (title.includes('cursor') || title.includes('avanzada')) {
      return 'Desarrollo avanzado con Cursor: técnicas profesionales y flujos de trabajo optimizados.';
    }
  }
  
  // Descripciones para NoCode SaaS IA
  if (roomSlug === 'nocode-saas-ia') {
    if (title.includes('fase 0') || title.includes('comience')) {
      return 'Inicio del programa. Conoce el ecosistema NoCode y cómo crear SaaS con IA.';
    }
    if (title.includes('fase 1') || title.includes('fundamentos')) {
      return 'Fundamentos de NoCode: plataformas, herramientas y conceptos esenciales para crear SaaS.';
    }
    if (title.includes('fase 2') || title.includes('desarrollo')) {
      return 'Desarrollo de aplicaciones NoCode: integraciones, automatizaciones y flujos de trabajo.';
    }
    if (title.includes('fase 3') || title.includes('avanzado')) {
      return 'Nivel avanzado: escalabilidad, monetización y optimización de tu SaaS NoCode.';
    }
    if (title.includes('ia') || title.includes('inteligencia artificial')) {
      return 'Integración de IA en aplicaciones NoCode: automatización inteligente y funcionalidades avanzadas.';
    }
  }
  
  // Descripción genérica si no coincide con ningún patrón
  return `Contenido especializado sobre ${phaseTitle.toLowerCase()}.`;
}

async function updatePhaseDescriptions() {
  console.log('🚀 Actualizando descripciones de fases para todas las salas...\n');
  
  const rooms = ['agentes-ia', 'vibe-coding', 'nocode-saas-ia'];
  
  try {
    for (const roomSlug of rooms) {
      console.log(`\n📚 Procesando sala: ${roomSlug}`);
      console.log('─'.repeat(50));
      
      // 1. Obtener la sala
      const room = await storage.getRoomBySlug(roomSlug);
      if (!room) {
        console.log(`⚠️  No se encontró la sala ${roomSlug}, saltando...`);
        continue;
      }
      
      console.log(`✅ Sala encontrada: ${room.title} (${room.id})\n`);
      
      // 2. Obtener todas las fases
      const phases = await storage.getPhasesByRoom(room.id);
      console.log(`📋 Fases encontradas: ${phases.length}\n`);
      
      if (phases.length === 0) {
        console.log('   No hay fases para actualizar.\n');
        continue;
      }
      
      // 3. Actualizar cada fase con su descripción
      for (const phase of phases) {
        const newDescription = generateDescription(phase.title, roomSlug);
        
        // Solo actualizar si la descripción es diferente
        if (phase.description !== newDescription) {
          console.log(`🔄 Actualizando: "${phase.title}"`);
          console.log(`   Orden: ${phase.order}`);
          console.log(`   Descripción anterior: ${phase.description || '(sin descripción)'}`);
          console.log(`   Nueva descripción: ${newDescription}`);
          
          await storage.updatePhase(phase.id, {
            description: newDescription,
          });
          
          console.log(`   ✅ Actualizada\n`);
        } else {
          console.log(`✓ Ya tiene descripción correcta: "${phase.title}"`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ¡Proceso completado exitosamente!');
    console.log('='.repeat(50));
    
    // 4. Mostrar resumen final
    console.log('\n📊 Resumen final por sala:\n');
    
    for (const roomSlug of rooms) {
      const room = await storage.getRoomBySlug(roomSlug);
      if (!room) continue;
      
      const phases = await storage.getPhasesByRoom(room.id);
      console.log(`\n${room.title} (${roomSlug}):`);
      phases
        .sort((a, b) => a.order - b.order)
        .forEach(phase => {
          console.log(`  ${phase.order}. ${phase.title}`);
          if (phase.description) {
            console.log(`     └─ ${phase.description}`);
          }
        });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Ejecutar el script
updatePhaseDescriptions()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

