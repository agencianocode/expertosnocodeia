import dotenv from 'dotenv';
import { storage } from '../server/storage';

// Cargar variables de entorno
dotenv.config();

async function updateVibeCodingPhases() {
  console.log('🚀 Actualizando fases de la sala Vibe Coding...\n');
  
  try {
    // 1. Obtener la sala vibe-coding
    const room = await storage.getRoomBySlug('vibe-coding');
    if (!room) {
      console.error('❌ No se encontró la sala vibe-coding');
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
      { order: 0, title: 'Fase 0 - Comience por aqui' },
      { order: 1, title: 'Fase 1 - Fundamentos Esenciales' },
      { order: 2, title: 'Fase 2 - Lovable desde Cero' },
      { order: 3, title: 'Fase 3 - De Cero a App' },
      { order: 4, title: 'Supabase Principiante' },
      { order: 5, title: 'Supabase Intermedio' },
      { order: 6, title: 'Supabase Avanzado' },
      { order: 7, title: 'De Cero a App avanzada con Cursor' },
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
    
    // 5. Eliminar fases que no están en la lista objetivo (opcional - comentado por seguridad)
    // const targetOrders = new Set(targetPhases.map(p => p.order));
    // const phasesToDelete = existingPhases.filter(p => !targetOrders.has(p.order));
    // if (phasesToDelete.length > 0) {
    //   console.log('\n⚠️  Fases que no están en la lista objetivo:');
    //   phasesToDelete.forEach(phase => {
    //     console.log(`  - Orden ${phase.order}: ${phase.title} (${phase.id})`);
    //   });
    //   console.log('   (No se eliminarán automáticamente por seguridad)');
    // }
    
    console.log('\n✅ ¡Proceso completado exitosamente!');
    
    // 6. Mostrar resumen final
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
updateVibeCodingPhases()
  .then(() => {
    console.log('\n✨ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

