#[derive(Clone, Debug)]
pub struct Memory {
    data: Vec<u8>,
}

impl Memory {
    pub fn new(size: usize) -> Self {
        Self {
            data: vec![0; size],
        }
    }

    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn read8(&self, addr: u32) -> Option<u8> {
        self.data.get(addr as usize).copied()
    }

    pub fn write8(&mut self, addr: u32, value: u8) -> Option<()> {
        let slot = self.data.get_mut(addr as usize)?;
        *slot = value;
        Some(())
    }

    pub fn read32_le(&self, addr: u32) -> Option<u32> {
        let base = addr as usize;
        if base + 3 >= self.data.len() {
            return None;
        }
        let b0 = self.data[base] as u32;
        let b1 = self.data[base + 1] as u32;
        let b2 = self.data[base + 2] as u32;
        let b3 = self.data[base + 3] as u32;
        Some(b0 | (b1 << 8) | (b2 << 16) | (b3 << 24))
    }

    pub fn write32_le(&mut self, addr: u32, value: u32) -> Option<()> {
        let base = addr as usize;
        if base + 3 >= self.data.len() {
            return None;
        }
        self.data[base] = (value & 0xFF) as u8;
        self.data[base + 1] = ((value >> 8) & 0xFF) as u8;
        self.data[base + 2] = ((value >> 16) & 0xFF) as u8;
        self.data[base + 3] = ((value >> 24) & 0xFF) as u8;
        Some(())
    }
}
