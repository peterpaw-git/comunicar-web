#!/bin/bash
# Backup automatico dei dati Comunicar
# Eseguito via cron — mantiene gli ultimi 30 backup giornalieri

DATA_DIR="/opt/comunicar/backend/data"
BACKUP_DIR="/opt/comunicar/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
DEST="$BACKUP_DIR/$TIMESTAMP"

mkdir -p "$DEST"

# Copia solo i file critici (esclude conversations.json che è grande)
cp "$DATA_DIR/contacts.json"         "$DEST/" 2>/dev/null
cp "$DATA_DIR/selection_groups.json" "$DEST/" 2>/dev/null
cp "$DATA_DIR/users.json"            "$DEST/" 2>/dev/null
cp "$DATA_DIR/settings.json"         "$DEST/" 2>/dev/null

echo "$(date): Backup completato in $DEST" >> /opt/comunicar/backups/backup.log

# Rimuove i backup più vecchi di 30 giorni
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} + 2>/dev/null

exit 0
