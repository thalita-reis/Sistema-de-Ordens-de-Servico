const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

class BackupService {
  constructor() {
    this.backupPath = path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  async realizarBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const filepath = path.join(this.backupPath, filename);

      const dbUrl = process.env.DATABASE_URL || 
        `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`;

      const command = `pg_dump ${dbUrl} > ${filepath}`;

      await execPromise(command);

      console.log(`Backup realizado com sucesso: ${filename}`);
      
      // Limpar backups antigos (manter últimos 30 dias)
      this.limparBackupsAntigos();

      return { success: true, filename };
    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      return { success: false, error: error.message };
    }
  }

  limparBackupsAntigos() {
    const diasParaManter = 30;
    const agora = Date.now();
    const tempoLimite = diasParaManter * 24 * 60 * 60 * 1000;

    fs.readdirSync(this.backupPath).forEach(file => {
      const filePath = path.join(this.backupPath, file);
      const stats = fs.statSync(filePath);
      
      if (agora - stats.mtime.getTime() > tempoLimite) {
        fs.unlinkSync(filePath);
        console.log(`Backup antigo removido: ${file}`);
      }
    });
  }

  iniciarBackupAutomatico() {
    // Agendar backup diário às 2:00 AM
    cron.schedule('0 2 * * *', () => {
      console.log('Iniciando backup automático...');
      this.realizarBackup();
    });

    console.log('Backup automático agendado para 2:00 AM diariamente');
  }
}

module.exports = new BackupService();