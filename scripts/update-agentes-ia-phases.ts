import dotenv from 'dotenv';
import { storage } from '../server/storage';

// Cargar variables de entorno
dotenv.config();

async function updateAgentesIAPhases() {
  console.log('🚀 Actualizando fases de la sala Agentes IA...\n');
  
  try {
    // 1. Obtener la sala agentes-ia
    const room = await storage.getRoomBySlug('agentes-ia');
    if (!room) {
      console.error('❌ No se encontró la sala agentes-ia');
      return;
    }
    
    console.log(`✅ Sala encontrada: ${room.title} (${room.id})\n`);
    
    // 2. Obtener las fases existentes
    const existingPhases = await storage.getPhasesByRoom(room.id);
    console.log(`📋 Fases existentes: ${existingPhases.length}`);
    existingPhases.forEach(phase => {
      console.log(`  - Orden ${phase.order}: ${phase.title} (${phase.id})`);
    });
    console.log('');
    
    // 3. Corregir la fase con order 4 que fue actualizada incorrectamente
    const phase3 = existingPhases.find(p => p.order === 4 && p.title.includes('Trayectoria profesional especializada: Whatsapp'));
    if (phase3) {
      console.log(`🔄 Corrigiendo fase con order 4: "${phase3.title}"`);
      await storage.updatePhase(phase3.id, {
        title: 'Fase 3: De Cero a Agente'
      });
      console.log(`✅ Fase corregida\n`);
    }
    
    // 4. Actualizar Fase 4 (la que tiene order 5, que es "Fase 4: Optimización y Escalado")
    const phase4 = existingPhases.find(p => p.order === 5 && (p.title.includes('Fase 4: Optimización') || p.title.includes('Trayectoria profesional especializada: Whatsapp')));
    if (phase4) {
      console.log(`🔄 Actualizando Fase 4: "${phase4.title}"`);
      await storage.updatePhase(phase4.id, {
        title: 'Trayectoria profesional especializada: Whatsapp, Instagram y Telegram'
      });
      console.log(`✅ Fase 4 actualizada\n`);
    } else {
      console.log('⚠️  No se encontró la Fase 4 para actualizar\n');
    }
    
    // 5. Determinar el siguiente orden disponible
    const maxOrder = existingPhases.length > 0 
      ? Math.max(...existingPhases.map(p => p.order))
      : 0;
    
    // 6. Obtener fases actualizadas después de las correcciones
    const updatedPhases = await storage.getPhasesByRoom(room.id);
    const updatedMaxOrder = updatedPhases.length > 0 
      ? Math.max(...updatedPhases.map(p => p.order))
      : 0;
    
    // 7. Crear las nuevas fases (solo si no existen)
    const now = new Date();
    const newPhasesTitles = [
      'Trayectoria profesional especializada: casos prácticos Agentes comerciales',
      'IA aplicada en áreas',
      'Infraestructura y datos',
    ];
    
    console.log('📝 Verificando y creando nuevas fases...\n');
    for (let i = 0; i < newPhasesTitles.length; i++) {
      const title = newPhasesTitles[i];
      // Verificar si la fase ya existe
      const existingPhase = updatedPhases.find(p => p.title === title);
      if (existingPhase) {
        console.log(`⏭️  Ya existe: Orden ${existingPhase.order} - ${title}`);
      } else {
        const newPhase = await storage.createPhase({
          roomId: room.id,
          title: title,
          description: null,
          order: updatedMaxOrder + 1 + i,
          releaseDate: now,
          metadata: {},
        });
        console.log(`✅ Creada: Orden ${newPhase.order} - ${newPhase.title} (${newPhase.id})`);
      }
    }
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
    
    // 8. Mostrar resumen final
    const finalPhases = await storage.getPhasesByRoom(room.id);
    console.log('\n📋 Resumen final de fases:');
    finalPhases.forEach(phase => {
      console.log(`  ${phase.order}. ${phase.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Ejecutar el script
updateAgentesIAPhases()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

