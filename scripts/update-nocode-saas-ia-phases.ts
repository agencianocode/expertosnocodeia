import dotenv from 'dotenv';
import { storage } from '../server/storage';

// Cargar variables de entorno
dotenv.config();

async function updateNoCodeSaasIaPhases() {
  console.log('🚀 Actualizando fases de la sala NoCode SaaS IA...\n');
  
  try {
    // 1. Obtener la sala nocode-saas-ia
    const room = await storage.getRoomBySlug('nocode-saas-ia');
    if (!room) {
      console.error('❌ No se encontró la sala nocode-saas-ia');
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
    
    // 3. Definir las fases que deben existir
    const targetPhases = [
      { order: 0, title: 'Comience aqui' },
      { order: 1, title: 'Fase 1 - Fundamentos Esenciales' },
      { order: 2, title: 'Fase 2 - Fundamentos y Ferramientas de Inteligencia Artificial' },
      { order: 3, title: 'Fase 3 - Fundamentos para el Desarrollo de Aplicaciones NoCode' },
      { order: 4, title: 'Fase 4 - Casos Esenciales NoCode + IA' },
      { order: 5, title: 'Fase 5: De Cero a SaaS NoCodeIA' },
      { order: 6, title: 'MicroSaaS' },
    ];
    
    const now = new Date();
    
    // 4. Procesar cada fase objetivo
    console.log('📝 Procesando fases...\n');
    
    for (const targetPhase of targetPhases) {
      // Buscar si existe una fase con el mismo orden
      const existingPhaseByOrder = existingPhases.find(p => p.order === targetPhase.order);
      
      // Buscar si existe una fase con el mismo título (por si cambió el orden)
      const existingPhaseByTitle = existingPhases.find(p => 
        p.title.toLowerCase().trim() === targetPhase.title.toLowerCase().trim()
      );
      
      if (existingPhaseByOrder) {
        // Si existe una fase con el mismo orden, actualizarla
        if (existingPhaseByOrder.title !== targetPhase.title) {
          console.log(`🔄 Actualizando orden ${targetPhase.order}: "${existingPhaseByOrder.title}" -> "${targetPhase.title}"`);
          await storage.updatePhase(existingPhaseByOrder.id, {
            title: targetPhase.title,
          });
          console.log(`✅ Fase actualizada\n`);
        } else {
          console.log(`✓ Ya existe correctamente: Orden ${targetPhase.order} - ${targetPhase.title}`);
        }
      } else if (existingPhaseByTitle) {
        // Si existe una fase con el mismo título pero diferente orden, actualizar el orden
        console.log(`🔄 Actualizando orden de "${targetPhase.title}": ${existingPhaseByTitle.order} -> ${targetPhase.order}`);
        await storage.updatePhase(existingPhaseByTitle.id, {
          order: targetPhase.order,
        });
        console.log(`✅ Orden actualizado\n`);
      } else {
        // Si no existe, crear la fase
        console.log(`➕ Creando nueva fase: Orden ${targetPhase.order} - ${targetPhase.title}`);
        const newPhase = await storage.createPhase({
          roomId: room.id,
          title: targetPhase.title,
          description: null,
          order: targetPhase.order,
          releaseDate: now,
          metadata: {},
        });
        console.log(`✅ Fase creada: ${newPhase.id}\n`);
      }
    }
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
    
    // 5. Mostrar resumen final
    const finalPhases = await storage.getPhasesByRoom(room.id);
    console.log('\n📋 Resumen final de fases:');
    finalPhases
      .sort((a, b) => a.order - b.order)
      .forEach(phase => {
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
updateNoCodeSaasIaPhases()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

