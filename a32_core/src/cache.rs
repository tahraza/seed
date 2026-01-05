/// Cache L1 Direct-Mapped
///
/// Organisation:
/// - 64 lignes de cache
/// - 16 octets par ligne (4 mots de 32 bits)
/// - Taille totale: 1 KB
///
/// Décomposition d'adresse (32 bits):
///   [31:10] Tag (22 bits)
///   [9:4]   Index (6 bits) = 64 lignes
///   [3:0]   Offset (4 bits) = 16 octets
///
/// Politique: Write-through (simplicité)

const CACHE_LINES: usize = 64;
const LINE_SIZE: usize = 16;  // 16 octets par ligne
const _TAG_BITS: usize = 22;  // Documentation only
const INDEX_BITS: usize = 6;
const OFFSET_BITS: usize = 4;

#[derive(Clone, Debug)]
pub struct CacheLine {
    pub valid: bool,
    pub tag: u32,
    pub data: [u8; LINE_SIZE],
}

impl CacheLine {
    pub fn new() -> Self {
        Self {
            valid: false,
            tag: 0,
            data: [0; LINE_SIZE],
        }
    }
}

#[derive(Clone, Debug)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub read_hits: u64,
    pub read_misses: u64,
    pub write_hits: u64,
    pub write_misses: u64,
}

impl CacheStats {
    pub fn new() -> Self {
        Self {
            hits: 0,
            misses: 0,
            read_hits: 0,
            read_misses: 0,
            write_hits: 0,
            write_misses: 0,
        }
    }

    pub fn hit_rate(&self) -> f64 {
        let total = self.hits + self.misses;
        if total == 0 {
            0.0
        } else {
            (self.hits as f64) / (total as f64) * 100.0
        }
    }
}

#[derive(Clone, Debug)]
pub struct Cache {
    lines: Vec<CacheLine>,
    pub stats: CacheStats,
    pub enabled: bool,
    pub miss_penalty: u32,  // Cycles de pénalité pour un miss
}

impl Cache {
    pub fn new() -> Self {
        let mut lines = Vec::with_capacity(CACHE_LINES);
        for _ in 0..CACHE_LINES {
            lines.push(CacheLine::new());
        }
        Self {
            lines,
            stats: CacheStats::new(),
            enabled: true,
            miss_penalty: 10,  // 10 cycles par défaut
        }
    }

    /// Extrait le tag de l'adresse
    fn get_tag(addr: u32) -> u32 {
        addr >> (INDEX_BITS + OFFSET_BITS)
    }

    /// Extrait l'index de l'adresse
    fn get_index(addr: u32) -> usize {
        ((addr >> OFFSET_BITS) & ((1 << INDEX_BITS) - 1)) as usize
    }

    /// Extrait l'offset de l'adresse
    fn get_offset(addr: u32) -> usize {
        (addr & ((1 << OFFSET_BITS) - 1)) as usize
    }

    /// Adresse de base de la ligne (alignée sur LINE_SIZE)
    fn line_base_addr(addr: u32) -> u32 {
        addr & !((LINE_SIZE as u32) - 1)
    }

    /// Vérifie si une adresse est dans le cache (hit)
    pub fn lookup(&self, addr: u32) -> bool {
        if !self.enabled {
            return false;
        }
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);
        let line = &self.lines[index];
        line.valid && line.tag == tag
    }

    /// Lecture depuis le cache (retourne None si miss)
    pub fn read(&mut self, addr: u32) -> Option<u8> {
        if !self.enabled {
            return None;
        }
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);
        let offset = Self::get_offset(addr);

        let line = &self.lines[index];
        if line.valid && line.tag == tag {
            self.stats.hits += 1;
            self.stats.read_hits += 1;
            Some(line.data[offset])
        } else {
            self.stats.misses += 1;
            self.stats.read_misses += 1;
            None
        }
    }

    /// Lecture d'un mot 32 bits depuis le cache
    pub fn read32(&mut self, addr: u32) -> Option<u32> {
        if !self.enabled {
            return None;
        }
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);
        let offset = Self::get_offset(addr);

        let line = &self.lines[index];
        if line.valid && line.tag == tag {
            self.stats.hits += 1;
            self.stats.read_hits += 1;
            let b0 = line.data[offset] as u32;
            let b1 = line.data[offset + 1] as u32;
            let b2 = line.data[offset + 2] as u32;
            let b3 = line.data[offset + 3] as u32;
            Some(b0 | (b1 << 8) | (b2 << 16) | (b3 << 24))
        } else {
            self.stats.misses += 1;
            self.stats.read_misses += 1;
            None
        }
    }

    /// Écriture dans le cache (write-through: doit aussi écrire en mémoire)
    /// Retourne true si hit, false si miss
    pub fn write(&mut self, addr: u32, value: u8) -> bool {
        if !self.enabled {
            return false;
        }
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);
        let offset = Self::get_offset(addr);

        let line = &mut self.lines[index];
        if line.valid && line.tag == tag {
            self.stats.hits += 1;
            self.stats.write_hits += 1;
            line.data[offset] = value;
            true
        } else {
            self.stats.misses += 1;
            self.stats.write_misses += 1;
            false
        }
    }

    /// Écriture d'un mot 32 bits
    pub fn write32(&mut self, addr: u32, value: u32) -> bool {
        if !self.enabled {
            return false;
        }
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);
        let offset = Self::get_offset(addr);

        let line = &mut self.lines[index];
        if line.valid && line.tag == tag {
            self.stats.hits += 1;
            self.stats.write_hits += 1;
            line.data[offset] = (value & 0xFF) as u8;
            line.data[offset + 1] = ((value >> 8) & 0xFF) as u8;
            line.data[offset + 2] = ((value >> 16) & 0xFF) as u8;
            line.data[offset + 3] = ((value >> 24) & 0xFF) as u8;
            true
        } else {
            self.stats.misses += 1;
            self.stats.write_misses += 1;
            false
        }
    }

    /// Charge une ligne depuis la mémoire
    pub fn fill_line(&mut self, addr: u32, data: &[u8; LINE_SIZE]) {
        let index = Self::get_index(addr);
        let tag = Self::get_tag(addr);

        let line = &mut self.lines[index];
        line.valid = true;
        line.tag = tag;
        line.data.copy_from_slice(data);
    }

    /// Charge une ligne depuis un vecteur mémoire
    pub fn fill_line_from_mem(&mut self, addr: u32, mem: &[u8]) {
        let base = Self::line_base_addr(addr) as usize;
        if base + LINE_SIZE <= mem.len() {
            let index = Self::get_index(addr);
            let tag = Self::get_tag(addr);

            let line = &mut self.lines[index];
            line.valid = true;
            line.tag = tag;
            line.data.copy_from_slice(&mem[base..base + LINE_SIZE]);
        }
    }

    /// Invalide une ligne
    pub fn invalidate(&mut self, addr: u32) {
        let index = Self::get_index(addr);
        self.lines[index].valid = false;
    }

    /// Invalide tout le cache
    pub fn flush(&mut self) {
        for line in &mut self.lines {
            line.valid = false;
        }
    }

    /// Reset des statistiques
    pub fn reset_stats(&mut self) {
        self.stats = CacheStats::new();
    }

    /// Retourne l'état d'une ligne (pour visualisation)
    pub fn get_line_state(&self, index: usize) -> Option<(bool, u32, &[u8; LINE_SIZE])> {
        if index < CACHE_LINES {
            let line = &self.lines[index];
            Some((line.valid, line.tag, &line.data))
        } else {
            None
        }
    }

    /// Nombre de lignes
    pub fn num_lines(&self) -> usize {
        CACHE_LINES
    }

    /// Taille d'une ligne
    pub fn line_size(&self) -> usize {
        LINE_SIZE
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_hit_miss() {
        let mut cache = Cache::new();

        // Miss initial
        assert!(cache.read32(0x1000).is_none());
        assert_eq!(cache.stats.misses, 1);

        // Fill la ligne
        let data: [u8; 16] = [
            0x11, 0x22, 0x33, 0x44,  // mot 0
            0x55, 0x66, 0x77, 0x88,  // mot 1
            0x99, 0xAA, 0xBB, 0xCC,  // mot 2
            0xDD, 0xEE, 0xFF, 0x00,  // mot 3
        ];
        cache.fill_line(0x1000, &data);

        // Hit
        assert_eq!(cache.read32(0x1000), Some(0x44332211));
        assert_eq!(cache.stats.hits, 1);

        // Même ligne, offset différent
        assert_eq!(cache.read32(0x1004), Some(0x88776655));
        assert_eq!(cache.stats.hits, 2);
    }

    #[test]
    fn test_cache_conflict() {
        let mut cache = Cache::new();

        // Deux adresses avec le même index mais tags différents
        let addr1 = 0x00001000;  // index = (0x1000 >> 4) & 0x3F = 0
        let addr2 = 0x00011000;  // même index, tag différent

        let data1: [u8; 16] = [0x11; 16];
        let data2: [u8; 16] = [0x22; 16];

        cache.fill_line(addr1, &data1);
        assert!(cache.lookup(addr1));

        // Conflit: addr2 évince addr1
        cache.fill_line(addr2, &data2);
        assert!(cache.lookup(addr2));
        assert!(!cache.lookup(addr1));  // addr1 évincée
    }

    #[test]
    fn test_write_through() {
        let mut cache = Cache::new();

        let data: [u8; 16] = [0; 16];
        cache.fill_line(0x1000, &data);

        // Écriture (hit)
        assert!(cache.write32(0x1000, 0xDEADBEEF));
        assert_eq!(cache.read32(0x1000), Some(0xDEADBEEF));
    }
}
