import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { readFileSync } from "fs";
import { join } from "path";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    const migrationFile = process.argv[2] || "0005_remove_general_channel.sql";
    console.log(`🔄 Ejecutando migración ${migrationFile}...`);
    
    // Read the migration file
    const migrationPath = join(process.cwd(), "migrations", migrationFile);
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    // Split by semicolons and execute each statement
    // Remove comments and split properly
    const lines = migrationSQL.split('\n');
    let currentStatement = '';
    const statements: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // If line ends with semicolon, it's a complete statement
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Encontradas ${statements.length} declaraciones SQL para ejecutar...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n▶️  Ejecutando declaración ${i + 1}/${statements.length}...`);
        try {
          await pool.query(statement);
          console.log(`✅ Declaración ${i + 1} ejecutada exitosamente`);
        } catch (error: any) {
          // Some errors are expected (like IF NOT EXISTS)
          if (error.message?.includes("already exists") || 
              error.message?.includes("duplicate") ||
              error.message?.includes("does not exist") && error.message?.includes("IF NOT EXISTS")) {
            console.log(`⚠️  Declaración ${i + 1} ya existe o no aplica (esto es normal): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error en declaración ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log("\n✅ Migración completada exitosamente!");
  } catch (error) {
    console.error("\n❌ Error ejecutando migración:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

