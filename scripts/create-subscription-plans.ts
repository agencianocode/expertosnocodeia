import dotenv from 'dotenv';
import { storage } from '../server/storage';

// Cargar variables de entorno
dotenv.config();

async function createSubscriptionPlans() {
  console.log('🚀 Creando planes de suscripción...\n');
  
  // First, check existing plans
  const existingPlans = await storage.getAllSubscriptionPlans();
  console.log(`📋 Planes existentes: ${existingPlans.length}`);
  existingPlans.forEach(plan => {
    console.log(`  - ${plan.name} (${plan.id}): $${plan.price / 100}/${plan.billingInterval}`);
  });
  console.log('');

  const plans = [
    {
      name: 'FREE',
      displayName: 'Prueba Gratis',
      price: 0, // en centavos
      currency: 'USD',
      billingInterval: 'trial',
      trialDays: 14,
      features: [
        '5-10 casos de uso de IA',
        'Cursos de IA certificados para la industria seleccionada',
        'Guías diarias paso a paso',
        'Talleres semanales dirigidos por expertos (solo en vivo)',
        'Comunidad privada'
      ],
      limits: {
        aiUseCases: 10,
        guides: 50,
        workshops: 0 // solo en vivo
      }
    },
    {
      name: 'MENSUAL',
      displayName: 'Mensual',
      price: 3900, // $39.00 en centavos
      currency: 'USD',
      billingInterval: 'month',
      trialDays: 0,
      features: [
        'Acceso completo a la universidad',
        '300+ guías paso a paso',
        'Workshops en vivo semanales',
        'Comunidad privada',
        'Certificados de finalización',
        'Descuentos en herramientas'
      ],
      limits: {
        aiUseCases: -1, // ilimitado
        guides: -1,
        workshops: -1
      }
    },
    {
      name: 'ANUAL',
      displayName: 'Anual',
      price: 29900, // $299.00 en centavos
      currency: 'USD',
      billingInterval: 'year',
      trialDays: 0,
      features: [
        'Todo lo incluido en Mensual',
        '2 meses GRATIS',
        'Acceso prioritario a workshops',
        'Sesiones 1:1 mensuales',
        'Recursos exclusivos',
        'Garantía de 30 días'
      ],
      limits: {
        aiUseCases: -1, // ilimitado
        guides: -1,
        workshops: -1,
        monthlyOneOnOnes: 1
      }
    }
  ];

  for (const planData of plans) {
    try {
      // Verificar si el plan ya existe
      const existingPlan = await storage.getSubscriptionPlanByName(planData.name);
      
      if (existingPlan) {
        console.log(`⚠️  Plan "${planData.name}" ya existe. Actualizando...`);
        await storage.updateSubscriptionPlan(existingPlan.id, planData);
        console.log(`✅ Plan "${planData.name}" actualizado\n`);
      } else {
        const plan = await storage.createSubscriptionPlan(planData);
        console.log(`✅ Plan "${planData.name}" creado con ID: ${plan.id}\n`);
      }
    } catch (error: any) {
      console.error(`❌ Error creando plan "${planData.name}":`, error.message);
    }
  }

  console.log('✨ Proceso completado!');
  process.exit(0);
}

createSubscriptionPlans().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

